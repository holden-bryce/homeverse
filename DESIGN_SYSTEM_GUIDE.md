# 🎨 HomeVerse Design System Guide
**Version:** 1.0  
**Last Updated:** June 27, 2025

## Brand Identity

### Mission
Creating equitable pathways to homeownership through technology.

### Values
- **Accessibility**: Design for everyone
- **Transparency**: Clear, honest communication
- **Empowerment**: Enable users to achieve their goals
- **Community**: Foster connections and support

---

## 🎨 Color Palette

### Primary Colors
```css
/* Teal - Primary Brand Color */
--color-teal-50: #f0fdfa;
--color-teal-100: #ccfbf1;
--color-teal-200: #99f6e4;
--color-teal-300: #5eead4;
--color-teal-400: #2dd4bf;
--color-teal-500: #14b8a6;  /* Primary */
--color-teal-600: #0d9488;
--color-teal-700: #0f766e;
--color-teal-800: #115e59;
--color-teal-900: #134e4a;

/* Sage - Secondary Color */
--color-sage-50: #f8faf8;
--color-sage-100: #e8f0e8;
--color-sage-200: #d1e0d1;
--color-sage-300: #a8c3a8;
--color-sage-400: #7fa17f;
--color-sage-500: #628b62;  /* Secondary */
--color-sage-600: #4d6f4d;
--color-sage-700: #3d573d;
--color-sage-800: #314531;
--color-sage-900: #283728;

/* Cream - Background/Accent */
--color-cream-50: #fffef7;
--color-cream-100: #fffce8;
--color-cream-200: #fff8d1;
--color-cream-300: #ffefaa;
--color-cream-400: #ffe083;
--color-cream-500: #f5d05c;  /* Accent */
```

### Semantic Colors
```css
/* Success */
--color-success: #10b981;
--color-success-light: #d1fae5;
--color-success-dark: #065f46;

/* Warning */
--color-warning: #f59e0b;
--color-warning-light: #fef3c7;
--color-warning-dark: #92400e;

/* Error */
--color-error: #ef4444;
--color-error-light: #fee2e2;
--color-error-dark: #991b1b;

/* Info */
--color-info: #3b82f6;
--color-info-light: #dbeafe;
--color-info-dark: #1e40af;
```

### Neutral Colors
```css
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
```

---

## 📝 Typography

### Font Stack
```css
--font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'Fira Code', 'Consolas', 'Monaco', monospace;
```

### Type Scale
```css
/* Headings */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */

/* Line Heights */
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Usage Guidelines
- **Headings**: Use font-semibold or font-bold
- **Body Text**: Use font-normal
- **Captions/Labels**: Use font-medium
- **Links**: Use font-medium with teal-600 color

---

## 📐 Spacing System

### Base Unit: 4px (0.25rem)
```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

---

## 🔲 Component Patterns

### Buttons
```tsx
/* Primary Button */
<button className="
  px-4 py-2 
  bg-teal-600 text-white 
  rounded-md 
  hover:bg-teal-700 
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-200
">
  Primary Action
</button>

/* Secondary Button */
<button className="
  px-4 py-2 
  bg-white text-teal-600 
  border border-teal-600 
  rounded-md 
  hover:bg-teal-50
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
  transition-colors duration-200
">
  Secondary Action
</button>

/* Ghost Button */
<button className="
  px-4 py-2 
  text-gray-700 
  hover:bg-gray-100 
  rounded-md
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
  transition-colors duration-200
">
  Ghost Action
</button>
```

### Cards
```tsx
/* Basic Card */
<div className="
  bg-white 
  rounded-lg 
  shadow-sm 
  border border-gray-200
  p-6
  hover:shadow-md transition-shadow duration-200
">
  {/* Content */}
</div>

/* Interactive Card */
<div className="
  bg-white 
  rounded-lg 
  shadow-sm 
  border border-gray-200
  p-6
  cursor-pointer
  hover:shadow-md hover:border-teal-300
  transition-all duration-200
">
  {/* Content */}
</div>
```

