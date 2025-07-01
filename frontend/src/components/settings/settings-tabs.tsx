'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { 
  User,
  Building2,
  Bell,
  Shield,
  Key,
  Save,
  Trash2,
  Download,
  AlertTriangle
} from 'lucide-react'

interface SettingsTabsProps {
  initialProfile: any
  initialCompany: any
  userRole: string
}

export function SettingsTabs({ initialProfile, initialCompany, userRole }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  
  // User Profile State
  const [userProfile, setUserProfile] = useState({
    firstName: initialProfile?.full_name?.split(' ')[0] || '',
    lastName: initialProfile?.full_name?.split(' ').slice(1).join(' ') || '',
    email: initialProfile?.email || '',
    phone: initialProfile?.phone || '',
    title: initialProfile?.title || '',
    department: initialProfile?.department || '',
    timezone: initialProfile?.timezone || 'America/Los_Angeles',
    language: initialProfile?.language || 'en',
  })

  // Company Settings State
  const [companySettings, setCompanySettings] = useState({
    name: initialCompany?.name || '',
    address: initialCompany?.address || '',
    city: initialCompany?.city || '',
    state: initialCompany?.state || '',
    zipCode: initialCompany?.zip_code || '',
    phone: initialCompany?.phone || '',
    website: initialCompany?.website || '',
    description: initialCompany?.description || '',
    plan: initialCompany?.plan || 'trial',
    seats: initialCompany?.seats || 5,
  })

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    newMatches: true,
    projectUpdates: true,
    applicationUpdates: true,
    systemMaintenance: true,
    weeklyReports: true,
    monthlyReports: false,
  })

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '8',
    passwordExpiry: '90',
    loginAttempts: '5',
  })

  const handleUserProfileChange = (field: string, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleCompanySettingsChange = (field: string, value: string) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSecurityChange = (field: string, value: string | boolean) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async (section: string) => {
    setIsSaving(true)
    
    try {
      if (section === 'Profile') {
        const { updateProfile } = await import('@/app/dashboard/settings/actions')
        await updateProfile({
          full_name: `${userProfile.firstName} ${userProfile.lastName}`.trim(),
          phone: userProfile.phone,
          timezone: userProfile.timezone,
          language: userProfile.language
        })
      } else if (section === 'Company') {
        const { updateCompany } = await import('@/app/dashboard/settings/actions')
        await updateCompany({
          name: companySettings.name,
          address: companySettings.address,
          city: companySettings.city,
          state: companySettings.state,
          zip_code: companySettings.zipCode,
          phone: companySettings.phone,
          website: companySettings.website,
          description: companySettings.description
        })
      } else if (section === 'Notifications') {
        const { updateNotificationSettings } = await import('@/app/dashboard/settings/actions')
        await updateNotificationSettings(notificationSettings)
      } else if (section === 'Security') {
        const { updateSecuritySettings } = await import('@/app/dashboard/settings/actions')
        await updateSecuritySettings(securitySettings)
      }
      
      toast({
        title: "Settings saved",
        description: `${section} settings have been updated successfully.`,
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportData = () => {
    const data = {
      userProfile,
      companySettings,
      notificationSettings,
      securitySettings,
      exportedAt: new Date().toISOString(),
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'homeverse-settings.json'
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Data exported",
      description: "Your settings have been exported successfully.",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your account, company, and application preferences
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleExportData} className="rounded-full">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm rounded-full border-0 shadow-lg">
            <TabsTrigger value="profile" className="rounded-full">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="company" className="rounded-full">
              <Building2 className="mr-2 h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-full">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-full">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={userProfile.firstName}
                      onChange={(e) => handleUserProfileChange('firstName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={userProfile.lastName}
                      onChange={(e) => handleUserProfileChange('lastName', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userProfile.email}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={userProfile.phone}
                      onChange={(e) => handleUserProfileChange('phone', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={userProfile.timezone} onValueChange={(value) => handleUserProfileChange('timezone', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select value={userProfile.language} onValueChange={(value) => handleUserProfileChange('language', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleSave('Profile')}
                    disabled={isSaving}
                    className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Settings - Only show for admin/developer */}
          {['admin', 'developer'].includes(userRole) && (
            <TabsContent value="company" className="space-y-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    Manage your organization's details and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companySettings.name}
                      onChange={(e) => handleCompanySettingsChange('name', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="plan">Current Plan</Label>
                      <div className="mt-1 flex items-center space-x-3">
                        <Badge className={`${
                          companySettings.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                          companySettings.plan === 'professional' ? 'bg-teal-100 text-teal-800' :
                          'bg-green-100 text-green-800'
                        } rounded-full`}>
                          {companySettings.plan.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="seats">Active Seats</Label>
                      <div className="mt-1 flex items-center space-x-3">
                        <span className="text-lg font-semibold">{companySettings.seats}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={() => handleSave('Company')}
                      disabled={isSaving}
                      className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Company
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Matches</Label>
                      <p className="text-sm text-gray-500">Alert when new matches are found</p>
                    </div>
                    <Switch
                      checked={notificationSettings.newMatches}
                      onCheckedChange={(checked) => handleNotificationChange('newMatches', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Project Updates</Label>
                      <p className="text-sm text-gray-500">Updates on project status changes</p>
                    </div>
                    <Switch
                      checked={notificationSettings.projectUpdates}
                      onCheckedChange={(checked) => handleNotificationChange('projectUpdates', checked)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleSave('Notifications')}
                    disabled={isSaving}
                    className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => handleSecurityChange('twoFactorEnabled', checked)}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Password Management</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Key className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleSave('Security')}
                    disabled={isSaving}
                    className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Security
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}