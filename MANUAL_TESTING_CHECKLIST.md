# HomeVerse Manual Testing Checklist

## 🔍 Testing Overview

This comprehensive manual testing checklist covers all critical user journeys, features, and edge cases for the HomeVerse application. Each test should be performed systematically across different browsers and devices.

### Test Environment Setup
- **Frontend URL**: http://localhost:3000 (dev) / https://homeverse-frontend.onrender.com (prod)
- **Backend URL**: http://localhost:8000 (dev) / https://homeverse-api.onrender.com (prod)
- **Test Accounts**: See `TEST_LOGINS.md` for credentials

### Browser Matrix
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

---

## 1. 🔐 Authentication & Authorization Testing

### 1.1 Registration Flow
- [ ] Navigate to `/auth/register`
- [ ] Verify all role options are available in dropdown
- [ ] Test with valid email format
- [ ] Test with invalid email format (should show error)
- [ ] Test password strength requirements
- [ ] Test password confirmation mismatch
- [ ] Test with existing email (should fail)
- [ ] Test rate limiting (4th registration within hour should fail)
- [ ] Verify redirect to dashboard after successful registration
- [ ] Check role-specific dashboard is shown

### 1.2 Login Flow
- [ ] Navigate to `/auth/login`
- [ ] Test with valid credentials
- [ ] Test with invalid email
- [ ] Test with wrong password
- [ ] Test "Remember Me" checkbox functionality
- [ ] Test rate limiting (6th login attempt should fail)
- [ ] Verify JWT token stored in cookies
- [ ] Test redirect to intended page after login
- [ ] Test each role redirects to correct dashboard

### 1.3 Password Reset
- [ ] Click "Forgot Password" link
- [ ] Enter valid email
- [ ] Enter non-existent email
- [ ] Check email delivery
- [ ] Test reset link functionality
- [ ] Test expired reset link
- [ ] Verify password updated successfully

### 1.4 Logout
- [ ] Click logout from dashboard
- [ ] Verify redirect to homepage
- [ ] Verify JWT token removed
- [ ] Test accessing protected route after logout (should redirect to login)

### 1.5 Session Management
- [ ] Login and note session
- [ ] Wait for session timeout (test with shortened timeout)
- [ ] Try to perform action
- [ ] Verify redirect to login with "Session expired" message
- [ ] Test "Keep me logged in" extends session

---

## 2. 👥 Role-Based Access Control (RBAC)

### 2.1 Super Admin Access
Login as `admin@test.com`:
- [ ] Access Admin Dashboard
- [ ] Create new company
- [ ] Edit company details
- [ ] View all companies
- [ ] Create users for any company
- [ ] Change user roles
- [ ] Delete users
- [ ] Access all dashboard sections
- [ ] View system-wide analytics

### 2.2 Company Admin Access
Login as company admin:
- [ ] Access company settings
- [ ] Cannot access other companies
- [ ] Manage users within company only
- [ ] View company-wide reports
- [ ] Cannot access super admin features
- [ ] Update company profile
- [ ] Manage notification settings

### 2.3 Manager Access
Login as `manager@test.com`:
- [ ] View all applications
- [ ] Approve/reject applications
- [ ] Cannot delete applicants
- [ ] Generate reports
- [ ] View analytics
- [ ] Cannot access admin sections
- [ ] Add notes to applications

### 2.4 Staff Access
Login as `staff@test.com`:
- [ ] Create new applicants
- [ ] Edit applicant information
- [ ] Cannot approve applications
- [ ] View limited reports
- [ ] Cannot access manager features
- [ ] Search and filter applicants

### 2.5 Developer Access
Login as `developer@test.com`:
- [ ] Create new projects
- [ ] Edit own projects only
- [ ] Upload project images
- [ ] View applications for own projects
- [ ] Cannot approve applications
- [ ] Update project status

### 2.6 Lender Access
Login as `lender@test.com`:
- [ ] View investment portfolio
- [ ] Create new investments
- [ ] Export portfolio data
- [ ] View CRA compliance reports
- [ ] Cannot edit projects
- [ ] Schedule investment reviews

