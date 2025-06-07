# Activity Tracking Implementation

## Overview
This document describes the comprehensive activity tracking system that has been implemented for the HomeVerse platform. The system tracks all user actions and provides clickable activity cards with detailed views.

## Backend Implementation

### 1. Database Schema
Added `activity_logs` table to track all user activities:
```sql
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata TEXT,
    status TEXT DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
)
```

### 2. Activity Logging Functions
- `log_activity()` - Helper function to log activities
- `get_activities()` - Retrieve activities with pagination
- `get_activity_detail()` - Get detailed information about a specific activity

### 3. API Endpoints
- `GET /api/v1/activities` - List activities with filtering
- `GET /api/v1/activities/{activity_id}` - Get activity details

### 4. Automatic Activity Logging
Activities are automatically logged for:
- User login/logout
- Creating applicants
- Updating applicants
- Creating projects
- Updating projects
- Generating reports

### 5. Sample Data
Sample activities are created for the lender user during startup:
- New Investment Made
- CRA Report Completed
- Project Milestone Reached
- Portfolio Update

## Frontend Implementation

### 1. Enhanced ActivityFeed Component
Updated `/frontend/src/components/layout/enhanced-dashboard.tsx`:
- Made activity cards clickable
- Added `onActivityClick` prop
- Enhanced hover states
- Added entity navigation support

### 2. Activity Detail Modal
Created `/frontend/src/components/ui/activity-modal.tsx`:
- Shows full activity details
- Displays metadata
- Navigation to related entities
- Responsive design with loading states

### 3. Activities Page
Created `/frontend/src/app/dashboard/activities/page.tsx`:
- Full activity log view
- Search and filter capabilities
- Activity type filtering
- Export functionality
- Pagination support

### 4. API Integration
Added to `/frontend/src/lib/api/hooks.ts`:
- `useActivities()` - Fetch activities with filtering
- `useActivityDetail()` - Get activity details

### 5. Utility Functions
Added `formatDistanceToNow()` to display relative timestamps

## Usage

### Testing the Implementation

1. Start the backend:
```bash
python3 simple_backend.py
```

2. Start the frontend:
```bash
cd frontend && npm run dev
```

3. Login as lender:
- Email: `lender@test.com`
- Password: `password123`

4. View activities:
- Recent activities appear in the dashboard
- Click any activity card to see details
- Click "View All" to see full activity log

5. Generate new activities:
- Create a new applicant
- Update an existing project
- Generate a report

### Test Script
Run the test script to verify functionality:
```bash
python3 test_activities.py
```

## Features

### Activity Types
- `investment` - Investment-related activities
- `project` - Project creation/updates
- `applicant` - Applicant management
- `compliance` - Reports and compliance
- `auth` - Authentication events
- `notification` - System notifications

### Activity Statuses
- `success` - Successful operations (green)
- `warning` - Warnings or attention needed (yellow)
- `error` - Failed operations (red)
- `info` - Informational (teal)

### Entity Navigation
Clicking on activities with related entities navigates to:
- Projects → `/dashboard/projects/{id}`
- Applicants → `/dashboard/applicants/{id}`
- Investments → `/dashboard/lenders/investments/{id}`
- Reports → `/dashboard/lenders/reports`

## Data Persistence
All activities are stored in the SQLite database and persist across sessions. The in-memory storage approach ensures fast access while maintaining data integrity.

## Security
- Activities are filtered by company_id
- Users can only see activities from their own company
- JWT authentication required for all endpoints

## Future Enhancements
1. Real-time activity updates using WebSockets
2. Activity notifications
3. Advanced filtering (date ranges, users)
4. Activity analytics and reporting
5. Bulk activity operations
6. Activity archival system