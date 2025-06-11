import { apiClient } from './client'

export async function logout() {
  try {
    // Call backend logout endpoint
    await apiClient.post('/api/v1/auth/logout')
  } catch (error) {
    // Even if backend fails, continue with local cleanup
    console.log('Backend logout failed, continuing with local cleanup')
  } finally {
    // Clear all auth-related storage
    if (typeof window !== 'undefined') {
      // Clear localStorage items
      const keysToRemove = ['auth-storage', 'token', 'user', 'sb-', 'supabase']
      Object.keys(localStorage).forEach(key => {
        if (keysToRemove.some(k => key.includes(k))) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Clear cookies
      document.cookie.split(';').forEach(c => {
        const eqPos = c.indexOf('=')
        const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim()
        // Clear cookie for all possible domains
        const domains = ['', 'localhost', '.localhost', window.location.hostname]
        const paths = ['/', '/auth', '/dashboard']
        
        domains.forEach(domain => {
          paths.forEach(path => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};${domain ? ` domain=${domain};` : ''}`
          })
        })
      })
    }
    
    // Force redirect to login
    window.location.href = '/auth/login'
  }
}