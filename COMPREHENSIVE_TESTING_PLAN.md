# HomeVerse Comprehensive Testing Plan

## 🎯 Objective
Ensure all functionality works correctly before public launch by systematically testing every feature across all user roles.

## 📋 Testing Checklist

### 1. 🔐 Authentication & Session Management (HIGH PRIORITY)

#### Login Testing
- [ ] **Test each user role login**:
  - [ ] developer@test.com / password123
  - [ ] lender@test.com / password123
  - [ ] buyer@test.com / password123
  - [ ] applicant@test.com / password123
  - [ ] admin@test.com / password123
- [ ] **Verify correct dashboard redirect** based on role
- [ ] **Test invalid credentials** - should show error
- [ ] **Test session persistence** - refresh page, should stay logged in
- [ ] **Test logout functionality** - should clear all auth state

#### Profile Loading
- [ ] **Check profile loads** with company_id
- [ ] **Verify user info displays** in header (email, company name)
- [ ] **Test profile refresh** on page load

### 2. 📝 Entity Creation (HIGH PRIORITY)

#### Applicant Creation
- [ ] **Navigate to** `/dashboard/applicants/new`
- [ ] **Fill out form** with all fields
- [ ] **Submit** - should succeed without errors
- [ ] **Verify** applicant appears in list
- [ ] **Test validation** - submit with missing required fields
- [ ] **Check company isolation** - only see own company's applicants

#### Project Creation (Developer/Admin only)
- [ ] **Navigate to** `/dashboard/projects/new`
- [ ] **Fill out form** with project details
- [ ] **Submit** - should create project
- [ ] **Verify** project appears in list
- [ ] **Test edit functionality**
- [ ] **Test role restriction** - other roles shouldn't see "New Project" button

### 3. 🗺️ Map View Functionality (HIGH PRIORITY)

- [ ] **Navigate to** `/dashboard/map`
- [ ] **Verify map loads** with Mapbox
- [ ] **Check project markers** appear on map
- [ ] **Test marker interaction** - click shows project details
- [ ] **Test search functionality**
- [ ] **Test filters** (AMI range, status)
- [ ] **Verify coordinates** are correct

### 4. 👥 Role-Based Access Control (HIGH PRIORITY)

#### Developer Portal
- [ ] **Access** `/dashboard` as developer
- [ ] **Verify menu items**: Projects, Matching, Map, Settings
- [ ] **Can create/edit projects**
- [ ] **Can view applicants**
- [ ] **Can access matching system**

#### Lender Portal  
- [ ] **Access** `/dashboard/lenders` as lender
- [ ] **Verify menu items**: Investments, Analytics, Reports
- [ ] **Can view portfolio**
- [ ] **Can generate CRA reports**
- [ ] **Cannot create projects**

#### Buyer Portal
- [ ] **Access** `/dashboard/buyers` as buyer
- [ ] **Verify menu items**: Properties, Applications, Preferences
- [ ] **Can search properties**
- [ ] **Can submit applications**
- [ ] **Cannot create projects**

#### Admin Portal
- [ ] **Access** `/dashboard` as admin
- [ ] **Can access all features**
- [ ] **Can manage users**
- [ ] **Can view all company data**

### 5. 📧 Communication Features (MEDIUM PRIORITY)

#### Contact Form
- [ ] **Navigate to** `/contact`
- [ ] **Fill out form** completely
- [ ] **Submit** - should show success message
- [ ] **Verify email received** at holdenbryce06@gmail.com
- [ ] **Check auto-reply** sent to submitter

#### Notifications
- [ ] **Test notification bell** in header
- [ ] **Verify activity logging** for entity creation
- [ ] **Check notification preferences** in settings

### 6. 💾 Data Persistence & Isolation (HIGH PRIORITY)

- [ ] **Create entities** with different users
- [ ] **Verify data persists** after logout/login
- [ ] **Check multi-tenant isolation** - users only see their company's data
- [ ] **Test data updates** - edit and save changes
- [ ] **Verify activities logged** correctly

### 7. 🎨 UI/UX Features (MEDIUM PRIORITY)

#### Settings Page
- [ ] **Navigate to** `/dashboard/settings`
- [ ] **Test all tabs**: Profile, Company, Notifications, Security
- [ ] **Update profile info** - should save
- [ ] **Test notification toggles**
- [ ] **Verify company info displays**

#### Search & Filters
- [ ] **Test global search** in header
- [ ] **Test table search** in applicants/projects lists
- [ ] **Verify filters work** correctly
- [ ] **Test pagination** if applicable

#### Responsive Design
- [ ] **Test on mobile** viewport
- [ ] **Check sidebar collapse**
- [ ] **Verify forms are usable**
- [ ] **Test map on mobile**

### 8. 🚀 Production Testing (LOW PRIORITY - After Deploy)

- [ ] **Test production URLs**:
  - Frontend: https://homeverse-frontend.onrender.com
  - Backend API: https://homeverse-api.onrender.com
- [ ] **Verify SSL certificates**
- [ ] **Test all auth flows** in production
- [ ] **Check performance** - page load times
- [ ] **Monitor for errors** in console

## 🛠️ Testing Procedure

### Setup
1. **Start local servers**:
   ```bash
   # Terminal 1: Backend
   python3 supabase_backend.py
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. **Open browser** to http://localhost:3000

3. **Open developer console** to monitor for errors

### For Each Test:
1. **Clear browser data** between role tests
2. **Document any issues** found
3. **Take screenshots** of errors
4. **Note steps to reproduce**

## 🐛 Common Issues & Solutions

### Profile Not Loading
- Check browser console for errors
- Try refreshing the page
- Clear localStorage and re-login

### Entity Creation Fails
- Verify profile has company_id
- Check network tab for API errors
- Ensure all required fields are filled

### Map Not Loading
- Check Mapbox token is valid
- Verify coordinates in database
- Check browser console for CSP errors

### Logout Not Working
- Clear browser cache
- Check for multiple auth tokens
- Manually clear localStorage

## 📊 Success Criteria

- ✅ All test users can login/logout successfully
- ✅ Entity creation works for all authorized roles
- ✅ Map displays projects with correct locations
- ✅ Role-based access properly enforced
- ✅ Email notifications working
- ✅ Data properly isolated by company
- ✅ UI responsive and functional
- ✅ No console errors during normal operation

## 🚦 Go/No-Go Decision

**READY FOR LAUNCH when**:
- All HIGH priority items pass
- No critical bugs in MEDIUM priority items
- Performance acceptable (< 3s page loads)
- Error rate < 1% in testing

## 📝 Test Results Log

| Date | Tester | Test Category | Result | Issues Found | Notes |
|------|--------|---------------|--------|--------------|-------|
| | | | | | |

---

**Last Updated**: December 2024
**Next Review**: Before public launch