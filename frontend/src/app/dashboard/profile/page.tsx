import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Building, Shield, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function ProfilePage() {
  const profile = await getUserProfile()
  if (!profile) {
    redirect('/auth/login')
  }

  const supabase = createClient()
  
  // Fetch user details with company info
  const { data: userDetails, error } = await supabase
    .from('profiles')
    .select(`
      *,
      companies (
        id,
        name,
        plan,
        seats_used,
        max_seats
      )
    `)
    .eq('id', profile.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
  }

  const user = userDetails || profile

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center mt-1">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <Input 
                  id="email" 
                  value={user.email} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={user.full_name || 'Not set'} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="role">Account Type</Label>
              <div className="flex items-center mt-1">
                <Shield className="h-4 w-4 mr-2 text-gray-400" />
                <Input 
                  id="role" 
                  value={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="joined">Member Since</Label>
              <div className="flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <Input 
                  id="joined" 
                  value={new Date(user.created_at || Date.now()).toLocaleDateString()} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      {user.companies && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organization Details
            </CardTitle>
            <CardDescription>Your company information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company Name</Label>
                <Input 
                  id="company" 
                  value={user.companies.name} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="plan">Subscription Plan</Label>
                <Input 
                  id="plan" 
                  value={user.companies.plan.charAt(0).toUpperCase() + user.companies.plan.slice(1)} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="seats">User Seats</Label>
                <Input 
                  id="seats" 
                  value={`${user.companies.seats_used || 0} / ${user.companies.max_seats || 5} used`} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Actions</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard/settings">
            <Button variant="outline">
              Edit Profile
            </Button>
          </Link>
          <Link href="/dashboard/settings?tab=security">
            <Button variant="outline">
              Security Settings
            </Button>
          </Link>
          <Link href="/dashboard/settings?tab=notifications">
            <Button variant="outline">
              Notification Preferences
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}