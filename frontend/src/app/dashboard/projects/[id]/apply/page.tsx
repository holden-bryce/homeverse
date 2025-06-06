'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { 
  ArrowLeft,
  Upload,
  FileText,
  DollarSign,
  Users,
  Home,
  MapPin,
  Calendar,
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

// Mock project data - in real app, this would come from API
const getProjectById = (id: string) => {
  const projects = {
    '1': {
      id: '1',
      name: 'Sunset Gardens',
      developer: 'Urban Housing LLC',
      location: 'San Francisco, CA',
      ami_ranges: ['30%', '50%', '80%'],
      unit_types: ['Studio', '1BR', '2BR'],
      price_range: '$1,200 - $2,800',
      estimated_delivery: '2024-12-15',
      description: 'Modern affordable housing in the heart of San Francisco with excellent transit access.',
      application_deadline: '2024-03-15',
      required_documents: [
        'Photo ID',
        'Proof of income (last 3 months)',
        'Bank statements',
        'References (2 required)',
      ],
    },
    '2': {
      id: '2',
      name: 'Riverside Commons',
      developer: 'Bay Area Developers',
      location: 'Oakland, CA',
      ami_ranges: ['50%', '80%', '120%'],
      unit_types: ['1BR', '2BR', '3BR'],
      price_range: '$1,500 - $3,200',
      estimated_delivery: '2025-03-20',
      description: 'Family-friendly community near top-rated schools and public transportation.',
      application_deadline: '2024-04-01',
      required_documents: [
        'Photo ID',
        'Proof of income (last 3 months)',
        'Bank statements',
        'Credit report',
        'References (2 required)',
      ],
    },
  }
  return projects[id as keyof typeof projects]
}

export default function ProjectApplicationPage() {
  const router = useRouter()
  const { id } = useParams()
  const project = getProjectById(id as string)
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    householdSize: '',
    annualIncome: '',
    preferredUnitType: '',
    moveInDate: '',
    employmentStatus: '',
    currentAddress: '',
    emergencyContact: '',
    emergencyPhone: '',
    additionalInfo: '',
  })
  
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([])
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50 flex items-center justify-center">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
            <p className="text-gray-500 mb-4">The project you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboard/buyers')} className="rounded-full">
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDocumentUpload = (docType: string) => {
    // Simulate document upload
    if (!uploadedDocs.includes(docType)) {
      setUploadedDocs(prev => [...prev, docType])
      toast({
        title: "Document uploaded",
        description: `${docType} has been uploaded successfully.`,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!agreedToTerms) {
      toast({
        title: "Terms required",
        description: "Please agree to the terms and conditions to continue.",
        variant: "destructive",
      })
      return
    }

    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'householdSize', 'annualIncome', 'preferredUnitType']
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData])
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const applicationData = {
      projectId: project.id,
      projectName: project.name,
      ...formData,
      uploadedDocs,
      submittedAt: new Date().toISOString(),
    }
    
    console.log('Submitting application:', applicationData)
    
    // Store application in localStorage (in real app, would send to API)
    const existingApplications = JSON.parse(localStorage.getItem('applications') || '[]')
    const newApplication = {
      id: Date.now().toString(),
      status: 'submitted',
      ...applicationData,
    }
    localStorage.setItem('applications', JSON.stringify([...existingApplications, newApplication]))
    
    setIsSubmitting(false)
    
    toast({
      title: "Application submitted!",
      description: `Your application for ${project.name} has been submitted successfully.`,
    })
    
    // Redirect to applications page or confirmation
    router.push('/dashboard/buyers?tab=applications')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Apply to {project.name}</h1>
            <p className="text-gray-600 mt-1">
              Submit your application for affordable housing
            </p>
          </div>
        </div>

        {/* Project Summary */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{project.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{project.price_range}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Due: {new Date(project.application_deadline).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {project.ami_ranges.map((ami) => (
                  <Badge key={ami} className="bg-sage-100 text-sage-800 border border-sage-200 rounded-full">
                    {ami} AMI
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Provide your basic contact and household information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="mt-1"
                    required
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
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currentAddress">Current Address</Label>
                <Textarea
                  id="currentAddress"
                  value={formData.currentAddress}
                  onChange={(e) => handleInputChange('currentAddress', e.target.value)}
                  className="mt-1"
                  placeholder="Enter your current address"
                />
              </div>
            </CardContent>
          </Card>

          {/* Household & Income Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Household & Income Information</CardTitle>
              <CardDescription>
                This information determines your eligibility for specific units
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="householdSize">Household Size *</Label>
                  <Select value={formData.householdSize} onValueChange={(value) => handleInputChange('householdSize', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Person</SelectItem>
                      <SelectItem value="2">2 People</SelectItem>
                      <SelectItem value="3">3 People</SelectItem>
                      <SelectItem value="4">4 People</SelectItem>
                      <SelectItem value="5">5 People</SelectItem>
                      <SelectItem value="6+">6+ People</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="annualIncome">Annual Household Income *</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="annualIncome"
                      type="number"
                      value={formData.annualIncome}
                      onChange={(e) => handleInputChange('annualIncome', e.target.value)}
                      className="pl-10"
                      placeholder="50000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="preferredUnitType">Preferred Unit Type *</Label>
                  <Select value={formData.preferredUnitType} onValueChange={(value) => handleInputChange('preferredUnitType', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select unit type" />
                    </SelectTrigger>
                    <SelectContent>
                      {project.unit_types.map((unitType) => (
                        <SelectItem key={unitType} value={unitType}>{unitType}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employmentStatus">Employment Status</Label>
                  <Select value={formData.employmentStatus} onValueChange={(value) => handleInputChange('employmentStatus', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self-employed">Self-Employed</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="moveInDate">Preferred Move-in Date</Label>
                  <Input
                    id="moveInDate"
                    type="date"
                    value={formData.moveInDate}
                    onChange={(e) => handleInputChange('moveInDate', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>
                Provide an emergency contact person
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
              <CardDescription>
                Upload the following documents to complete your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.required_documents.map((doc) => (
                  <div key={doc} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{doc}</span>
                    </div>
                    {uploadedDocs.includes(doc) ? (
                      <Badge className="bg-green-100 text-green-800 border border-green-200 rounded-full">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDocumentUpload(doc)}
                        className="rounded-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Any additional information you'd like to provide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                placeholder="Enter any additional information, special circumstances, or questions..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                />
                <div className="text-sm">
                  <Label htmlFor="terms" className="cursor-pointer">
                    I agree to the terms and conditions *
                  </Label>
                  <p className="text-gray-500 mt-1">
                    By submitting this application, I acknowledge that all information provided is accurate 
                    and complete. I understand that false information may result in application rejection.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}