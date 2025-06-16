'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { Send } from 'lucide-react'
import { submitContactForm } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      className="w-full bg-teal-600 hover:bg-teal-700"
      disabled={pending}
    >
      <Send className="mr-2 h-4 w-4" />
      {pending ? 'Sending...' : 'Send Message'}
    </Button>
  )
}

export function ContactForm() {
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(formData: FormData) {
    try {
      await submitContactForm(formData)
      
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
    } catch (error) {
      console.error('Contact form error:', error)
      toast({
        variant: 'destructive',
        title: "Error sending message",
        description: "Please try again or contact us directly.",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send us a message</CardTitle>
        <CardDescription>
          Fill out the form below and we'll get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company (optional)</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Your Role</Label>
              <Select
                name="role"
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lender">Lender</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="buyer">Homebuyer</SelectItem>
                  <SelectItem value="applicant">Housing Applicant</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                name="department"
                value={formData.department}
                onValueChange={(value) => handleInputChange('department', value)}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">General Support</SelectItem>
                  <SelectItem value="sales">Sales & Partnerships</SelectItem>
                  <SelectItem value="developers">Developer Relations</SelectItem>
                  <SelectItem value="community">Community & Outreach</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency">Priority</Label>
              <Select
                name="urgency"
                value={formData.urgency}
                onValueChange={(value) => handleInputChange('urgency', value)}
              >
                <SelectTrigger id="urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Brief description of your inquiry"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Please provide details about your inquiry..."
              className="min-h-[150px]"
              required
            />
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}