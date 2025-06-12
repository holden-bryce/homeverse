import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/auth/server'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/auth/actions'
import { LogOut } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()
  
  if (!profile) {
    redirect('/auth/login')
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <Logo className="h-8 w-auto" />
        </div>
        <DashboardSidebar role={profile.role} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Welcome, {profile.full_name || profile.email}
              </h2>
              <p className="text-sm text-gray-600">
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} Portal
              </p>
            </div>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}