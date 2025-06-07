"""
MCP (Model Context Protocol) Integration Package for HomeVerse
Provides standardized interfaces for external data sources
"""

from .providers import *
from .client import MCPClient
from .config import MCPConfig

__all__ = [
    'MCPClient', 
    'MCPConfig',
    'RealEstateProvider',
    'FinancialProvider', 
    'GovernmentProvider',
    'CreditProvider'
]