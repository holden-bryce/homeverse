'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  MessageSquare,
  HelpCircle,
  Building2,
  Users,
  CreditCard
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get help with your account or technical issues',
    contact: 'support@homeverse.com',
    responseTime: 'Within 24 hours'
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Speak directly with our team',
    contact: '(555) 123-4567',
    responseTime: 'Mon-Fri, 9am-6pm PST'
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Chat with us in real-time',
    contact: 'Available in dashboard',
    responseTime: 'Mon-Fri, 9am-5pm PST'
  }
]

const departments = [
  {
    icon: HelpCircle,
    title: 'General Support',
    email: 'support@homeverse.com',
    description: 'Account help, technical issues, and general questions'
  },
  {
    icon: CreditCard,
    title: 'Sales & Partnerships',
    email: 'sales@homeverse.com', 
    description: 'Pricing, enterprise plans, and partnership opportunities'
  },
  {
    icon: Building2,
    title: 'Developer Relations',
    email: 'developers@homeverse.com',
    description: 'API documentation, integrations, and technical partnerships'
  },
  {
    icon: Users,
    title: 'Community & Outreach',
    email: 'community@homeverse.com',
    description: 'Events, advocacy, and community partnerships'
  }
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    subject: '',
    department: '',
    message: '',
    urgency: 'medium'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Use real backend API instead of localStorage simulation
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          subject: formData.subject,
          message: formData.message,
        }),
      })

      if (response.ok) {
        toast({
          title: "Message sent successfully!",
          description: "We'll get back to you within 24 hours.",
        })

        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          role: '',
          subject: '',
          department: '',
          message: '',
          urgency: 'medium'
        })
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      toast({
        variant: 'destructive',
        title: "Error sending message",
        description: "Please try again or contact us directly.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-sage-100 text-sage-800 border border-sage-200 rounded-full mb-4">
            Contact Us
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Have questions about HomeVerse? Need support with your account? Our team is here to help you succeed in affordable housing.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {contactMethods.map((method, index) => {
            const Icon = method.icon
            return (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-sage-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                  <p className="font-medium text-sage-600 mb-2">{method.contact}</p>
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {method.responseTime}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company/Organization</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Your Role</Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="housing_seeker">Housing Seeker</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="lender">Lender/Investor</SelectItem>
                        <SelectItem value="property_manager">Property Manager</SelectItem>
                        <SelectItem value="government">Government Official</SelectItem>
                        <SelectItem value="nonprofit">Nonprofit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="support">General Support</SelectItem>
                        <SelectItem value="sales">Sales & Partnerships</SelectItem>
                        <SelectItem value="developers">Developer Relations</SelectItem>
                        <SelectItem value="community">Community & Outreach</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="urgency">Priority Level</Label>
                    <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - General inquiry</SelectItem>
                        <SelectItem value="medium">Medium - Standard request</SelectItem>
                        <SelectItem value="high">High - Urgent issue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                    className="mt-1"
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                    className="mt-1"
                    rows={5}
                    placeholder="Please provide details about your question or request..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-sage-600 hover:bg-sage-700 text-white rounded-full py-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Departments & Office Info */}
          <div className="space-y-6">
            {/* Departments */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Contact by Department</CardTitle>
                <CardDescription>
                  Reach out to the right team for faster assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {departments.map((dept, index) => {
                  const Icon = dept.icon
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="h-8 w-8 bg-sage-100 rounded-full flex items-center justify-center">
                          <Icon className="h-4 w-4 text-sage-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{dept.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{dept.description}</p>
                          <a 
                            href={`mailto:${dept.email}`}
                            className="text-sage-600 font-medium text-sm hover:underline"
                          >
                            {dept.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Office Information */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Office Information</CardTitle>
                <CardDescription>
                  Visit us or send mail to our headquarters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-sage-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Headquarters</h4>
                    <p className="text-gray-600 text-sm">
                      123 Housing Innovation Blvd<br />
                      San Francisco, CA 94105<br />
                      United States
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-sage-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Business Hours</h4>
                    <p className="text-gray-600 text-sm">
                      Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                      Saturday: 10:00 AM - 2:00 PM PST<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-sage-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Phone Support</h4>
                    <p className="text-gray-600 text-sm">
                      Main: (555) 123-4567<br />
                      Sales: (555) 123-4568<br />
                      Support: (555) 123-4569
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}