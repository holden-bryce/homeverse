# Cross-Browser and Mobile Testing Guide

## 🌐 Browser Compatibility Matrix

### Desktop Browsers

| Browser | Version | Priority | Status | Notes |
|---------|---------|----------|--------|--------|
| Chrome | 119+ | P1 | ✅ Fully Supported | Primary development browser |
| Firefox | 119+ | P1 | ✅ Fully Supported | ESR version included |
| Safari | 17+ | P1 | ✅ Fully Supported | macOS 13+ required |
| Edge | 119+ | P2 | ✅ Fully Supported | Chromium-based |
| Opera | 104+ | P3 | ⚠️ Basic Support | Limited testing |

### Mobile Browsers

| Platform | Browser | Version | Priority | Status | Notes |
|----------|---------|---------|----------|--------|--------|
| iOS | Safari | 16+ | P1 | ✅ Fully Supported | iPhone 11+ |
| iOS | Chrome | Latest | P2 | ✅ Fully Supported | Uses WebKit |
| Android | Chrome | 119+ | P1 | ✅ Fully Supported | Android 10+ |
| Android | Firefox | Latest | P3 | ⚠️ Basic Support | Limited testing |
| Android | Samsung | Latest | P3 | ⚠️ Basic Support | Galaxy devices |

### Mobile Devices Tested

| Device | OS Version | Screen Size | Test Priority |
|--------|------------|-------------|---------------|
| iPhone 14 Pro | iOS 17 | 390x844 | P1 |
| iPhone 13 | iOS 16 | 390x844 | P1 |
| iPhone SE | iOS 16 | 375x667 | P2 |
| iPad Pro 12.9" | iPadOS 17 | 1024x1366 | P2 |
| Samsung Galaxy S23 | Android 13 | 360x800 | P1 |
| Google Pixel 7 | Android 13 | 412x915 | P1 |
| Samsung Galaxy Tab S8 | Android 13 | 800x1280 | P2 |

---

## 🧪 Automated Cross-Browser Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // Desktop Browsers
    {
      name: 'Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Safari',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Edge',
      use: { ...devices['Desktop Edge'] },
    },
    
    // Mobile Browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
    
    // Custom Viewports
    {
      name: 'Small Mobile',
      use: {
        viewport: { width: 320, height: 568 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      },
    },
    {
      name: 'Large Desktop',
      use: {
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});
```

### Running Cross-Browser Tests

```bash
# Run all browser tests
npm run test:cross-browser

# Run specific browser
npm run test:e2e -- --project=Chrome
npm run test:e2e -- --project="Mobile Safari"

# Run mobile-only tests
npm run test:mobile

# Generate cross-browser report
npm run test:report
```

---

## 📱 Mobile-Specific Testing

### Touch Interactions

```typescript
// tests/mobile/touch-interactions.spec.ts
test.describe('Mobile Touch Interactions', () => {
  test.use({ ...devices['iPhone 13'] });
  
  test('swipe navigation works', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Swipe to open mobile menu
    await page.locator('.main-content').swipe('right');
    await expect(page.locator('.mobile-menu')).toBeVisible();
    
    // Swipe to close
    await page.locator('.mobile-menu').swipe('left');
    await expect(page.locator('.mobile-menu')).not.toBeVisible();
  });
  
  test('pinch to zoom on map', async ({ page }) => {
    await page.goto('/dashboard/map');
    
    const map = page.locator('.mapboxgl-map');
    await map.pinch({ scale: 2 }); // Zoom in
    
    const zoomLevel = await page.evaluate(() => window.map.getZoom());
    expect(zoomLevel).toBeGreaterThan(10);
  });
});
```

### Mobile Performance

```typescript
// tests/mobile/performance.spec.ts
test.describe('Mobile Performance', () => {
  test.use({ 
    ...devices['Pixel 5'],
    // Simulate 3G network
    offline: false,
    downloadThroughput: 1.6 * 1024 * 1024 / 8,
    uploadThroughput: 750 * 1024 / 8,
    latency: 150,
  });
  
  test('page loads within 3s on 3G', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });
});
```

### Responsive Design Testing

```typescript
// tests/responsive/breakpoints.spec.ts
const breakpoints = [
  { name: 'mobile-sm', width: 320, height: 568 },
  { name: 'mobile-md', width: 375, height: 667 },
  { name: 'mobile-lg', width: 414, height: 896 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'desktop-lg', width: 1920, height: 1080 },
];

