import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { SettingsTabs } from '@/components/settings/settings-tabs'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default async function SettingsPage() {
  const profile = await getUserProfile()
  
  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>
              Please log in to access your settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }
  
  const supabase = createClient()
  
  // Get company data if user has a company
  let company = null
  if (profile.company_id) {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single()
    
    company = data
  }
  
  return (
    <SettingsTabs 
      initialProfile={profile}
      initialCompany={company}
      userRole={profile.role}
    />
  )
}