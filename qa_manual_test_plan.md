# HomeVerse QA Manual Test Plan

## 🧪 Comprehensive Manual Testing Guide

### Test Environment
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Test Accounts
- `developer@test.com` / `password123` - Developer Portal
- `lender@test.com` / `password123` - Lender Portal
- `buyer@test.com` / `password123` - Buyer Portal
- `applicant@test.com` / `password123` - Applicant Portal
- `admin@test.com` / `password123` - Admin Portal

## 1. Authentication & Login Flow ✅

### Test Cases:
1. **Landing Page**
   - [✅] Navigate to http://localhost:3000
   - [✅] Verify HomeVerse branding and logo
   - [✅] Check "Get Started" and "Login" buttons

2. **Login Page**
   - [✅] Navigate to /login
   - [✅] Test each user role login
   - [✅] Verify correct dashboard redirect based on role
   - [✅] Test invalid credentials error handling
   - [✅] Check "Remember me" functionality

3. **Logout**
   - [✅] Test logout from each portal
   - [✅] Verify redirect to login page
   - [✅] Confirm token is cleared

## 2. Developer Portal Testing

### Dashboard
1. **Navigation**
   - [ ] Verify all menu items are clickable
   - [ ] Check active state highlighting
   - [ ] Test responsive menu on mobile

2. **Projects Management**
   - [ ] Navigate to /dashboard/projects
   - [ ] Create new project
     - [ ] Fill all required fields
     - [ ] Test validation
     - [ ] Submit and verify creation
   - [ ] View project list
   - [ ] Edit existing project
   - [ ] View project details
   - [ ] Delete project (if implemented)

3. **Applicants Management**
   - [ ] Navigate to /dashboard/applicants
   - [ ] Create new applicant
   - [ ] View applicant list with search
   - [ ] Edit applicant details
   - [ ] View full applicant profile
   - [ ] Test filtering and sorting

4. **Analytics**
   - [ ] Navigate to /dashboard/analytics
   - [ ] Verify charts load correctly
   - [ ] Test date range filters
   - [ ] Check data accuracy

5. **Map View**
   - [ ] Navigate to /dashboard/map
   - [ ] Verify map loads
   - [ ] Test project markers
   - [ ] Check info popups
   - [ ] Test filtering options

## 3. Lender Portal Testing

### Dashboard
1. **Investments**
   - [ ] Navigate to /dashboard/investments
   - [ ] View investment portfolio
   - [ ] Create new investment
   - [ ] View investment details
   - [ ] Download portfolio data

2. **Analytics**
   - [ ] Check CRA compliance metrics
   - [ ] View investment performance
   - [ ] Test export functionality

3. **Reports**
   - [ ] Generate CRA report
   - [ ] Download reports
   - [ ] Schedule automated reports

## 4. Buyer Portal Testing

1. **Project Discovery**
   - [ ] Browse available projects
   - [ ] Use search and filters
   - [ ] View project details

2. **Applications**
   - [ ] Submit application for a project
   - [ ] Upload required documents
   - [ ] Track application status
   - [ ] View application history

3. **Preferences**
   - [ ] Set housing preferences
   - [ ] Update notification settings
   - [ ] Save search criteria

## 5. Applicant Portal Testing

1. **Housing Search**
   - [ ] Search for available housing
   - [ ] Filter by criteria
   - [ ] Save favorite properties

2. **Applications**
   - [ ] Submit housing applications
   - [ ] Track application status
   - [ ] Upload documents
   - [ ] Update personal information

## 6. Admin Portal Testing

1. **User Management**
   - [ ] View all users
   - [ ] Create new users
   - [ ] Edit user roles
   - [ ] Deactivate users

2. **Company Management**
   - [ ] View companies
   - [ ] Edit company settings
   - [ ] Manage subscriptions

3. **System Settings**
   - [ ] Configure system parameters
   - [ ] View audit logs
   - [ ] Manage integrations

## 7. Common Features Testing

### Settings (All Portals)
1. **Profile Settings**
   - [ ] Update personal information
   - [ ] Change password
   - [ ] Update profile picture

2. **Company Settings**
   - [ ] View company info
   - [ ] Update company details
   - [ ] Manage team members

3. **Notification Preferences**
   - [ ] Toggle email notifications
   - [ ] Set notification frequency
   - [ ] Test notification delivery

4. **Security Settings**
   - [ ] Enable/disable 2FA
   - [ ] View login history
   - [ ] Manage API keys

### Contact & Support
1. **Contact Form**
   - [ ] Navigate to /contact
   - [ ] Fill and submit form
   - [ ] Verify email is sent
   - [ ] Check confirmation message

2. **Help Center**
   - [ ] Access documentation
   - [ ] Search functionality
   - [ ] FAQ navigation

### Footer Links
1. **Company Pages**
   - [ ] About Us page
   - [ ] Privacy Policy
   - [ ] Terms of Service
   - [ ] Careers page

## 8. Responsive Design Testing

### Mobile (320px - 768px)
- [ ] Test navigation menu
- [ ] Check form layouts
- [ ] Verify table responsiveness
- [ ] Test map interaction

### Tablet (768px - 1024px)
- [ ] Verify layout adjustments
- [ ] Check sidebar behavior
- [ ] Test touch interactions

### Desktop (1024px+)
- [ ] Full feature testing
- [ ] Multi-column layouts
- [ ] Hover states

## 9. Performance Testing

1. **Page Load Times**
   - [ ] Landing page < 3s
   - [ ] Dashboard < 2s
   - [ ] Data tables < 1s

2. **API Response Times**
   - [ ] Login < 500ms
   - [ ] Data fetch < 1s
   - [ ] File uploads < 5s

## 10. Security Testing

1. **Authentication**
   - [ ] JWT token validation
   - [ ] Session timeout
   - [ ] Role-based access

2. **Data Protection**
   - [ ] HTTPS enforcement
   - [ ] Input sanitization
   - [ ] XSS prevention

## Test Execution Summary

### Critical Issues Found:
1. API endpoints return 404 for some features
2. Some forms need field mapping updates
3. Analytics endpoints not implemented

### Working Features:
1. ✅ Authentication for all roles
2. ✅ Role-based dashboard routing
3. ✅ User profile management
4. ✅ Basic CRUD operations
5. ✅ UI/UX and branding

### Recommendations:
1. Implement missing API endpoints
2. Add comprehensive error handling
3. Improve form validation messages
4. Add loading states for async operations
5. Implement data pagination

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)