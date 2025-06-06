# HomeVerse API Documentation

## 🎯 Overview

The HomeVerse API is a production-ready FastAPI backend that provides comprehensive endpoints for affordable housing analytics, CRA compliance reporting, and multi-tenant data management with AI-powered applicant-project matching.

**Base URL**: `https://api.homeverse.com` (production) or `http://localhost:8000` (development)
**API Version**: v1
**Framework**: FastAPI with async/await patterns
**Database**: PostgreSQL with PostGIS extension for geospatial data

## 🔐 Authentication

### **Multi-Tenant Authentication**
All API requests require both JWT authentication and company context:

```http
Authorization: Bearer <jwt_token>
x-company-key: <company_key>
```

### **Authentication Endpoints**

#### **Register User**
```http
POST /v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure123",
  "company_key": "acme-corp",
  "role": "user"
}
```

**Supported Roles**: `user`, `admin`, `viewer`
**Company Auto-Creation**: Companies are automatically created if they don't exist

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "developer",
    "company_id": "comp_456"
  },
  "company": {
    "id": "comp_456",
    "name": "ACME Corporation",
    "company_key": "acme-corp",
    "plan": "trial"
  }
}
```

#### **Login User**
```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure123"
}
```

#### **Get Current User**
```http
GET /v1/auth/me
Authorization: Bearer <token>
x-company-key: <company_key>
```

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "role": "user",
  "company_id": "comp_456",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## 👥 Applicants API

### **List Applicants**
```http
GET /v1/applicants?skip=0&limit=50&ami_band=80%&household_size=3
Authorization: Bearer <token>
x-company-key: <company_key>
```

**Query Parameters:**
- `skip` (int): Number of records to skip (pagination)
- `limit` (int): Maximum records to return (max 100)
- `ami_band` (string): Filter by AMI band (e.g., "30%", "50%", "80%")
- `household_size` (int): Filter by household size
- `search` (string): Search by name or email

**Response:**
```json
{
  "items": [
    {
      "id": "app_123",
      "name": "Maria Rodriguez",
      "email": "maria@example.com",
      "phone": "+1-555-123-4567",
      "household_size": 3,
      "annual_income": 75000,
      "ami_percentage": 65,
      "geo_point": [37.7749, -122.4194],
      "preferences": {
        "location": "San Francisco",
        "amenities": ["transit", "schools"],
        "unit_type": "2BR"
      },
      "documents": [
        {
          "type": "income_verification",
          "url": "https://storage.example.com/doc_123.pdf",
          "uploaded_at": "2024-01-15T10:30:00Z"
        }
      ],
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "pages": 4,
  "has_next": true
}
```

### **Create Applicant**
```http
POST /v1/applicants
Authorization: Bearer <token>
x-company-key: <company_key>
Content-Type: application/json

{
  "name": "Maria Rodriguez",
  "email": "maria@example.com",
  "phone": "+1-555-123-4567",
  "household_size": 3,
  "annual_income": 75000,
  "geo_point": [37.7749, -122.4194],
  "preferences": {
    "location": "San Francisco",
    "amenities": ["transit", "schools"],
    "unit_type": "2BR"
  }
}
```

### **Find Available Projects**
```http
GET /v1/projects/available?lat=37.7749&lon=-122.4194&radius_miles=25&ami_band=80%
Authorization: Bearer <token>
x-company-key: <company_key>
```

**Query Parameters:**
- `lat`, `lon` (required): Geographic coordinates
- `radius_miles`: Search radius (default 25, max 100)
- `ami_band`: AMI eligibility filter

### **Get Applicant**
```http
GET /v1/applicants/{applicant_id}
Authorization: Bearer <token>
x-company-key: <company_key>
```

### **Update Applicant**
```http
PUT /v1/applicants/{applicant_id}
Authorization: Bearer <token>
x-company-key: <company_key>
Content-Type: application/json

{
  "household_size": 4,
  "annual_income": 85000
}
```

### **Delete Applicant**
```http
DELETE /v1/applicants/{applicant_id}
Authorization: Bearer <token>
x-company-key: <company_key>
```

## 🏗️ Projects API

### **List Projects**
```http
GET /v1/projects?skip=0&limit=50&status=active&ami_min=30&ami_max=80
Authorization: Bearer <token>
x-company-key: <company_key>
```

**Query Parameters:**
- `skip`, `limit`: Pagination parameters
- `status`: Filter by project status (`planning`, `construction`, `active`, `completed`)
- `ami_min`, `ami_max`: Filter by AMI range
- `developer_name`: Filter by developer
- `location_bounds`: Geographic bounding box filter

**Response:**
```json
{
  "items": [
    {
      "id": "proj_123",
      "name": "Sunset Gardens",
      "developer_name": "Urban Housing LLC",
      "location": [37.7749, -122.4194],
      "unit_count": 120,
      "ami_min": 30,
      "ami_max": 80,
      "status": "active",
      "est_delivery": "2024-12-15",
      "units_available": 24,
      "metadata_json": {
        "description": "Modern affordable housing project",
        "amenities": ["parking", "playground", "transit"],
        "contact_email": "leasing@sunsetgardens.com",
        "contact_phone": "+1-555-987-6543"
      },
      "created_at": "2024-01-10T14:20:00Z",
      "updated_at": "2024-01-15T09:15:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 1,
  "has_next": false
}
```

### **Create Project**
```http
POST /v1/projects
Authorization: Bearer <token>
x-company-key: <company_key>
Content-Type: application/json

{
  "name": "Sunset Gardens",
  "developer_name": "Urban Housing LLC",
  "location": [37.7749, -122.4194],
  "unit_count": 120,
  "ami_min": 30,
  "ami_max": 80,
  "est_delivery": "2024-12-15",
  "metadata_json": {
    "description": "Modern affordable housing project",
    "amenities": ["parking", "playground", "transit"],
    "contact_email": "leasing@sunsetgardens.com",
    "contact_phone": "+1-555-987-6543"
  }
}
```

### **Get Project**
```http
GET /v1/projects/{project_id}
Authorization: Bearer <token>
x-company-key: <company_key>
```

### **Update Project**
```http
PUT /v1/projects/{project_id}
Authorization: Bearer <token>
x-company-key: <company_key>
Content-Type: application/json

{
  "status": "construction",
  "units_available": 20
}
```

## 🎯 Matching API

### **Run AI Matching**
```http
POST /v1/matching/run
Authorization: Bearer <token>
x-company-key: <company_key>
Content-Type: application/json

{
  "applicant_id": "app_123",
  "project_id": "proj_456",
  "match_threshold": 0.7
}
```

**Response:**
```json
{
  "match_id": "match_789",
  "score": 0.94,
  "confidence": "high",
  "reasons": [
    "Perfect AMI match (65% fits 30-80% range)",
    "Household size matches available 2-3 bedroom units",
    "Location preference aligns with project area",
    "High income stability score"
  ],
  "applicant": {
    "id": "app_123",
    "name": "Maria Rodriguez",
    "ami_percentage": 65,
    "household_size": 3
  },
  "project": {
    "id": "proj_456",
    "name": "Sunset Gardens",
    "ami_range": "30-80%",
    "available_units": 24
  },
  "created_at": "2024-01-15T11:45:00Z"
}
```

### **Get Matches**
```http
GET /v1/matching?applicant_id=app_123&status=new&min_score=0.8
Authorization: Bearer <token>
x-company-key: <company_key>
```

**Query Parameters:**
- `applicant_id`: Filter by specific applicant
- `project_id`: Filter by specific project
- `status`: Match status (`new`, `contacted`, `interested`, `declined`)
- `min_score`: Minimum match score threshold
- `created_after`: Filter by creation date

### **Update Match Status**
```http
PATCH /v1/matching/{match_id}
Authorization: Bearer <token>
x-company-key: <company_key>
Content-Type: application/json

{
  "status": "contacted",
  "notes": "Initial contact made via email"
}
```

## 📊 Reports API

### **List Reports**
```http
GET /v1/reports?type=cra&status=completed&limit=20
Authorization: Bearer <token>
x-company-key: <company_key>
```

### **Generate Report**
```http
POST /v1/reports
Authorization: Bearer <token>
x-company-key: <company_key>
Content-Type: application/json

{
  "type": "cra_performance",
  "parameters": {
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "include_demographics": true,
    "format": "pdf"
  }
}
```

**Response:**
```json
{
  "id": "report_123",
  "type": "cra_performance",
  "status": "running",
  "progress": 0,
  "parameters": {
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "include_demographics": true,
    "format": "pdf"
  },
  "created_at": "2024-01-15T12:00:00Z",
  "estimated_completion": "2024-01-15T12:05:00Z"
}
```

### **Get Report Status**
```http
GET /v1/reports/{report_id}
Authorization: Bearer <token>
x-company-key: <company_key>
```

### **Download Report**
```http
GET /v1/reports/{report_id}/download
Authorization: Bearer <token>
x-company-key: <company_key>
```

## 🏦 Lenders API

### **Portfolio Statistics**
```http
GET /v1/lenders/portfolio/stats
Authorization: Bearer <token>
x-company-key: <company_key>
```

**Response:**
```json
{
  "total_invested": 125000000,
  "current_portfolio_value": 138750000,
  "average_roi": 8.7,
  "active_investments": 15,
  "compliance_rate": 94.2,
  "risk_score": 2.1,
  "performance_metrics": {
    "ytd_return": 12.5,
    "best_performing_project": {
      "name": "Harbor View Apartments",
      "roi": 12.8
    },
    "worst_performing_project": {
      "name": "Downtown Commons",
      "roi": 4.2
    }
  }
}
```

### **Investments List**
```http
GET /v1/lenders/investments?status=active&min_amount=1000000
Authorization: Bearer <token>
x-company-key: <company_key>
```

### **CRA Metrics**
```http
GET /v1/lenders/cra/metrics
Authorization: Bearer <token>
x-company-key: <company_key>
```

**Response:**
```json
{
  "categories": [
    {
      "category": "Low-Income Housing",
      "target": 75,
      "current": 82,
      "status": "exceeds"
    },
    {
      "category": "Community Development",
      "target": 60,
      "current": 58,
      "status": "approaching"
    }
  ],
  "overall_compliance": 94.2,
  "last_updated": "2024-01-15T08:00:00Z"
}
```

### **Heatmap Data**
```http
GET /v1/lenders/heatmap?bounds=37.7,-122.5,37.8,-122.3&data_type=investment_density
Authorization: Bearer <token>
x-company-key: <company_key>
```

**Query Parameters:**
- `bounds`: Geographic bounding box (south,west,north,east)
- `data_type`: Type of heatmap data (`investment_density`, `ami_compliance`, `opportunity_zones`)
- `time_period`: Time period for data (`1M`, `3M`, `6M`, `1Y`, `ALL`)

**Response:**
```json
{
  "data_points": [
    {
      "lat": 37.7749,
      "lng": -122.4194,
      "intensity": 8.5,
      "value": 25000000,
      "description": "High investment activity zone"
    }
  ],
  "metadata": {
    "total_points": 156,
    "data_type": "investment_density",
    "time_period": "6M",
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```

## 📈 Analytics API

### **Investment Performance**
```http
GET /v1/analytics/investment-performance?timeframe=1Y&granularity=monthly
Authorization: Bearer <token>
x-company-key: <company_key>
```

### **Market Trends**
```http
GET /v1/analytics/market-trends?region=bay_area&metrics=investment_volume,roi,compliance
Authorization: Bearer <token>
x-company-key: <company_key>
```

## 📋 Admin API

### **Company Management**
```http
GET /v1/admin/companies
Authorization: Bearer <admin_token>

POST /v1/admin/companies/{company_id}/settings
PUT /v1/admin/companies/{company_id}/plan
```

### **User Management**
```http
GET /v1/admin/users?company_id=comp_123
POST /v1/admin/users/{user_id}/roles
DELETE /v1/admin/users/{user_id}
```

### **System Health**
```http
GET /health
GET /v1/admin/system/stats
GET /v1/admin/system/metrics
```

## 🔍 Error Handling

### **Standard Error Response**
```json
{
  "detail": "Validation error",
  "errors": [
    {
      "field": "household_size",
      "message": "Must be between 1 and 10",
      "code": "value_error"
    }
  ],
  "request_id": "req_123456",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### **HTTP Status Codes**
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## 🚀 Rate Limiting

### **Rate Limits**
- **Authenticated requests**: 1000 requests per hour
- **Report generation**: 10 reports per hour
- **File uploads**: 100 uploads per hour
- **Matching operations**: 500 matches per hour

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1642608000
```

## 📦 Pagination

### **Standard Pagination**
All list endpoints support pagination with `skip` and `limit` parameters:

```http
GET /v1/applicants?skip=50&limit=25
```

### **Pagination Response**
```json
{
  "items": [...],
  "total": 156,
  "page": 3,
  "pages": 7,
  "has_next": true,
  "has_prev": true
}
```

## 🔒 Security

### **Multi-Tenant Security**
- **Row-Level Security**: Automatic data isolation by company
- **Company Key Validation**: All requests validated against company context
- **JWT Verification**: Stateless authentication with configurable expiration

### **Input Validation**
- **Pydantic Models**: All inputs validated with schema enforcement
- **SQL Injection Prevention**: Parameterized queries and ORM protection
- **XSS Protection**: Input sanitization and output encoding

### **Audit Logging**
All API operations are logged with:
- User identification
- Company context
- Timestamp and request details
- Data changes (before/after)

## 🧪 Testing the API

### **Using curl**
```bash
# Get access token
TOKEN=$(curl -X POST "http://localhost:8000/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}' \
     | jq -r '.access_token')

# Make authenticated request
curl -X GET "http://localhost:8000/v1/applicants" \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-company-key: test-company"
```

### **Using the Interactive Docs**
Visit `http://localhost:8000/docs` for Swagger UI with interactive API testing.

---

**API Version**: v1  
**Last Updated**: January 2024  
**Status**: ✅ Production Ready

For more details, visit the interactive API documentation at `/docs` when running the server.