### Form Inputs
```tsx
/* Text Input */
<input className="
  w-full 
  px-3 py-2 
  border border-gray-300 
  rounded-md 
  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
  placeholder-gray-400
  disabled:bg-gray-50 disabled:text-gray-500
" />

/* Error State */
<input className="
  w-full 
  px-3 py-2 
  border border-red-300 
  rounded-md 
  focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
  text-red-900 placeholder-red-400
" />
```

---

## 🎯 Interaction States

### Focus States
- Always visible (never remove outline)
- Use ring utilities: `focus:ring-2 focus:ring-offset-2 focus:ring-{color}-500`
- Ensure 3:1 contrast ratio

### Hover States
- Subtle color shift or shadow increase
- Transition duration: 200ms
- Use `transition-{property} duration-200`

### Active States
- Slightly darker than hover
- Scale down: `active:scale-95`

### Disabled States
- Opacity: 50%
- Cursor: not-allowed
- Remove hover effects

---

## 📱 Responsive Design

### Breakpoints
```css
--screen-sm: 640px;   /* Mobile landscape */
--screen-md: 768px;   /* Tablet */
--screen-lg: 1024px;  /* Desktop */
--screen-xl: 1280px;  /* Large desktop */
--screen-2xl: 1536px; /* Extra large */
```

### Mobile-First Approach
```tsx
/* Start with mobile styles, add larger screens */
<div className="
  p-4         /* Mobile */
  sm:p-6      /* 640px+ */
  md:p-8      /* 768px+ */
  lg:p-10     /* 1024px+ */
">
```

### Container Widths
```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container { max-width: 640px; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; }
}

@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}
```

---

## ♿ Accessibility Guidelines

### Color Contrast
- **Normal Text**: 4.5:1 minimum
- **Large Text**: 3:1 minimum (18px+ or 14px+ bold)
- **Interactive Elements**: 3:1 minimum

### Touch Targets
- Minimum size: 44x44px
- Spacing between targets: 8px minimum

### Keyboard Navigation
- All interactive elements keyboard accessible
- Visible focus indicators
- Logical tab order
- Skip links for repetitive content

### Screen Reader Support
- Semantic HTML
- Proper ARIA labels
- Descriptive link text
- Alt text for images

---

## 🎭 Animation Guidelines

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Duration
- **Micro-interactions**: 150-300ms
- **Page transitions**: 300-500ms
- **Complex animations**: 500-1000ms

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🎨 Component Examples

### Dashboard Stat Card
```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-sm font-medium text-gray-600">Total Applicants</h3>
    <Users className="w-5 h-5 text-gray-400" />
  </div>
  <p className="text-2xl font-semibold text-gray-900">1,234</p>
  <p className="text-sm text-gray-500 mt-1">
    <span className="text-green-600 font-medium">↑ 12%</span> from last month
  </p>
</div>
```

### Notification Badge
```tsx
<span className="
  inline-flex items-center 
  px-2.5 py-0.5 
  rounded-full 
  text-xs font-medium
  bg-teal-100 text-teal-800
">
  New
</span>
```

### Progress Bar
```tsx
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="bg-teal-600 h-2 rounded-full transition-all duration-300"
    style={{ width: '75%' }}
    role="progressbar"
    aria-valuenow={75}
    aria-valuemin={0}
    aria-valuemax={100}
  />
</div>
```

---

## 📋 Implementation Checklist

- [ ] Set up Tailwind config with custom colors
- [ ] Install Inter font family
- [ ] Create reusable component library
- [ ] Document component variations
- [ ] Test color contrast ratios
- [ ] Validate touch target sizes
- [ ] Test with screen readers
- [ ] Check keyboard navigation
- [ ] Test responsive breakpoints
- [ ] Implement motion preferences

---

## 🔗 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Checker](https://www.webai.org/resources/contrastchecker/)
- [Inter Font](https://fonts.google.com/specimen/Inter)

This design system ensures consistency, accessibility, and a professional appearance across the entire HomeVerse platform.