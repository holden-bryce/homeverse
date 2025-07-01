# HomeVerse Manual Testing Checklist

## Pre-Testing Setup

### Environment Setup
- [ ] Backend server running on http://localhost:8000
- [ ] Frontend server running on http://localhost:3000
- [ ] Database is seeded with test data
- [ ] Email service (SendGrid) is configured
- [ ] Map service (Mapbox) API key is valid
- [ ] All environment variables are set correctly

### Test Accounts
- [ ] Super Admin: `superadmin@test.com` / `SuperAdmin123!`
- [ ] Company Admin: `admin@homeverse-test.com` / `Admin123!`
- [ ] Manager: `manager@homeverse-test.com` / `Manager123!`
- [ ] Staff: `staff@homeverse-test.com` / `Staff123!`
- [ ] Applicant: `applicant@test.com` / `Applicant123!`
- [ ] Developer: `developer@test.com` / `password123`
- [ ] Lender: `lender@test.com` / `password123`
- [ ] Buyer: `buyer@test.com` / `password123`

## 1. Authentication & Authorization Testing

### Registration Flow
- [ ] Navigate to registration page
- [ ] Fill all required fields
- [ ] Verify password strength requirements are enforced
- [ ] Submit registration form
- [ ] Check email for verification link
- [ ] Click verification link
- [ ] Verify redirect to login page
- [ ] Login with new credentials

### Login Flow
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials
- [ ] Test "Remember Me" functionality
- [ ] Test password visibility toggle
- [ ] Test login rate limiting (5+ failed attempts)
- [ ] Verify session persistence across browser refresh

### Password Reset
- [ ] Click "Forgot Password" link
- [ ] Enter registered email
- [ ] Check email for reset link
- [ ] Click reset link
- [ ] Enter new password
- [ ] Verify password requirements
- [ ] Login with new password

### Multi-Factor Authentication (if enabled)
- [ ] Enable 2FA in settings
- [ ] Scan QR code with authenticator app
- [ ] Enter verification code
- [ ] Logout and login again
- [ ] Enter 2FA code
- [ ] Test backup codes

## 2. Role-Based Access Testing

### Super Admin Role
- [ ] Access system-wide analytics dashboard
- [ ] Create new companies
- [ ] Manage all users across companies
- [ ] View audit logs for all companies
- [ ] Configure system settings
- [ ] Access blocked for: N/A (has full access)

### Company Admin Role
- [ ] Manage company settings and profile
- [ ] Create/edit/delete team members
- [ ] View company-wide analytics
- [ ] Configure company permissions
- [ ] Access blocked for: System admin features

### Manager Role
- [ ] Create/edit projects
- [ ] Review and approve applications
- [ ] Generate reports
- [ ] View team analytics
- [ ] Access blocked for: Company settings, user management

### Staff Role
- [ ] Create/edit applicants
- [ ] Upload documents
- [ ] Send communications
- [ ] View assigned tasks
- [ ] Access blocked for: Approvals, reports, analytics

### Applicant Role
- [ ] Search for properties
- [ ] Submit applications
- [ ] Upload required documents
- [ ] Track application status
- [ ] Access blocked for: All staff features

## 3. Core Feature Testing

### Applicant Management
- [ ] **Create Applicant**
  - [ ] Fill all required fields
  - [ ] Verify SSN masking (***-**-1234)
  - [ ] Test form validation
  - [ ] Save and verify success message
  - [ ] Check applicant appears in list

- [ ] **Search Applicants**
  - [ ] Search by name
  - [ ] Search by email
  - [ ] Search by phone
  - [ ] Verify search results accuracy

- [ ] **Filter Applicants**
  - [ ] Filter by income range
  - [ ] Filter by household size
  - [ ] Filter by status
  - [ ] Combine multiple filters
  - [ ] Clear filters

- [ ] **Edit Applicant**
  - [ ] Navigate to applicant details
  - [ ] Click edit button
  - [ ] Modify various fields
  - [ ] Save changes
  - [ ] Verify updates reflected

- [ ] **Delete Applicant**
  - [ ] Click delete button
  - [ ] Confirm deletion dialog
  - [ ] Verify applicant removed from list
  - [ ] Check audit log entry

