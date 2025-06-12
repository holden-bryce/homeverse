'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

// EMERGENCY LOGIN - Bypasses complex auth providers to fix routing

function EmergencyLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  console.log('Emergency Login: Form loaded')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Emergency Login: Form submitted', { email })
    
    setError('')
    setLoading(true)

    try {
      // Import EMERGENCY Supabase client - no profile loading
      const { emergencySignIn } = await import('@/lib/supabase-emergency')
      
      console.log('Emergency Login: Attempting sign in...')
      
      const data = await emergencySignIn(email, password)

      if (data.user) {
        console.log('Emergency Login: Success! User:', data.user.email)
        
        // Simple role-based redirect
        const emailToRole: Record<string, string> = {
          'admin@test.com': 'admin',
          'developer@test.com': 'developer',
          'lender@test.com': 'lender',
          'buyer@test.com': 'buyer',
          'applicant@test.com': 'applicant'
        }
        
        const role = emailToRole[email] || 'buyer'
        console.log('Emergency Login: Redirecting to dashboard for role:', role)
        
        // Force hard redirect to dashboard - bypasses all React routing
        window.location.replace('/dashboard')
      }
    } catch (error: any) {
      console.error('Emergency Login: Unexpected error:', error)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-taupe-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Logo size="lg" variant="full" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Emergency Login
          </h2>
          <p className="mt-2 text-gray-600">
            Simplified login to fix routing issues
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your email and password to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {/* Test Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Test Credentials:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>admin@test.com / password123</div>
                <div>developer@test.com / password123</div>
                <div>lender@test.com / password123</div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/auth/register"
                  className="font-medium text-teal-600 hover:text-teal-700"
                >
                  Sign up
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function EmergencyLoginPage() {
  console.log('Emergency Login: Page component loaded')
  return <EmergencyLoginForm />
}