# 🕵️ Manual Exploratory Testing Guide

This is how to REALLY test like a user and find bugs automated tests miss.

## 🎯 Testing Mindset

Think like different types of users:
- **Frustrated User**: Clicks everything rapidly, goes back and forth
- **Cautious User**: Reads everything, hovers over buttons before clicking
- **Mobile User**: Uses touch, rotates screen, has poor connection
- **Malicious User**: Tries to break things, access unauthorized areas
- **Confused User**: Enters wrong data, uses browser back button

## 📱 Real User Test Scenarios

### 1. The Impatient User Test
```
1. Open the app
2. Immediately click multiple buttons before page loads
3. Use browser back/forward rapidly
4. Double-click submit buttons
5. Refresh page while forms are submitting
```

### 2. The Mobile User Test
```
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone or Android
4. Test:
   - Can you tap small buttons?
   - Does keyboard cover input fields?
   - Can you scroll properly?
   - Do modals work on mobile?
   - Can you pinch-zoom where needed?
```

### 3. The Poor Connection Test
```
1. Open DevTools → Network tab
2. Select "Slow 3G" throttling
3. Try to:
   - Submit forms
   - Upload files
   - Load images
   - Navigate pages
4. Look for:
   - Missing loading indicators
   - Timeouts without error messages
   - Duplicate submissions
```

### 4. The Multi-Tab User Test
```
1. Open app in 3 different tabs
2. Login in all tabs
3. Make changes in one tab
4. Check if other tabs update
5. Logout in one tab - what happens in others?
```

### 5. The Break Everything Test
```
1. Forms:
   - Submit empty forms
   - Enter 10,000 characters in text fields
   - Upload 100MB files
   - Use special characters: <>`"'/\
   - Copy-paste from Word with formatting

2. Navigation:
   - Bookmark deep pages and access directly
   - Use browser back on multi-step forms
   - Open links in new tabs
   - Refresh during operations

3. Sessions:
   - Leave tab open for hours
   - Put computer to sleep and wake
   - Change system time
   - Clear cookies mid-session
```

## 🔍 Security Testing (Manual)

### Test These Manually:
```
1. Authorization:
   - Save a dashboard URL, logout, try to access it
   - Try to access other users' data by changing IDs in URL
   - Use DevTools to enable disabled buttons
   - Modify hidden form fields

2. Data Validation:
   - Enter negative numbers for age/income
   - Enter future dates for birthdate
   - SQL injection: ' OR 1=1--
   - XSS: <script>alert('XSS')</script>
   - Format strings: %s%s%s%s%s

3. File Security:
   - Upload .exe renamed to .pdf
   - Upload HTML files
   - Upload very large files
   - Upload files with long names
```

## 🎨 Visual & UX Testing

### Check These Manually:
```
1. Visual Consistency:
   - Zoom to 200% - does layout break?
   - Different screen sizes
   - Dark mode (if available)
   - High contrast mode
   - Print preview

2. Accessibility:
   - Navigate using only keyboard (Tab key)
   - Use screen reader (Windows Narrator)
   - Check color contrast
   - Disable JavaScript
   - Disable CSS

3. Browser Testing:
   - Chrome, Firefox, Safari, Edge
   - Private/Incognito mode
   - With ad blockers enabled
   - With password managers
```

## 📊 Performance Testing (Manual)

### Monitor While Testing:
```
1. Open DevTools → Performance tab
2. Start recording
3. Perform actions:
   - Load pages
   - Submit forms
   - Open modals
   - Scroll long lists
4. Stop recording and check:
   - Long tasks (>50ms)
   - Memory leaks
   - Unnecessary re-renders
```

## 🐛 Common Bugs to Look For

### Always Check:
```
✓ Empty states - what shows when no data?
✓ Error messages - are they helpful?
✓ Loading states - do they show/hide properly?
✓ Form validation - client and server side?
✓ Timezone issues - different user timezones
✓ Currency/number formats
✓ Character encoding (émojis, ñ, etc.)
✓ Pagination edge cases (0 results, 1 result)
✓ Sort/filter combinations
✓ Deep linking - can you bookmark any page?
```

## 🎯 Realistic Test Data

### Use Realistic Data:
```
Names: José García, 李明, محمد الأحمد
Emails: test+tag@example.com, very.long.email@subdomain.example.com
Phones: +1-555-0123, (555) 555-5555, 555.555.5555
Addresses: Apt #2B, 123 Main St., P.O. Box 123
```

## 📝 Bug Reporting Template

When you find issues:
```
**Title**: [Component] Brief description
**Steps**:
1. Go to...
2. Click on...
3. Enter...
4. See error

**Expected**: What should happen
**Actual**: What actually happened
**Environment**: Browser, OS, screen size
**Screenshot/Video**: Attach evidence
**Console Errors**: Copy any errors
```

## 🚀 Quick Exploratory Test (30 mins)

1. **First 10 mins**: Click everything rapidly, try to break forms
2. **Next 10 mins**: Test on mobile view, slow connection
3. **Last 10 mins**: Try security attacks, edge cases

This approach finds MORE bugs than automated tests because you're thinking like a real (sometimes malicious) user!