### Project Management
- [ ] **Create Project**
  - [ ] Fill project details
  - [ ] Set income requirements
  - [ ] Add amenities
  - [ ] Set application deadline
  - [ ] Publish project

- [ ] **Edit Project**
  - [ ] Update available units
  - [ ] Change requirements
  - [ ] Extend deadline
  - [ ] Save changes

- [ ] **View Applications**
  - [ ] Navigate to project applications
  - [ ] Sort by date
  - [ ] Filter by status
  - [ ] View applicant details

### Application Process
- [ ] **Submit Application** (as Applicant)
  - [ ] Search for projects
  - [ ] View project details
  - [ ] Click "Apply Now"
  - [ ] Fill application form
  - [ ] Upload required documents
  - [ ] Submit application

- [ ] **Review Application** (as Staff/Manager)
  - [ ] View pending applications
  - [ ] Open application details
  - [ ] Review documents
  - [ ] Add notes
  - [ ] Mark as reviewed

- [ ] **Approve/Reject Application** (as Manager)
  - [ ] View reviewed applications
  - [ ] Make approval decision
  - [ ] Add decision notes
  - [ ] Notify applicant

## 4. Communication Features

### Email Communications
- [ ] Send individual email
- [ ] Use email template
- [ ] Preview before sending
- [ ] Check sent items
- [ ] Verify email delivery status
- [ ] Test email bounce handling

### In-App Notifications
- [ ] Check notification bell icon
- [ ] View notification list
- [ ] Mark as read/unread
- [ ] Clear notifications
- [ ] Test real-time updates

## 5. File Management

### Document Upload
- [ ] Upload PDF documents
- [ ] Upload image files (JPG, PNG)
- [ ] Upload Word documents
- [ ] Test file size limits (>10MB)
- [ ] Test invalid file types (.exe, .bat)
- [ ] Verify file encryption

### Document Management
- [ ] View uploaded documents
- [ ] Download documents
- [ ] Delete documents
- [ ] Search documents
- [ ] Filter by type

## 6. Reporting & Analytics

### Generate Reports
- [ ] Monthly summary report
- [ ] Detailed applicant report
- [ ] Project status report
- [ ] Export as CSV
- [ ] Export as PDF
- [ ] Schedule recurring reports

### View Analytics
- [ ] Dashboard metrics
- [ ] Conversion funnel
- [ ] Time-based trends
- [ ] Geographic distribution
- [ ] Filter by date range

## 7. Settings & Configuration

### User Profile
- [ ] Update personal information
- [ ] Change password
- [ ] Update notification preferences
- [ ] Set timezone
- [ ] Upload profile picture

### Company Settings (Admin only)
- [ ] Update company information
- [ ] Configure branding
- [ ] Set business hours
- [ ] Manage integrations
- [ ] Configure email templates

### Security Settings
- [ ] Enable/disable 2FA
- [ ] View active sessions
- [ ] Revoke sessions
- [ ] Set session timeout
- [ ] Configure password policy

## 8. Mobile & Responsive Testing

### Mobile Devices (Physical Devices)
- [ ] **iPhone 12/13/14**
  - [ ] Portrait orientation
  - [ ] Landscape orientation
  - [ ] Touch gestures work
  - [ ] Forms are usable
  - [ ] Navigation is accessible

- [ ] **Android (Samsung/Pixel)**
  - [ ] Portrait orientation
  - [ ] Landscape orientation
  - [ ] Back button behavior
  - [ ] Forms are usable

### Tablet Testing
- [ ] **iPad**
  - [ ] Portrait layout
  - [ ] Landscape layout
  - [ ] Split-screen functionality

- [ ] **Android Tablet**
  - [ ] Portrait layout
  - [ ] Landscape layout

### Responsive Breakpoints
- [ ] Mobile (<768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1024px - 1920px)
- [ ] Wide screen (>1920px)

## 9. Browser Compatibility

### Desktop Browsers
- [ ] **Chrome (Latest)**
  - [ ] All features work
  - [ ] No console errors
  - [ ] Smooth performance

- [ ] **Firefox (Latest)**
  - [ ] All features work
  - [ ] No console errors
  - [ ] Date pickers work

