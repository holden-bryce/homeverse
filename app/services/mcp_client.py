"""
Model Context Protocol (MCP) Client for HomeVerse
Provides centralized interface for external data integrations
"""
import asyncio
import json
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from enum import Enum
import httpx
import websockets
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class MCPTransport(Enum):
    HTTP = "http"
    WEBSOCKET = "websocket"
    STDIO = "stdio"

@dataclass
class MCPProvider:
    """Configuration for an MCP provider"""
    name: str
    transport: MCPTransport
    endpoint: str
    api_key: Optional[str] = None
    timeout: int = 30
    rate_limit: Optional[int] = None
    retry_attempts: int = 3
    capabilities: List[str] = None

@dataclass
class MCPRequest:
    """MCP request structure"""
    method: str
    params: Dict[str, Any]
    provider: str
    request_id: Optional[str] = None

@dataclass
class MCPResponse:
    """MCP response structure"""
    success: bool
    data: Any
    error: Optional[str] = None
    provider: str
    request_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class MCPClient:
    """Central MCP client for managing external data providers"""
    
    def __init__(self):
        self.providers: Dict[str, MCPProvider] = {}
        self.connections: Dict[str, Any] = {}
        self.rate_limiters: Dict[str, List[datetime]] = {}
        
    def register_provider(self, provider: MCPProvider) -> None:
        """Register a new MCP provider"""
        self.providers[provider.name] = provider
        self.rate_limiters[provider.name] = []
        logger.info(f"Registered MCP provider: {provider.name}")
        
    async def connect_provider(self, provider_name: str) -> bool:
        """Establish connection to an MCP provider"""
        if provider_name not in self.providers:
            logger.error(f"Provider {provider_name} not registered")
            return False
            
        provider = self.providers[provider_name]
        
        try:
            if provider.transport == MCPTransport.HTTP:
                self.connections[provider_name] = httpx.AsyncClient(
                    timeout=provider.timeout,
                    headers={"Authorization": f"Bearer {provider.api_key}"} if provider.api_key else {}
                )
            elif provider.transport == MCPTransport.WEBSOCKET:
                self.connections[provider_name] = await websockets.connect(
                    provider.endpoint,
                    timeout=provider.timeout
                )
            
            logger.info(f"Connected to MCP provider: {provider_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to provider {provider_name}: {e}")
            return False
    
    async def disconnect_provider(self, provider_name: str) -> None:
        """Disconnect from an MCP provider"""
        if provider_name in self.connections:
            connection = self.connections[provider_name]
            
            if isinstance(connection, httpx.AsyncClient):
                await connection.aclose()
            elif hasattr(connection, 'close'):
                await connection.close()
                
            del self.connections[provider_name]
            logger.info(f"Disconnected from MCP provider: {provider_name}")
    
    def _check_rate_limit(self, provider_name: str) -> bool:
        """Check if request is within rate limits"""
        provider = self.providers.get(provider_name)
        if not provider or not provider.rate_limit:
            return True
            
        now = datetime.now()
        minute_ago = now - timedelta(minutes=1)
        
        # Clean old requests
        self.rate_limiters[provider_name] = [
            req_time for req_time in self.rate_limiters[provider_name]
            if req_time > minute_ago
        ]
        
        # Check limit
        return len(self.rate_limiters[provider_name]) < provider.rate_limit
    
    def _record_request(self, provider_name: str) -> None:
        """Record a request for rate limiting"""
        self.rate_limiters[provider_name].append(datetime.now())
    
    async def send_request(self, request: MCPRequest) -> MCPResponse:
        """Send request to MCP provider"""
        if request.provider not in self.providers:
            return MCPResponse(
                success=False,
                error=f"Provider {request.provider} not registered",
                data=None,
                provider=request.provider,
                request_id=request.request_id
            )
        
        if not self._check_rate_limit(request.provider):
            return MCPResponse(
                success=False,
                error="Rate limit exceeded",
                data=None,
                provider=request.provider,
                request_id=request.request_id
            )
        
        provider = self.providers[request.provider]
        
        # Ensure connection exists
        if request.provider not in self.connections:
            connected = await self.connect_provider(request.provider)
            if not connected:
                return MCPResponse(
                    success=False,
                    error="Failed to connect to provider",
                    data=None,
                    provider=request.provider,
                    request_id=request.request_id
                )
        
        self._record_request(request.provider)
        
        # Retry logic
        last_error = None
        for attempt in range(provider.retry_attempts):
            try:
                if provider.transport == MCPTransport.HTTP:
                    response = await self._send_http_request(request)
                elif provider.transport == MCPTransport.WEBSOCKET:
                    response = await self._send_websocket_request(request)
                else:
                    raise ValueError(f"Unsupported transport: {provider.transport}")
                
                return response
                
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Attempt {attempt + 1} failed for {request.provider}: {e}")
                if attempt < provider.retry_attempts - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        return MCPResponse(
            success=False,
            error=f"All retry attempts failed. Last error: {last_error}",
            data=None,
            provider=request.provider,
            request_id=request.request_id
        )
    
    async def _send_http_request(self, request: MCPRequest) -> MCPResponse:
        """Send HTTP request to MCP provider"""
        connection = self.connections[request.provider]
        provider = self.providers[request.provider]
        
        payload = {
            "method": request.method,
            "params": request.params,
            "id": request.request_id or f"req_{datetime.now().timestamp()}"
        }
        
        response = await connection.post(
            provider.endpoint,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            return MCPResponse(
                success=True,
                data=data.get("result"),
                provider=request.provider,
                request_id=request.request_id,
                metadata={"status_code": response.status_code, "headers": dict(response.headers)}
            )
        else:
            return MCPResponse(
                success=False,
                error=f"HTTP {response.status_code}: {response.text}",
                data=None,
                provider=request.provider,
                request_id=request.request_id
            )
    
    async def _send_websocket_request(self, request: MCPRequest) -> MCPResponse:
        """Send WebSocket request to MCP provider"""
        connection = self.connections[request.provider]
        
        payload = {
            "method": request.method,
            "params": request.params,
            "id": request.request_id or f"req_{datetime.now().timestamp()}"
        }
        
        await connection.send(json.dumps(payload))
        response_data = await connection.recv()
        response = json.loads(response_data)
        
        if "result" in response:
            return MCPResponse(
                success=True,
                data=response["result"],
                provider=request.provider,
                request_id=request.request_id
            )
        else:
            return MCPResponse(
                success=False,
                error=response.get("error", "Unknown error"),
                data=None,
                provider=request.provider,
                request_id=request.request_id
            )
    
    async def batch_request(self, requests: List[MCPRequest]) -> List[MCPResponse]:
        """Send multiple requests concurrently"""
        tasks = [self.send_request(req) for req in requests]
        return await asyncio.gather(*tasks, return_exceptions=True)
    
    async def get_provider_capabilities(self, provider_name: str) -> List[str]:
        """Get capabilities of a provider"""
        if provider_name not in self.providers:
            return []
        
        provider = self.providers[provider_name]
        if provider.capabilities:
            return provider.capabilities
        
        # Try to fetch capabilities from provider
        try:
            request = MCPRequest(
                method="capabilities",
                params={},
                provider=provider_name
            )
            response = await self.send_request(request)
            if response.success:
                return response.data.get("capabilities", [])
        except Exception as e:
            logger.warning(f"Could not fetch capabilities for {provider_name}: {e}")
        
        return []
    
    async def health_check(self, provider_name: str) -> bool:
        """Check if provider is healthy"""
        try:
            request = MCPRequest(
                method="ping",
                params={},
                provider=provider_name
            )
            response = await self.send_request(request)
            return response.success
        except Exception:
            return False
    
    async def shutdown(self) -> None:
        """Shutdown all connections"""
        for provider_name in list(self.connections.keys()):
            await self.disconnect_provider(provider_name)

# Global MCP client instance
mcp_client = MCPClient()