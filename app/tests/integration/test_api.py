"""Integration tests for API endpoints"""
import pytest
from fastapi.testclient import TestClient


class TestAuthAPI:
    """Test authentication endpoints"""
    
    def test_login_success(self, test_client: TestClient, test_user):
        """Test successful login"""
        response = test_client.post(
            "/v1/auth/login",
            json={"email": "test@example.com", "password": "testpass123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "test@example.com"
    
    def test_login_invalid_credentials(self, test_client: TestClient):
        """Test login with invalid credentials"""
        response = test_client.post(
            "/v1/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"}
        )
        
        assert response.status_code == 401
    
    def test_register_success(self, test_client: TestClient):
        """Test successful registration"""
        response = test_client.post(
            "/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "newpass123",
                "company_key": "test-company",
                "role": "user"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
    
    def test_register_duplicate_email(self, test_client: TestClient, test_user):
        """Test registration with duplicate email"""
        response = test_client.post(
            "/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "newpass123",
                "company_key": "test-company"
            }
        )
        
        assert response.status_code == 400
    
    def test_get_current_user(self, test_client: TestClient, auth_headers):
        """Test getting current user info"""
        response = test_client.get("/v1/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["role"] == "admin"


class TestApplicantsAPI:
    """Test applicants endpoints"""
    
    def test_create_applicant(self, test_client: TestClient, auth_headers):
        """Test creating applicant"""
        response = test_client.post(
            "/v1/applicants/",
            json={
                "geo_point": [40.7128, -74.0060],
                "ami_band": "80%",
                "household_size": 3,
                "preferences": {"location": "downtown"}
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["ami_band"] == "80%"
        assert data["household_size"] == 3
    
    def test_list_applicants(self, test_client: TestClient, auth_headers, test_applicants):
        """Test listing applicants"""
        response = test_client.get("/v1/applicants/", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
    
    def test_get_applicant(self, test_client: TestClient, auth_headers, test_applicants):
        """Test getting specific applicant"""
        applicant_id = test_applicants[0].id
        response = test_client.get(f"/v1/applicants/{applicant_id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(applicant_id)
    
    def test_update_applicant(self, test_client: TestClient, auth_headers, test_applicants):
        """Test updating applicant"""
        applicant_id = test_applicants[0].id
        response = test_client.put(
            f"/v1/applicants/{applicant_id}",
            json={"household_size": 4},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["household_size"] == 4
    
    def test_delete_applicant(self, test_client: TestClient, auth_headers, test_applicants):
        """Test deleting applicant"""
        applicant_id = test_applicants[0].id
        response = test_client.delete(f"/v1/applicants/{applicant_id}", headers=auth_headers)
        
        assert response.status_code == 200


class TestProjectsAPI:
    """Test projects endpoints"""
    
    def test_create_project(self, test_client: TestClient, auth_headers):
        """Test creating project"""
        response = test_client.post(
            "/v1/projects/",
            json={
                "name": "Test Project",
                "developer_name": "Test Developer",
                "location": [40.7128, -74.0060],
                "unit_count": 50,
                "ami_min": 60,
                "ami_max": 120,
                "est_delivery": "Q2 2024"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Project"
        assert data["unit_count"] == 50
    
    def test_list_projects(self, test_client: TestClient, auth_headers, test_projects):
        """Test listing projects"""
        response = test_client.get("/v1/projects/", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
    
    def test_get_available_projects(self, test_client: TestClient, auth_headers, test_projects):
        """Test getting available projects by location"""
        response = test_client.get(
            "/v1/projects/available",
            params={
                "lat": 40.7128,
                "lon": -74.0060,
                "radius_miles": 10,
                "ami_band": "80%"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestReportsAPI:
    """Test reports endpoints"""
    
    def test_create_cra_report(self, test_client: TestClient, auth_headers):
        """Test creating CRA report"""
        response = test_client.post(
            "/v1/reports/",
            json={
                "report_type": "cra",
                "parameters": {"time_period_days": 90},
                "format": "pdf"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "cra"
        assert data["status"] == "pending"
    
    def test_list_reports(self, test_client: TestClient, auth_headers):
        """Test listing reports"""
        response = test_client.get("/v1/reports/", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestHealthCheck:
    """Test health check endpoint"""
    
    def test_health_check(self, test_client: TestClient):
        """Test health check endpoint"""
        response = test_client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "homeverse-api"