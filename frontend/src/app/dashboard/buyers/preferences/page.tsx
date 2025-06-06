'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/toast'
import { 
  Save,
  ArrowLeft,
  MapPin,
  DollarSign,
  Home,
  Users,
  Calendar,
  Car,
  Train,
  Building,
  TreePine,
  Dumbbell,
  Baby,
  Dog,
  ShoppingCart,
  GraduationCap,
  Heart
} from 'lucide-react'

const amenityOptions = [
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'transit', label: 'Transit Access', icon: Train },
  { id: 'playground', label: 'Playground', icon: Baby },
  { id: 'fitness', label: 'Fitness Center', icon: Dumbbell },
  { id: 'laundry', label: 'Laundry', icon: Building },
  { id: 'pets', label: 'Pet Friendly', icon: Dog },
  { id: 'pool', label: 'Pool', icon: Building },
  { id: 'community_room', label: 'Community Room', icon: Users },
]

export default function BuyerPreferencesPage() {
  const router = useRouter()
  
  // Form state
  const [householdSize, setHouseholdSize] = useState('2')
  const [annualIncome, setAnnualIncome] = useState('50000')
  const [preferredUnitTypes, setPreferredUnitTypes] = useState<string[]>(['1BR', '2BR'])
  const [maxCommute, setMaxCommute] = useState([30])
  const [minTransitScore, setMinTransitScore] = useState([70])
  const [minSchoolRating, setMinSchoolRating] = useState([7])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['parking', 'laundry'])
  const [notificationPreferences, setNotificationPreferences] = useState({
    newMatches: true,
    applicationUpdates: true,
    priceChanges: false,
    projectUpdates: true,
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleUnitTypeToggle = (unitType: string) => {
    setPreferredUnitTypes(prev => 
      prev.includes(unitType) 
        ? prev.filter(t => t !== unitType)
        : [...prev, unitType]
    )
  }

  const handleAmenityToggle = (amenityId: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityId) 
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const preferences = {
      householdSize,
      annualIncome,
      preferredUnitTypes,
      maxCommute: maxCommute[0],
      minTransitScore: minTransitScore[0],
      minSchoolRating: minSchoolRating[0],
      selectedAmenities,
      notificationPreferences
    }
    
    console.log('Saving preferences:', preferences)
    localStorage.setItem('buyerPreferences', JSON.stringify(preferences))
    
    setIsSaving(false)
    toast({
      title: "Preferences saved",
      description: "Your housing preferences have been updated successfully.",
    })
    
    // Redirect back to buyers page
    router.push('/dashboard/buyers')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/buyers')}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Housing Preferences</h1>
              <p className="text-gray-600 mt-1">
                Tell us what you're looking for in your next home
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              This helps us match you with eligible properties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Household Size</Label>
                <Select value={householdSize} onValueChange={setHouseholdSize}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select household size" />
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
                <Label>Annual Household Income</Label>
                <div className="relative mt-2">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    className="pl-10"
                    placeholder="50000"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  This determines your AMI eligibility
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unit Preferences */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Unit Preferences</CardTitle>
            <CardDescription>
              Select all unit types you're interested in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {['Studio', '1BR', '2BR', '3BR', '4BR+'].map((unitType) => (
                <Button
                  key={unitType}
                  variant={preferredUnitTypes.includes(unitType) ? "default" : "outline"}
                  onClick={() => handleUnitTypeToggle(unitType)}
                  className="rounded-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  {unitType}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Location & Commute */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Location & Commute</CardTitle>
            <CardDescription>
              Set your location and transportation preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Maximum Commute Time</Label>
                <span className="text-sm font-medium">{maxCommute[0]} minutes</span>
              </div>
              <Slider
                value={maxCommute}
                onValueChange={setMaxCommute}
                max={120}
                min={10}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Minimum Transit Score</Label>
                <span className="text-sm font-medium">{minTransitScore[0]}/100</span>
              </div>
              <Slider
                value={minTransitScore}
                onValueChange={setMinTransitScore}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Minimum School Rating</Label>
                <span className="text-sm font-medium">{minSchoolRating[0]}/10</span>
              </div>
              <Slider
                value={minSchoolRating}
                onValueChange={setMinSchoolRating}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
            <CardDescription>
              Select amenities that are important to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {amenityOptions.map((amenity) => {
                const Icon = amenity.icon
                return (
                  <div
                    key={amenity.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAmenities.includes(amenity.id)
                        ? 'border-sage-500 bg-sage-50'
                        : 'border-gray-200 hover:border-sage-300'
                    }`}
                    onClick={() => handleAmenityToggle(amenity.id)}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Icon className={`h-6 w-6 ${
                        selectedAmenities.includes(amenity.id) ? 'text-sage-600' : 'text-gray-400'
                      }`} />
                      <span className="text-sm font-medium">{amenity.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose how you want to be notified about updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>New Matches</Label>
                <p className="text-sm text-gray-500">Get notified when new properties match your criteria</p>
              </div>
              <Switch
                checked={notificationPreferences.newMatches}
                onCheckedChange={(checked) => 
                  setNotificationPreferences(prev => ({ ...prev, newMatches: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Application Updates</Label>
                <p className="text-sm text-gray-500">Receive updates on your application status</p>
              </div>
              <Switch
                checked={notificationPreferences.applicationUpdates}
                onCheckedChange={(checked) => 
                  setNotificationPreferences(prev => ({ ...prev, applicationUpdates: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Price Changes</Label>
                <p className="text-sm text-gray-500">Alert me when prices change on saved properties</p>
              </div>
              <Switch
                checked={notificationPreferences.priceChanges}
                onCheckedChange={(checked) => 
                  setNotificationPreferences(prev => ({ ...prev, priceChanges: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Project Updates</Label>
                <p className="text-sm text-gray-500">Get updates on construction progress and milestones</p>
              </div>
              <Switch
                checked={notificationPreferences.projectUpdates}
                onCheckedChange={(checked) => 
                  setNotificationPreferences(prev => ({ ...prev, projectUpdates: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/buyers')}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}