### 2.7 Buyer Access
Login as `buyer@test.com`:
- [ ] Search available properties
- [ ] View project details
- [ ] Submit applications
- [ ] Upload documents
- [ ] Track application status
- [ ] Cannot see other buyers' applications

### 2.8 Applicant Access
Login as `applicant@test.com`:
- [ ] Complete profile
- [ ] Search for housing
- [ ] Submit applications
- [ ] Upload required documents
- [ ] Track application status
- [ ] Update personal information

---

## 3. 🏠 Applicant Management

### 3.1 Create Applicant
- [ ] Navigate to `/dashboard/applicants/new`
- [ ] Fill all required fields
- [ ] Test field validation:
  - [ ] Invalid email format
  - [ ] Invalid phone format
  - [ ] Future date of birth
  - [ ] Negative income
  - [ ] Zero household size
- [ ] Submit form
- [ ] Verify success message
- [ ] Check applicant appears in list
- [ ] Verify PII is properly encrypted in database

### 3.2 View Applicant
- [ ] Click on applicant from list
- [ ] Verify all information displays
- [ ] Check calculated fields (age, income/person)
- [ ] View application history
- [ ] Check document list
- [ ] Test print view

### 3.3 Edit Applicant
- [ ] Click Edit button
- [ ] Modify various fields
- [ ] Test validation on edit
- [ ] Save changes
- [ ] Verify changes reflected
- [ ] Check audit log updated

### 3.4 Search & Filter
- [ ] Test search by name
- [ ] Test search by email
- [ ] Filter by status
- [ ] Filter by income range
- [ ] Filter by household size
- [ ] Combine multiple filters
- [ ] Test pagination with filters
- [ ] Export filtered results

### 3.5 Delete Applicant
- [ ] Click delete button
- [ ] Verify confirmation dialog
- [ ] Cancel deletion
- [ ] Confirm deletion
- [ ] Verify removed from list
- [ ] Check soft delete (data retained)

---

## 4. 🏗️ Project Management

### 4.1 Create Project
- [ ] Navigate to `/dashboard/projects/new`
- [ ] Fill project details
- [ ] Set AMI levels (30%, 50%, 80%)
- [ ] Set unit distribution
- [ ] Add amenities
- [ ] Set application deadline
- [ ] Upload images (test multiple)
- [ ] Test image size limits
- [ ] Submit project
- [ ] Verify geocoding works

### 4.2 Edit Project
- [ ] Modify project details
- [ ] Change status (planning → accepting → closed)
- [ ] Update unit availability
- [ ] Add/remove images
- [ ] Update AMI requirements
- [ ] Save changes
- [ ] Verify on public listing

### 4.3 Project Images
- [ ] Upload JPEG image
- [ ] Upload PNG image
- [ ] Upload large image (>5MB)
- [ ] Set primary image
- [ ] Reorder images
- [ ] Delete image
- [ ] Verify thumbnails generated

### 4.4 View Applications
- [ ] View applications for project
- [ ] Filter by status
- [ ] Sort by score
- [ ] Export application list
- [ ] Bulk approve/reject

---

## 5. 📋 Application Process

### 5.1 Submit Application
As `applicant@test.com`:
- [ ] Search for suitable project
- [ ] View project details
- [ ] Check eligibility
- [ ] Click Apply
- [ ] Fill application form
- [ ] Upload required documents:
  - [ ] Income proof
  - [ ] ID verification
  - [ ] Employment letter
  - [ ] References
- [ ] Review before submit
- [ ] Submit application
- [ ] Receive confirmation email

### 5.2 Application Review
As `manager@test.com`:
- [ ] View pending applications
- [ ] Open application details
- [ ] Review documents
- [ ] Check income eligibility
- [ ] Verify household size
- [ ] Add review notes
- [ ] Request additional info
- [ ] Approve/reject with reason

