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
  CheckCircle,
  Building2
} from 'lucide-react'

// Mock property data - would fetch from API based on ID
const getPropertyById = (id: string) => {
  const properties = {
    '1': {
      id: '1',
      name: 'Sunset Gardens',
      address: '1234 Sunset Blvd',
      location: 'San Francisco, CA',
      monthlyRent: 1800,
      amiLevels: '30-80%',
      bedrooms: 2,
      bathrooms: 1,
      sqft: 850,
      availableUnits: 24,
      totalUnits: 120,
      developer: 'Urban Housing LLC',
      applicationDeadline: '2024-03-15',
      requiredDocuments: [
        'Government-issued ID',
        'Proof of income (last 2 pay stubs)',
        'Bank statements (last 2 months)',
        'Employment verification letter',
        'Previous landlord references',
      ],
    },
    '2': {
      id: '2',
      name: 'Riverside Commons',
      address: '5678 River Road',
      location: 'Oakland, CA',
      monthlyRent: 2200,
      amiLevels: '50-120%',
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1200,
      availableUnits: 15,
      totalUnits: 85,
      developer: 'Bay Area Developers',
      applicationDeadline: '2024-04-01',
      requiredDocuments: [
        'Government-issued ID',
        'Proof of income (last 3 months)',
        'Bank statements (last 3 months)',
        'Credit report',
        'Employment verification',
        'Previous landlord references',
      ],
    },
  }
  return properties[id as keyof typeof properties]
}

export default function PropertyApplicationPage() {
  const router = useRouter()
  const { id } = useParams()
  const property = getPropertyById(id as string)
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    householdSize: '',
    annualIncome: '',
    preferredMoveInDate: '',
    employmentStatus: '',
    employerName: '',
    currentAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    additionalInfo: '',
    hasRentalHistory: '',
    previousLandlord: '',
    previousLandlordPhone: '',
  })
  
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([])
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Property not found</h3>
            <p className="text-gray-500 mb-4">The property you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboard/buyers')} className="rounded-full">
              Back to Browse
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

    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'householdSize', 'annualIncome']
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
      propertyId: property.id,
      propertyName: property.name,
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
      description: `Your application for ${property.name} has been submitted successfully.`,
    })
    
    // Redirect to applications page
    router.push('/dashboard/buyers/applications')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/dashboard/buyers/properties/${property.id}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Property
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Apply for {property.name}</h1>
              <p className="text-gray-600 text-sm">
                Complete your application for affordable housing
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl space-y-6">
        {/* Property Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">{property.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{property.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span>${property.monthlyRent}/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Due: {new Date(property.applicationDeadline).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <Badge className="bg-teal-100 text-teal-800 border border-teal-200 rounded-full">
                    AMI: {property.amiLevels}
                  </Badge>
                  <Badge className="ml-2 bg-gray-100 text-gray-800 border border-gray-200 rounded-full">
                    {property.bedrooms} bed • {property.bathrooms} bath • {property.sqft} sqft
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Provide your basic contact and identification information
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
          <Card>
            <CardHeader>
              <CardTitle>Household & Income Information</CardTitle>
              <CardDescription>
                This information determines your eligibility and unit assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employmentStatus">Employment Status *</Label>
                  <Select value={formData.employmentStatus} onValueChange={(value) => handleInputChange('employmentStatus', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed Full-Time</SelectItem>
                      <SelectItem value="part-time">Employed Part-Time</SelectItem>
                      <SelectItem value="self-employed">Self-Employed</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="employerName">Employer Name</Label>
                  <Input
                    id="employerName"
                    value={formData.employerName}
                    onChange={(e) => handleInputChange('employerName', e.target.value)}
                    className="mt-1"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="preferredMoveInDate">Preferred Move-in Date</Label>
                <Input
                  id="preferredMoveInDate"
                  type="date"
                  value={formData.preferredMoveInDate}
                  onChange={(e) => handleInputChange('preferredMoveInDate', e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Rental History */}
          <Card>
            <CardHeader>
              <CardTitle>Rental History</CardTitle>
              <CardDescription>
                Information about your previous housing situation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hasRentalHistory">Do you have rental history?</Label>
                <Select value={formData.hasRentalHistory} onValueChange={(value) => handleInputChange('hasRentalHistory', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="first-time">First-time renter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.hasRentalHistory === 'yes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="previousLandlord">Previous Landlord Name</Label>
                    <Input
                      id="previousLandlord"
                      value={formData.previousLandlord}
                      onChange={(e) => handleInputChange('previousLandlord', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="previousLandlordPhone">Previous Landlord Phone</Label>
                    <Input
                      id="previousLandlordPhone"
                      type="tel"
                      value={formData.previousLandlordPhone}
                      onChange={(e) => handleInputChange('previousLandlordPhone', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>
                Provide an emergency contact person
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
              <CardDescription>
                Upload the following documents to complete your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {property.requiredDocuments.map((doc) => (
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
          <Card>
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
          <Card>
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
              onClick={() => router.push(`/dashboard/buyers/properties/${property.id}`)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-8"
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