breakpoints.forEach(({ name, width, height }) => {
  test.describe(`Responsive: ${name} (${width}x${height})`, () => {
    test.use({ viewport: { width, height } });
    
    test('navigation adapts correctly', async ({ page }) => {
      await page.goto('/');
      
      if (width < 768) {
        // Mobile navigation
        await expect(page.locator('.mobile-menu-button')).toBeVisible();
        await expect(page.locator('.desktop-nav')).not.toBeVisible();
      } else {
        // Desktop navigation
        await expect(page.locator('.desktop-nav')).toBeVisible();
        await expect(page.locator('.mobile-menu-button')).not.toBeVisible();
      }
    });
    
    test('forms are usable', async ({ page }) => {
      await page.goto('/auth/login');
      
      const form = page.locator('form');
      const formWidth = await form.boundingBox();
      
      // Form should not exceed viewport
      expect(formWidth.width).toBeLessThanOrEqual(width - 32); // 16px padding
    });
  });
});
```

---

## 🔍 Browser-Specific Features

### Safari-Specific Tests

```typescript
// tests/browsers/safari.spec.ts
test.describe('Safari Specific Features', () => {
  test.skip(({ browserName }) => browserName !== 'webkit', 'Safari only');
  
  test('date input works correctly', async ({ page }) => {
    await page.goto('/dashboard/applicants/new');
    
    // Safari has native date picker
    const dateInput = page.locator('input[type="date"]');
    await dateInput.click();
    await dateInput.fill('2024-01-15');
    
    await expect(dateInput).toHaveValue('2024-01-15');
  });
  
  test('CSS -webkit prefixes applied', async ({ page }) => {
    await page.goto('/');
    
    const hasWebkitStyles = await page.evaluate(() => {
      const el = document.querySelector('.gradient-bg');
      const styles = window.getComputedStyle(el);
      return styles.backgroundImage.includes('-webkit-');
    });
    
    expect(hasWebkitStyles).toBeTruthy();
  });
});
```

### Firefox-Specific Tests

```typescript
// tests/browsers/firefox.spec.ts
test.describe('Firefox Specific Features', () => {
  test.skip(({ browserName }) => browserName !== 'firefox', 'Firefox only');
  
  test('scrollbar styling works', async ({ page }) => {
    await page.goto('/dashboard/applicants');
    
    const hasCustomScrollbar = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.documentElement);
      return styles.scrollbarWidth === 'thin';
    });
    
    expect(hasCustomScrollbar).toBeTruthy();
  });
});
```

---

## 📊 Visual Regression Testing

### Cross-Browser Screenshots

```typescript
// tests/visual/screenshots.spec.ts
const browsers = ['chromium', 'firefox', 'webkit'];