### 5.3 Status Updates
- [ ] Applicant receives email on status change
- [ ] Status reflected in dashboard
- [ ] Timeline shows all updates
- [ ] Notes visible to applicant (if allowed)

---

## 6. 📧 Communication & Notifications

### 6.1 Email Notifications
- [ ] New application submitted (to manager)
- [ ] Application approved (to applicant)
- [ ] Application rejected (to applicant)
- [ ] New project available (to buyers)
- [ ] Document requested (to applicant)
- [ ] Weekly summary (to lenders)

### 6.2 Contact Form
- [ ] Navigate to `/contact`
- [ ] Select department
- [ ] Fill form fields
- [ ] Submit inquiry
- [ ] Verify email sent
- [ ] Check auto-reply received
- [ ] Verify stored in database

### 6.3 In-App Notifications
- [ ] Bell icon shows count
- [ ] Click to view notifications
- [ ] Mark as read
- [ ] Delete notification
- [ ] Settings for notification types

---

## 7. 🗺️ Map & Visualization

### 7.1 Interactive Map
- [ ] Navigate to `/dashboard/map`
- [ ] Map loads with markers
- [ ] Zoom in/out controls work
- [ ] Click marker shows popup
- [ ] Popup has project info
- [ ] "View Details" link works
- [ ] Filter by:
  - [ ] Price range
  - [ ] Bedrooms
  - [ ] AMI level
  - [ ] Availability
- [ ] Map updates with filters

### 7.2 Heatmap View
- [ ] Toggle to heatmap mode
- [ ] Shows affordability zones
- [ ] Legend displays correctly
- [ ] Click zone for details
- [ ] Export heatmap data

---

## 8. 📊 Analytics & Reporting

### 8.1 Dashboard Analytics
- [ ] View key metrics
- [ ] Charts load correctly
- [ ] Data updates real-time
- [ ] Hover shows details
- [ ] Time range selector works
- [ ] Export chart data

### 8.2 Generate Reports
- [ ] Select report type
- [ ] Set date range
- [ ] Add filters
- [ ] Generate report
- [ ] Preview before download
- [ ] Download as PDF
- [ ] Download as Excel
- [ ] Email report

### 8.3 CRA Compliance (Lenders)
- [ ] View compliance dashboard
- [ ] Check investment distribution
- [ ] Verify AMI level tracking
- [ ] Generate CRA report
- [ ] Export for regulators

---

## 9. 🔒 Security Testing

### 9.1 Input Validation
- [ ] Test SQL injection attempts
- [ ] Test XSS in forms
- [ ] Test file upload exploits
- [ ] Verify sanitization
- [ ] Check error messages don't leak info

### 9.2 Authorization
- [ ] Try accessing other users' data
- [ ] Modify URL parameters
- [ ] Test API directly without UI
- [ ] Verify company isolation
- [ ] Check audit logging

### 9.3 File Security
- [ ] Upload malicious file types
- [ ] Test file size limits
- [ ] Verify antivirus scanning
- [ ] Check secure URLs
- [ ] Test direct file access

---

## 10. 📱 Mobile Testing

### 10.1 Responsive Design
On mobile devices:
- [ ] Homepage layout adapts
- [ ] Navigation menu works
- [ ] Forms are usable
- [ ] Tables scroll horizontally
- [ ] Images resize properly
- [ ] Buttons are tappable

### 10.2 Touch Interactions
- [ ] Swipe gestures work
- [ ] Tap targets adequate size
- [ ] No hover-dependent features
- [ ] Pinch to zoom on map
- [ ] Pull to refresh works

### 10.3 Mobile-Specific
- [ ] Test on real iPhone
- [ ] Test on real Android
- [ ] Portrait orientation
- [ ] Landscape orientation
- [ ] Test with slow connection
- [ ] Offline functionality

---

## 11. ♿ Accessibility Testing

### 11.1 Keyboard Navigation
- [ ] Tab through all elements
- [ ] Enter activates buttons
- [ ] Space checks boxes
- [ ] Arrow keys in dropdowns
- [ ] Escape closes modals
- [ ] Skip links work

