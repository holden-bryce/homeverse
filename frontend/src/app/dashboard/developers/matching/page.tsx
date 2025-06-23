import { Suspense } from 'react'
import { getUserProfile } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import MatchingPageClient from './matching-client'

// Mock insights data (this could come from backend later)
const aiInsights = [
  {
    type: 'trend',
    icon: 'TrendingUp',
    title: 'Matching Success Rate Improving',
    description: 'AI matching accuracy increased 15% this month with 94% applicant satisfaction',
    actionable: true
  },
  {
    type: 'opportunity',
    icon: 'Target',
    title: 'High-Demand Demographics Identified',
    description: '60-80% AMI families show strongest interest in your projects',
    actionable: true
  },
  {
    type: 'alert',
    icon: 'AlertCircle',
    title: 'Seasonal Pattern Detected',
    description: 'Application volume typically increases 25% in spring months',
    actionable: false
  }
]

async function getProjects() {
  const supabase = createClient()
  const profile = await getUserProfile()
  
  if (!profile) return []
  
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('company_id', profile.company_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    
  return data || []
}

async function MatchingPageServer() {
  const projects = await getProjects()

  return (
    <MatchingPageClient 
      initialMatches={[]} // Let client fetch this data
      projects={projects}
      aiInsights={aiInsights}
    />
  )
}

export default function DeveloperMatchingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <Suspense fallback={
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI-Powered Matching</h1>
              <p className="text-gray-600 mt-1">
                Find the best applicant matches for your affordable housing projects
              </p>
            </div>
            <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Loading skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-0 shadow-lg bg-white rounded-lg p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }>
        <MatchingPageServer />
      </Suspense>
    </div>
  )
}