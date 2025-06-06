'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Target, 
  Heart,
  Shield,
  TrendingUp,
  Building2,
  MapPin,
  Award,
  ArrowRight
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'

const teamMembers = [
  {
    name: 'Sarah Chen',
    role: 'CEO & Co-Founder',
    bio: 'Former housing policy director with 15+ years in affordable housing development.',
    image: '/api/placeholder/150/150'
  },
  {
    name: 'Marcus Rodriguez',
    role: 'CTO & Co-Founder', 
    bio: 'Tech veteran focused on building scalable platforms for social impact.',
    image: '/api/placeholder/150/150'
  },
  {
    name: 'Jennifer Park',
    role: 'Head of Policy',
    bio: 'Housing finance expert and former HUD program manager.',
    image: '/api/placeholder/150/150'
  },
  {
    name: 'David Kim',
    role: 'Head of Product',
    bio: 'Product leader passionate about user-centered design for complex systems.',
    image: '/api/placeholder/150/150'
  }
]

const values = [
  {
    icon: Heart,
    title: 'Impact First',
    description: 'Every feature we build is designed to increase access to affordable housing.'
  },
  {
    icon: Shield,
    title: 'Trust & Transparency',
    description: 'We handle sensitive housing data with the highest security and privacy standards.'
  },
  {
    icon: Users,
    title: 'Inclusive by Design',
    description: 'Our platform serves all stakeholders in the affordable housing ecosystem.'
  },
  {
    icon: TrendingUp,
    title: 'Data-Driven',
    description: 'We use analytics and AI to optimize matches and improve outcomes.'
  }
]

export default function AboutPage() {
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
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="bg-sage-100 text-sage-800 border border-sage-200 rounded-full mb-4">
            About HomeVerse
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Revolutionizing
            <span className="text-sage-600 block">Affordable Housing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We're building the future of affordable housing by connecting the right people with the right homes through intelligent matching, streamlined processes, and data-driven insights.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-6">
              HomeVerse exists to make affordable housing more accessible, efficient, and equitable. We believe that everyone deserves a safe, affordable place to call home, and technology can help us get there faster.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              By connecting housing seekers, developers, and lenders on a single platform, we're reducing friction, increasing transparency, and improving outcomes for all stakeholders in the affordable housing ecosystem.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-sage-600">50K+</div>
                <div className="text-sm text-gray-600">Applications Processed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-sage-600">200+</div>
                <div className="text-sm text-gray-600">Active Projects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-sage-600">85%</div>
                <div className="text-sm text-gray-600">Match Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-sage-600">$2.4B</div>
                <div className="text-sm text-gray-600">Housing Value Managed</div>
              </div>
            </div>
          </div>
          <div className="bg-sage-100 rounded-2xl p-8 flex items-center justify-center">
            <div className="text-center">
              <Building2 className="h-24 w-24 text-sage-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Building Communities</h3>
              <p className="text-gray-600">
                Every connection we make helps build stronger, more inclusive communities across the country.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do, from product decisions to customer relationships.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-sage-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-gray-600 text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're a passionate team of housing advocates, policy experts, and technologists working to solve one of society's most important challenges.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center">
                <CardContent className="p-6">
                  <div className="w-20 h-20 bg-sage-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-10 w-10 text-sage-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-sage-600 font-medium text-sm mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Impact Section */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-sage-600 to-teal-600 text-white mb-20">
          <CardContent className="p-12 text-center">
            <Award className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl font-bold mb-4">Making a Real Impact</h2>
            <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
              Since launching, we've helped thousands of families find affordable housing, enabled billions in housing investments, and streamlined processes that used to take months.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold mb-2">12,500</div>
                <div className="opacity-90">Families Housed</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">300+</div>
                <div className="opacity-90">Partner Organizations</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">25</div>
                <div className="opacity-90">States Served</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Join Us?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Whether you're a housing seeker, developer, or lender, HomeVerse has tools to help you achieve your housing goals more efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8 py-3">
                Get Started Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full px-8 py-3">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}