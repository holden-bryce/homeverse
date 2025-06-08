/**
 * Input sanitization utilities for XSS prevention
 */

// Basic HTML entity encoding for text inputs
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

// Sanitize email addresses
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove any HTML and trim whitespace
  const cleaned = sanitizeText(input)
  
  // Basic email validation pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  return emailRegex.test(cleaned) ? cleaned : ''
}

// Sanitize phone numbers
export function sanitizePhone(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove all non-digit characters except parentheses, hyphens, spaces, and plus
  return input.replace(/[^0-9()\-\s+]/g, '').trim()
}

// Sanitize numeric inputs
export function sanitizeNumber(input: string | number): number | null {
  if (typeof input === 'number') return isNaN(input) ? null : input
  if (typeof input !== 'string') return null
  
  const num = parseFloat(input.replace(/[^0-9.-]/g, ''))
  return isNaN(num) ? null : num
}

// Sanitize text areas and longer text inputs
export function sanitizeTextArea(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove dangerous HTML tags and scripts while preserving basic formatting
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

// Sanitize URLs
export function sanitizeUrl(input: string): string {
  if (typeof input !== 'string') return ''
  
  try {
    const url = new URL(input)
    // Only allow http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return ''
    }
    return url.toString()
  } catch {
    return ''
  }
}

// Generic sanitizer for form data
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = {} as T
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Apply appropriate sanitization based on field name
      if (key.includes('email')) {
        sanitized[key as keyof T] = sanitizeEmail(value) as T[keyof T]
      } else if (key.includes('phone')) {
        sanitized[key as keyof T] = sanitizePhone(value) as T[keyof T]
      } else if (key.includes('url') || key.includes('link')) {
        sanitized[key as keyof T] = sanitizeUrl(value) as T[keyof T]
      } else if (key.includes('description') || key.includes('message')) {
        sanitized[key as keyof T] = sanitizeTextArea(value) as T[keyof T]
      } else {
        sanitized[key as keyof T] = sanitizeText(value) as T[keyof T]
      }
    } else if (typeof value === 'number') {
      sanitized[key as keyof T] = sanitizeNumber(value) as T[keyof T]
    } else {
      sanitized[key as keyof T] = value
    }
  }
  
  return sanitized
}