browsers.forEach(browser => {
  test.describe(`Visual Tests - ${browser}`, () => {
    test.use({ browserName: browser });
    
    test('homepage visual consistency', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`homepage-${browser}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
    
    test('dashboard visual consistency', async ({ page }) => {
      await login(page, 'staff@test.com', 'password123');
      await page.goto('/dashboard');
      
      await expect(page).toHaveScreenshot(`dashboard-${browser}.png`, {
        clip: { x: 0, y: 0, width: 1280, height: 720 },
      });
    });
  });
});
```

---

## 🛠️ Manual Testing Procedures

### iOS Safari Testing

1. **Setup**:
   - Use real iPhone device (preferred) or iOS Simulator
   - Enable Web Inspector in Settings > Safari > Advanced
   - Connect to Mac for debugging

2. **Test Checklist**:
   - [ ] Page loads without horizontal scroll
   - [ ] Forms auto-zoom disabled (viewport meta tag)
   - [ ] Touch targets minimum 44x44 pixels
   - [ ] No Flash or unsupported plugins
   - [ ] Keyboard dismisses properly
   - [ ] Safe area insets respected (notch)

3. **Debug Tools**:
   ```bash
   # Connect Safari DevTools
   1. Connect iPhone via USB
   2. Open Safari on Mac
   3. Develop menu > [Device Name] > [Page]
   ```

### Android Chrome Testing

1. **Setup**:
   - Use real Android device or emulator
   - Enable Developer Options and USB Debugging
   - Install Chrome DevTools

2. **Test Checklist**:
   - [ ] Viewport fits without zoom
   - [ ] Back button behavior correct
   - [ ] App install banner appears (PWA)
   - [ ] Offline functionality works
   - [ ] Performance on mid-range devices

3. **Debug Tools**:
   ```bash
   # Remote debugging
   1. Connect via USB
   2. Open chrome://inspect on desktop
   3. Click "Inspect" next to device
   ```

---

## 🚀 Performance Optimization by Browser

### Mobile Optimization Checklist

- [ ] **Images**:
  - Use WebP with fallbacks
  - Implement lazy loading
  - Serve responsive images
  - Use CSS sprites for icons

- [ ] **JavaScript**:
  - Minimize bundle size (<200KB gzipped)
  - Use code splitting
  - Defer non-critical scripts
  - Avoid blocking render

- [ ] **CSS**:
  - Critical CSS inline
  - Minimize CSS (<50KB)
  - Use CSS containment
  - Avoid complex selectors

- [ ] **Fonts**:
  - Use font-display: swap
  - Preload critical fonts
  - Subset fonts
  - Use system fonts fallback

### Network Optimization

```javascript
// Service Worker for offline support
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('homeverse-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/css/app.css',
        '/js/app.js',
      ]);
    })
  );
});
```

---

## 📋 Testing Reports

### Automated Report Generation

```bash
# Generate comprehensive browser report
npm run test:cross-browser -- --reporter=html

# Generate mobile-specific report
npm run test:mobile -- --reporter=json

# Merge reports
npm run merge-reports
```

### Sample Report Template

```markdown
# Cross-Browser Test Report

**Date**: December 2024
**Version**: 2.0.0
**Total Tests**: 350

## Browser Results

| Browser | Tests | Passed | Failed | Skipped | Time |
|---------|-------|--------|--------|---------|------|
| Chrome 119 | 350 | 348 | 2 | 0 | 5m 23s |
| Firefox 119 | 350 | 346 | 3 | 1 | 6m 12s |
| Safari 17 | 350 | 345 | 4 | 1 | 7m 45s |
| Mobile Chrome | 280 | 278 | 2 | 0 | 8m 30s |
| Mobile Safari | 280 | 275 | 5 | 0 | 9m 15s |

## Critical Issues

1. **Safari**: Date picker not showing on older iOS versions
2. **Firefox**: Custom scrollbar styling not applied
3. **Mobile Safari**: Pinch-to-zoom disabled on map

## Performance Metrics

| Platform | FCP | LCP | TTI | CLS |
|----------|-----|-----|-----|-----|
| Desktop Chrome | 1.2s | 2.1s | 2.5s | 0.05 |
| Mobile Chrome | 2.3s | 3.8s | 4.2s | 0.08 |
| Mobile Safari | 2.5s | 4.0s | 4.5s | 0.10 |
```

---

## 🔧 Troubleshooting Guide

### Common Cross-Browser Issues

1. **CSS Grid/Flexbox Issues**
   ```css
   /* Add fallbacks for older browsers */
   .container {
     display: flex;
     display: -webkit-flex; /* Safari */
     display: -ms-flexbox; /* IE 10 */
   }
   ```

2. **JavaScript API Differences**
   ```javascript
   // Check for API support
   if ('IntersectionObserver' in window) {
     // Use IntersectionObserver
   } else {
     // Use fallback
   }
   ```

3. **Touch Event Handling**
   ```javascript
   // Support both touch and mouse
   element.addEventListener('touchstart', handleStart, { passive: true });
   element.addEventListener('mousedown', handleStart);
   ```

---

## ✅ Certification Checklist

Before marking as cross-browser compatible:

- [ ] Tested on all P1 browsers
- [ ] No console errors in any browser
- [ ] Visual consistency across browsers
- [ ] Performance metrics within targets
- [ ] Accessibility features work
- [ ] Print styles render correctly
- [ ] JavaScript polyfills loaded
- [ ] CSS vendor prefixes applied
- [ ] Touch interactions smooth
- [ ] Offline functionality works

---

**Document Version**: 1.0
**Last Updated**: December 2024
**Maintained By**: QA Team