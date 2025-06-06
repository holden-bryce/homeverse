import { API_BASE_URL } from '@/lib/constants'
import type { 
  AuthResponse, 
  LoginForm, 
  RegisterForm,
  User,
  Company
} from '@/types'

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class APIClient {
  private baseURL: string
  private defaultHeaders: HeadersInit
  private token: string | null = null
  private companyKey: string | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
    
    // Initialize from localStorage and cookies if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token') || this.getCookie('auth_token')
      this.companyKey = localStorage.getItem('company_key') || this.getCookie('company_key')
    }
  }

  setAuth(token: string | null, companyKey: string | null = null) {
    this.token = token
    this.companyKey = companyKey
    
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token)
        // Also set as cookie for middleware
        document.cookie = `auth_token=${token}; path=/; max-age=${24 * 60 * 60}` // 24 hours
      } else {
        localStorage.removeItem('auth_token')
        // Remove cookie
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
      
      if (companyKey) {
        localStorage.setItem('company_key', companyKey)
        // Also set as cookie for middleware
        document.cookie = `company_key=${companyKey}; path=/; max-age=${24 * 60 * 60}` // 24 hours
      } else {
        localStorage.removeItem('company_key')
        // Remove cookie
        document.cookie = 'company_key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    }
  }

  private getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }

  getAuth() {
    return {
      token: this.token,
      companyKey: this.companyKey
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers: Record<string, string> = {}
    
    // Copy default headers
    Object.assign(headers, this.defaultHeaders)
    
    // Copy options headers
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    if (this.companyKey) {
      headers['x-company-key'] = this.companyKey
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.detail || errorJson.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }

        throw new APIError(errorMessage, response.status, errorText)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }

      return response.text() as unknown as T
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError('Network error', 0, error)
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // Multipart form data for file uploads
  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers: HeadersInit = {}

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    if (this.companyKey) {
      headers['x-company-key'] = this.companyKey
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`HTTP ${response.status}: ${errorText}`, response.status)
    }

    return await response.json()
  }

  // Auth endpoints
  async login(credentials: LoginForm): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/api/v1/auth/login', credentials)
    
    // Store the token and company key
    if (response.access_token) {
      // Get company info to set the company key
      this.setAuth(response.access_token)
      
      // Fetch company details to get the company key
      try {
        const company = await this.getCurrentCompany()
        this.setAuth(response.access_token, company.key)
      } catch (error) {
        console.warn('Could not fetch company details:', error)
      }
    }
    
    return response
  }

  async register(data: RegisterForm): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/api/v1/auth/register', data)
    
    // Store the token and company key
    if (response.access_token) {
      this.setAuth(response.access_token, data.company_key)
    }
    
    return response
  }

  async logout(): Promise<void> {
    try {
      await this.post('/api/v1/auth/logout')
    } finally {
      this.setAuth(null, null)
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.get<User>('/api/v1/auth/me')
  }

  async getCurrentCompany(): Promise<Company> {
    return this.get<Company>('/api/v1/auth/company')
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.post<AuthResponse>('/api/v1/auth/refresh')
  }

  // Health check
  async health(): Promise<{ status: string }> {
    return this.get('/health')
  }
}

export const apiClient = new APIClient()