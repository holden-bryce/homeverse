import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  MessageSquare,
  HelpCircle,
  Building2,
  Users,
  CreditCard
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import { ContactForm } from './ContactForm'

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Logo className="h-8 w-auto" />
              <span className="text-xl font-bold text-gray-900">HomeVerse</span>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/about" className="text-gray-600 hover:text-teal-600">About</Link>
              <Link href="/auth/login" className="text-gray-600 hover:text-teal-600">Sign In</Link>
              <Link href="/auth/register" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            How can we help you?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our team is here to support you with any questions about our platform, 
            partnership opportunities, or technical assistance.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {contactMethods.map((method, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <method.icon className="h-8 w-8 text-teal-600" />
                    <Badge variant="secondary" className="text-xs">
                      {method.responseTime}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{method.title}</CardTitle>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-gray-900">{method.contact}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content - Form and Departments */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <ContactForm />
            </div>

            {/* Department Contacts */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Department Contacts</CardTitle>
                  <CardDescription>
                    Reach out directly to the appropriate team
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {departments.map((dept, index) => (
                    <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-start space-x-3">
                        <dept.icon className="h-5 w-5 text-teal-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{dept.title}</h4>
                          <p className="text-sm text-gray-600 mb-1">{dept.description}</p>
                          <a 
                            href={`mailto:${dept.email}`}
                            className="text-sm text-teal-600 hover:text-teal-700"
                          >
                            {dept.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Office Location */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Office Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-teal-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">HomeVerse HQ</p>
                      <p className="text-sm text-gray-600">
                        123 Market Street, Suite 400<br />
                        San Francisco, CA 94103
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-teal-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Office Hours</p>
                      <p className="text-sm text-gray-600">
                        Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                        Saturday - Sunday: Closed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Logo className="h-10 w-auto mx-auto mb-4 text-white" />
            <p className="text-gray-400">© 2024 HomeVerse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}