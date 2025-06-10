'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/providers/supabase-auth-provider'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  company_key: z.string().min(1, 'Company key is required'),
  role: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'user',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('')
      await signUp(data.email, data.password, {
        full_name: data.email.split('@')[0], // Use email prefix as name
        role: data.role || 'buyer',
        company_key: data.company_key
      })
      
      // Show success message and redirect
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'Registration failed. Please try again.')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-taupe-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to HomeVerse!</h2>
            <p className="text-gray-600 mb-4">
              Your account has been created successfully. Redirecting to your dashboard...
            </p>
            <div className="spinner mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    )
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
            Create your account
          </h2>
          <p className="mt-2 text-gray-600">
            Join thousands of organizations transforming affordable housing
          </p>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create your account to get started with HomeVerse
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
                <label htmlFor="company_key" className="text-sm font-medium text-gray-700">
                  Company Key
                </label>
                <Input
                  id="company_key"
                  type="text"
                  placeholder="Enter your company key"
                  error={!!errors.company_key}
                  {...register('company_key')}
                />
                {errors.company_key && (
                  <p className="text-sm text-red-600">{errors.company_key.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Don't have a company key? Contact your administrator or{' '}
                  <a href="#" className="text-teal-600 hover:text-teal-700">
                    contact sales
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Role
                </label>
                <Select onValueChange={(value) => setValue('role', value)} defaultValue="user">
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  error={!!errors.password}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  error={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-start">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded mt-0.5"
                  required
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="#" className="text-teal-600 hover:text-teal-700">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-teal-600 hover:text-teal-700">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                loading={isSubmitting || registerMutation.isPending}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-teal-600 hover:text-teal-700"
                >
                  Sign in
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Need help getting started?{' '}
            <a href="#" className="text-teal-600 hover:text-teal-700">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}