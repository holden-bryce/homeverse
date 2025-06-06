'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText,
  Scale,
  Shield,
  AlertTriangle,
  CheckCircle,
  Mail,
  Calendar,
  Clock
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'

const sections = [
  {
    title: 'Acceptance of Terms',
    content: [
      'By accessing or using HomeVerse, you agree to be bound by these Terms of Service.',
      'If you do not agree to these terms, you may not use our services.',
      'These terms apply to all users, including housing seekers, developers, lenders, and administrators.',
      'You must be at least 18 years old to use our services.',
      'By using our services, you represent that you have the legal capacity to enter into these terms.'
    ]
  },
  {
    title: 'Description of Services',
    content: [
      'HomeVerse is a platform that connects housing seekers with affordable housing opportunities.',
      'We provide matching services, application management, and analytics tools.',
      'Our services include but are not limited to property listings, application processing, and reporting.',
      'We facilitate connections but do not directly provide housing or make housing decisions.',
      'Service availability may vary by location and is subject to change.'
    ]
  },
  {
    title: 'User Accounts and Responsibilities',
    content: [
      'You must provide accurate and complete information when creating an account.',
      'You are responsible for maintaining the confidentiality of your account credentials.',
      'You must notify us immediately of any unauthorized use of your account.',
      'You may not share your account with others or create multiple accounts.',
      'You are responsible for all activities that occur under your account.'
    ]
  },
  {
    title: 'Acceptable Use Policy',
    content: [
      'You may not use our services for any unlawful or prohibited purpose.',
      'You may not attempt to gain unauthorized access to our systems or data.',
      'You may not interfere with or disrupt our services or servers.',
      'You may not use our services to transmit spam, malware, or harmful content.',
      'You may not impersonate others or provide false information.'
    ]
  },
  {
    title: 'Content and Intellectual Property',
    content: [
      'HomeVerse owns all rights to our platform, software, and proprietary content.',
      'You retain ownership of content you submit, but grant us license to use it as necessary.',
      'You may not copy, modify, or distribute our proprietary content without permission.',
      'You warrant that any content you submit does not infringe on others\' rights.',
      'We may remove content that violates these terms or applicable law.'
    ]
  },
  {
    title: 'Privacy and Data Protection',
    content: [
      'Your privacy is important to us and is governed by our Privacy Policy.',
      'We collect and use your information as described in our Privacy Policy.',
      'You consent to our collection and use of your information as outlined.',
      'We implement appropriate security measures to protect your data.',
      'You have certain rights regarding your personal information as described in our Privacy Policy.'
    ]
  },
  {
    title: 'Disclaimers and Limitations',
    content: [
      'Our services are provided "as is" without warranties of any kind.',
      'We do not guarantee the accuracy or completeness of information on our platform.',
      'We are not responsible for the actions of users or third parties.',
      'We do not guarantee that our services will be uninterrupted or error-free.',
      'Your use of our services is at your own risk.'
    ]
  },
  {
    title: 'Limitation of Liability',
    content: [
      'HomeVerse\'s liability is limited to the maximum extent permitted by law.',
      'We are not liable for indirect, incidental, or consequential damages.',
      'Our total liability will not exceed the amount you paid for our services.',
      'Some jurisdictions do not allow certain liability limitations.',
      'These limitations apply whether liability arises from contract, tort, or other legal theory.'
    ]
  }
]

const keyPoints = [
  {
    icon: CheckCircle,
    title: 'Fair Use',
    description: 'Use our platform responsibly and in accordance with housing laws and regulations.'
  },
  {
    icon: Shield,
    title: 'Data Protection',
    description: 'We protect your personal information according to our Privacy Policy and applicable laws.'
  },
  {
    icon: Scale,
    title: 'Legal Compliance',
    description: 'Our terms comply with federal fair housing laws and state regulations.'
  },
  {
    icon: AlertTriangle,
    title: 'Important Limits',
    description: 'We facilitate connections but don\'t make housing decisions or guarantee outcomes.'
  }
]

export default function TermsOfServicePage() {
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
            <FileText className="h-3 w-3 mr-1" />
            Terms of Service
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            These terms govern your use of HomeVerse and outline the rights and responsibilities of all users. Please read them carefully.
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

        {/* Key Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {keyPoints.map((point, index) => {
            const Icon = point.icon
            return (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center">
                <CardContent className="p-6">
                  <div className="h-10 w-10 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-5 w-5 text-sage-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{point.title}</h3>
                  <p className="text-sm text-gray-600">{point.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-3">
                      <span className="text-sage-600 font-medium text-sm mt-1">
                        {index + 1}.{itemIndex + 1}
                      </span>
                      <p className="text-gray-700">{item}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="h-5 w-5 mr-2 text-sage-600" />
                Termination
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-sage-600 text-sm mt-1">•</span>
                  <span>You may terminate your account at any time by contacting us.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-sage-600 text-sm mt-1">•</span>
                  <span>We may terminate accounts that violate these terms.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-sage-600 text-sm mt-1">•</span>
                  <span>Upon termination, your access to services will cease.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-sage-600 text-sm mt-1">•</span>
                  <span>Data retention follows our Privacy Policy.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-sage-600" />
                Governing Law
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-sage-600 text-sm mt-1">•</span>
                  <span>These terms are governed by California state law.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-sage-600 text-sm mt-1">•</span>
                  <span>Disputes will be resolved in San Francisco County courts.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-sage-600 text-sm mt-1">•</span>
                  <span>Federal fair housing laws apply to all services.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-sage-600 text-sm mt-1">•</span>
                  <span>Local housing regulations may also apply.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Fair Housing Notice */}
        <Card className="border-0 shadow-lg bg-blue-50 border-blue-200 mt-12">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Fair Housing Commitment</h3>
                <p className="text-blue-700 text-sm">
                  HomeVerse is committed to fair housing practices and compliance with the Fair Housing Act. 
                  We do not discriminate based on race, color, religion, sex, national origin, familial status, 
                  or disability. All users must comply with fair housing laws when using our platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mt-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-sage-600" />
              Questions About These Terms?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              If you have questions about these Terms of Service, please contact our legal team:
            </p>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Email:</strong> legal@homeverse.com
              </p>
              <p className="text-sm">
                <strong>Mail:</strong><br />
                HomeVerse Legal Department<br />
                123 Housing Innovation Blvd<br />
                San Francisco, CA 94105
              </p>
              <Link href="/contact">
                <Button variant="outline" className="mt-4 rounded-full">
                  Contact Us
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Updates Notice */}
        <Card className="border-0 shadow-lg bg-amber-50 border-amber-200 mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold text-amber-800 mb-2">Terms Updates</h3>
            <p className="text-amber-700 text-sm">
              We may update these terms from time to time. Material changes will be communicated via email or platform notification. 
              Continued use after changes constitutes acceptance of the updated terms.
            </p>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            For additional information, please review our related policies:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/privacy">
              <Button variant="outline" className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full">
                Privacy Policy
              </Button>
            </Link>
            <Link href="/contact">
              <Button className="bg-sage-600 hover:bg-sage-700 text-white rounded-full">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}