- [ ] **Safari (Latest)**
  - [ ] All features work
  - [ ] No console errors
  - [ ] File uploads work

- [ ] **Edge (Latest)**
  - [ ] All features work
  - [ ] No console errors

## 10. Performance Testing

### Page Load Times
- [ ] Landing page (<3s)
- [ ] Login page (<2s)
- [ ] Dashboard (<3s)
- [ ] Applicant list (<3s)
- [ ] Project list (<3s)

### API Response Times
- [ ] List operations (<500ms)
- [ ] Search operations (<1s)
- [ ] Create operations (<1s)
- [ ] Update operations (<1s)

### Concurrent Usage
- [ ] Test with 5 users simultaneously
- [ ] Test with 10 users simultaneously
- [ ] Monitor for slowdowns
- [ ] Check for race conditions

## 11. Security Testing

### Input Validation
- [ ] Test XSS payloads in forms
- [ ] Test SQL injection attempts
- [ ] Verify input sanitization
- [ ] Test file upload restrictions

### Authorization
- [ ] Try accessing unauthorized endpoints
- [ ] Test direct URL access
- [ ] Verify API authorization
- [ ] Test role elevation attempts

### Data Protection
- [ ] Verify PII encryption
- [ ] Check secure connections (HTTPS)
- [ ] Test session security
- [ ] Verify audit logging

## 12. Integration Testing

### Email (SendGrid)
- [ ] Test email delivery
- [ ] Verify email templates
- [ ] Check spam folder
- [ ] Test bounce handling

### Maps (Mapbox)
- [ ] Map loads correctly
- [ ] Markers display
- [ ] Clustering works
- [ ] Search functionality

### File Storage (Supabase)
- [ ] Upload files
- [ ] Download files
- [ ] Delete files
- [ ] Verify storage limits

## 13. Error Handling

### Network Errors
- [ ] Test offline behavior
- [ ] Test slow connections
- [ ] Test timeout handling
- [ ] Verify retry mechanisms

### User Errors
- [ ] Invalid form submissions
- [ ] Duplicate entries
- [ ] Missing required fields
- [ ] Invalid file formats

### System Errors
- [ ] Server errors (500)
- [ ] Not found errors (404)
- [ ] Unauthorized errors (401)
- [ ] Forbidden errors (403)

## 14. Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all elements
- [ ] Enter/Space activation
- [ ] Escape to close modals
- [ ] Arrow keys in menus

### Screen Reader
- [ ] NVDA (Windows)
- [ ] JAWS (Windows)
- [ ] VoiceOver (Mac/iOS)
- [ ] TalkBack (Android)

### Visual Accessibility
- [ ] Color contrast (WCAG AA)
- [ ] Font sizes readable
- [ ] Focus indicators visible
- [ ] No color-only information

## 15. End-to-End Scenarios

### Scenario 1: Complete Application Flow
1. [ ] Register as new applicant
2. [ ] Verify email
3. [ ] Complete profile
4. [ ] Search for housing
5. [ ] Submit application
6. [ ] Upload documents
7. [ ] Track status
8. [ ] Receive decision

### Scenario 2: Staff Workflow
1. [ ] Login as staff
2. [ ] Create new applicant
3. [ ] Upload documents
4. [ ] Submit to manager
5. [ ] Send communication
6. [ ] Update status
7. [ ] Generate report

### Scenario 3: Manager Approval Process
1. [ ] Login as manager
2. [ ] Review applications
3. [ ] Check documents
4. [ ] Make decision
5. [ ] Add notes
6. [ ] Notify applicant
7. [ ] Update project

## Testing Sign-Off

### Test Execution
- [ ] All critical paths tested
- [ ] No blocking issues found
- [ ] Performance acceptable
- [ ] Security validated
- [ ] Accessibility confirmed

### Tester Information
- **Tester Name:** _______________________
- **Date Tested:** _______________________
- **Environment:** _______________________
- **Version:** _______________________

### Issues Found
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Recommendations
1. _______________________________________
2. _______________________________________
3. _______________________________________

---

**Note:** This checklist should be executed before each major release. Any failures should be documented and resolved before deployment.