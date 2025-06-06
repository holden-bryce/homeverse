'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield,
  Lock,
  Eye,
  FileText,
  Mail,
  Calendar,
  Clock
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'

const sections = [
  {
    title: 'Information We Collect',
    content: [
      'Personal Information: Name, email address, phone number, and demographic information when you create an account or apply for housing.',
      'Housing Information: Income data, household size, housing preferences, and application details.',
      'Usage Data: How you interact with our platform, pages visited, and features used.',
      'Device Information: IP address, browser type, operating system, and device identifiers.',
      'Location Data: Approximate location to match you with nearby housing opportunities.'
    ]
  },
  {
    title: 'How We Use Your Information',
    content: [
      'Matching Services: Connect housing seekers with appropriate properties and opportunities.',
      'Communication: Send notifications about matches, application status, and account updates.',
      'Improvement: Analyze usage patterns to enhance our platform and services.',
      'Compliance: Meet legal requirements and verify eligibility for affordable housing programs.',
      'Support: Provide customer service and technical assistance.'
    ]
  },
  {
    title: 'Information Sharing',
    content: [
      'Property Owners/Developers: Share relevant application information when you apply for housing.',
      'Lenders/Investors: Provide anonymized data for market analysis and investment decisions.',
      'Service Providers: Work with trusted third parties who help us operate our platform.',
      'Legal Requirements: Comply with legal obligations and protect rights and safety.',
      'Business Transfers: In the event of merger, acquisition, or sale of assets.'
    ]
  },
  {
    title: 'Data Security',
    content: [
      'Encryption: All sensitive data is encrypted both in transit and at rest.',
      'Access Controls: Strict authentication and authorization protocols for data access.',
      'Regular Audits: Ongoing security assessments and vulnerability testing.',
      'Staff Training: Regular security training for all employees handling personal data.',
      'Incident Response: Comprehensive plan for addressing any security breaches.'
    ]
  },
  {
    title: 'Your Rights',
    content: [
      'Access: Request a copy of the personal information we have about you.',
      'Correction: Update or correct inaccurate personal information.',
      'Deletion: Request deletion of your personal information, subject to legal requirements.',
      'Portability: Receive your data in a structured, machine-readable format.',
      'Opt-out: Unsubscribe from marketing communications at any time.'
    ]
  },
  {
    title: 'Cookies and Tracking',
    content: [
      'Essential Cookies: Required for basic platform functionality and security.',
      'Analytics Cookies: Help us understand how users interact with our platform.',
      'Preference Cookies: Remember your settings and preferences.',
      'Marketing Cookies: Used to deliver relevant advertisements and measure effectiveness.',
      'Third-party Cookies: Some features may use cookies from trusted partners.'
    ]
  }
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-sage-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-900">HomeVerse</span>
            </Link>
            <div className="flex space-x-4">
              <Link href="/auth/login">
                <Button variant="outline" className="rounded-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-sage-600 hover:bg-sage-700 rounded-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-sage-100 text-sage-800 border border-sage-200 rounded-full mb-4">
            <Shield className="h-3 w-3 mr-1" />
            Privacy Policy
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Your Privacy Matters
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            At HomeVerse, we're committed to protecting your privacy and handling your data responsibly. This policy explains how we collect, use, and safeguard your information.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Effective: January 1, 2024
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Last Updated: January 1, 2024
            </div>
          </div>
        </div>

        {/* Quick Summary */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-sage-600 to-teal-600 text-white mb-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Quick Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  What We Collect
                </h3>
                <p className="text-sm opacity-90">
                  Personal info, housing preferences, and usage data to provide our matching services.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  How We Use It
                </h3>
                <p className="text-sm opacity-90">
                  Connect you with housing opportunities and improve our platform.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Your Control
                </h3>
                <p className="text-sm opacity-90">
                  Access, correct, or delete your data anytime. Opt out of communications.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Contact Us
                </h3>
                <p className="text-sm opacity-90">
                  Questions? Email privacy@homeverse.com or use our contact form.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-3">
                      <div className="h-2 w-2 bg-sage-600 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-gray-700">{item}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-sage-600" />
                Data Retention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                We retain your personal information only as long as necessary to provide our services and comply with legal obligations.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Account data: Until account deletion</li>
                <li>• Application data: 7 years for compliance</li>
                <li>• Usage data: 2 years for analytics</li>
                <li>• Marketing data: Until opt-out</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-sage-600" />
                Contact Our Privacy Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Have questions about this policy or want to exercise your privacy rights?
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Email:</strong> privacy@homeverse.com
                </p>
                <p className="text-sm">
                  <strong>Mail:</strong><br />
                  HomeVerse Privacy Team<br />
                  123 Housing Innovation Blvd<br />
                  San Francisco, CA 94105
                </p>
                <Link href="/contact">
                  <Button variant="outline" className="mt-4 rounded-full">
                    Contact Form
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Updates */}
        <Card className="border-0 shadow-lg bg-amber-50 border-amber-200 mt-12">
          <CardContent className="p-6">
            <h3 className="font-semibold text-amber-800 mb-2">Policy Updates</h3>
            <p className="text-amber-700 text-sm">
              We may update this privacy policy from time to time. We'll notify you of any material changes by email or through our platform. Continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            By using HomeVerse, you agree to this privacy policy and our terms of service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/terms">
              <Button variant="outline" className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full">
                Terms of Service
              </Button>
            </Link>
            <Link href="/contact">
              <Button className="bg-sage-600 hover:bg-sage-700 text-white rounded-full">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}