### 11.2 Screen Reader
- [ ] Test with NVDA/JAWS
- [ ] All images have alt text
- [ ] Form labels announced
- [ ] Error messages announced
- [ ] Loading states announced
- [ ] Table headers correct

### 11.3 Visual
- [ ] Zoom to 200% usable
- [ ] High contrast mode
- [ ] Color blind friendly
- [ ] Focus indicators visible
- [ ] Text readable

---

## 12. 🚀 Performance Testing

### 12.1 Page Load Times
Measure and verify under 3 seconds:
- [ ] Homepage
- [ ] Login page
- [ ] Dashboard
- [ ] Applicant list (100+ records)
- [ ] Map with markers
- [ ] Large forms

### 12.2 Concurrent Users
Test with multiple users:
- [ ] 10 simultaneous logins
- [ ] 5 users creating applicants
- [ ] Multiple file uploads
- [ ] Simultaneous report generation
- [ ] No data conflicts

### 12.3 API Performance
- [ ] List endpoints < 500ms
- [ ] Create/update < 1s
- [ ] File upload < 5s
- [ ] Search responds quickly
- [ ] Pagination works efficiently

---

## 13. 🌍 Browser Compatibility

### 13.1 Chrome
- [ ] All features work
- [ ] Console no errors
- [ ] Print preview correct
- [ ] Downloads work

### 13.2 Firefox
- [ ] Date pickers work
- [ ] File uploads work
- [ ] Animations smooth
- [ ] PDF viewer works

### 13.3 Safari
- [ ] Video playback
- [ ] Form autofill
- [ ] Touch bar support
- [ ] iOS integration

### 13.4 Edge
- [ ] Legacy features work
- [ ] Security warnings
- [ ] Corporate policies
- [ ] IE mode if needed

---

## 14. 🔄 Integration Testing

### 14.1 Supabase
- [ ] Auth flow works
- [ ] Database queries fast
- [ ] File storage reliable
- [ ] Real-time subscriptions
- [ ] Row Level Security

### 14.2 SendGrid
- [ ] Emails delivered
- [ ] Templates render
- [ ] Unsubscribe works
- [ ] Bounce handling
- [ ] Analytics tracking

### 14.3 Mapbox
- [ ] Maps load
- [ ] Geocoding accurate
- [ ] Markers interactive
- [ ] Mobile performance
- [ ] API limits okay

---

## 15. 🧪 Edge Cases & Error Handling

### 15.1 Network Issues
- [ ] Slow connection handling
- [ ] Connection drops
- [ ] Timeout messages
- [ ] Retry mechanisms
- [ ] Offline message

### 15.2 Data Edge Cases
- [ ] Empty lists
- [ ] Single item lists
- [ ] Maximum items (1000+)
- [ ] Special characters
- [ ] Unicode support
- [ ] Very long text

### 15.3 User Errors
- [ ] Double-click prevention
- [ ] Back button handling
- [ ] Refresh during submit
- [ ] Multiple tabs open
- [ ] Session conflicts

---

## 📊 Test Execution Tracking

### Test Summary
- **Total Tests**: 350+
- **Categories**: 15
- **Priority**: P1 (Critical), P2 (High), P3 (Medium)

### Execution Log

| Date | Tester | Browser | Tests Run | Passed | Failed | Notes |
|------|--------|---------|-----------|---------|---------|--------|
| | | | | | | |

### Defect Log

| ID | Description | Severity | Status | Assigned To | Notes |
|----|-------------|----------|--------|-------------|--------|
| | | | | | |

---

## 🎯 Sign-off Criteria

Before release, ensure:
- [ ] All P1 tests pass
- [ ] 95%+ P2 tests pass
- [ ] No critical bugs open
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Accessibility audit passed
- [ ] Cross-browser verified
- [ ] Mobile testing complete
- [ ] Load testing passed
- [ ] Stakeholder approval

---

**Document Version**: 1.0
**Last Updated**: December 2024
**Next Review**: Before each major release