/**
 * Security utility functions for data protection
 */

/**
 * Masks email addresses for privacy
 * john.doe@example.com -> j***@example.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') return 'Hidden'
  
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return 'Hidden'
  
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`
  }
  
  return `${localPart[0]}***@${domain}`
}

/**
 * Masks phone numbers for privacy
 * 555-123-4567 -> 555-***-4567
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return 'Hidden'
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length < 10) return 'Hidden'
  
  // Format as XXX-***-XXXX
  return `${digits.slice(0, 3)}-***-${digits.slice(-4)}`
}

/**
 * Validates and sanitizes user input
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return ''
  
  // Remove any HTML tags
  return input
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 1000) // Limit length
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates phone format (US)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\d{3}-?\d{3}-?\d{4}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}