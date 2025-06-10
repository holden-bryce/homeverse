'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/providers/supabase-auth-provider'
import { AlertCircle } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { signIn, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  
  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect') || null

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      const roleRoutes: Record<string, string> = {
        developer: '/dashboard/projects',
        lender: '/dashboard/lenders',
        buyer: '/dashboard/buyers',
        applicant: '/dashboard/applicants',
        admin: '/dashboard',
      }
      const defaultPath = roleRoutes[user.user_metadata?.role || 'buyer'] || '/dashboard'
      router.push(redirectUrl || defaultPath)
    }
  }, [user, redirectUrl, router])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('')
      // Pass redirect URL to signIn if available
      if (redirectUrl) {
        await signIn(data.email, data.password, redirectUrl)
      } else {
        await signIn(data.email, data.password)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Login failed. Please try again.')
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
            Sign in to your account
          </h2>
          <p className="mt-2 text-gray-600">
            Welcome back! Please enter your details.
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  error={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  error={!!errors.password}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link
                  href="/auth/register" 
                  className="text-sm text-teal-600 hover:text-teal-700"
                >
                  Create account
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                loading={isSubmitting}
              >
                Sign in
              </Button>
            </form>

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

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            By signing in, you agree to our{' '}
            <a href="#" className="text-teal-600 hover:text-teal-700">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-teal-600 hover:text-teal-700">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}