"""Unit tests for security utilities"""
import pytest
from datetime import datetime, timedelta
from jose import jwt

from app.utils.security import create_access_token, verify_token


class TestSecurity:
    """Test security utilities"""
    
    def test_create_access_token(self):
        """Test JWT token creation"""
        data = {"sub": "test-user-id"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_access_token_with_expiry(self):
        """Test JWT token creation with custom expiry"""
        data = {"sub": "test-user-id"}
        expires_delta = timedelta(minutes=15)
        token = create_access_token(data, expires_delta)
        
        # Decode token to check expiry
        from app.utils.security import SECRET_KEY, ALGORITHM
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        exp = datetime.fromtimestamp(payload["exp"])
        now = datetime.utcnow()
        
        # Check that expiry is within expected range
        assert (exp - now).total_seconds() < 16 * 60  # Less than 16 minutes
        assert (exp - now).total_seconds() > 14 * 60  # More than 14 minutes
    
    def test_verify_token_valid(self):
        """Test token verification with valid token"""
        data = {"sub": "test-user-id"}
        token = create_access_token(data)
        
        result = verify_token(token)
        assert result["user_id"] == "test-user-id"
    
    def test_verify_token_invalid(self):
        """Test token verification with invalid token"""
        from fastapi import HTTPException
        
        with pytest.raises(HTTPException) as exc_info:
            verify_token("invalid-token")
        
        assert exc_info.value.status_code == 401
    
    def test_verify_token_expired(self):
        """Test token verification with expired token"""
        from fastapi import HTTPException
        
        # Create token that's already expired
        data = {"sub": "test-user-id"}
        expires_delta = timedelta(seconds=-1)
        token = create_access_token(data, expires_delta)
        
        with pytest.raises(HTTPException) as exc_info:
            verify_token(token)
        
        assert exc_info.value.status_code == 401