import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/auth/server'
import { ResponsiveDashboardLayout } from '@/components/layout/responsive-dashboard-layout'

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
    <ResponsiveDashboardLayout user={profile}>
      {children}
    </ResponsiveDashboardLayout>
  )
}