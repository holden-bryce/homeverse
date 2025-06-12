'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Applicant = Database['public']['Tables']['applicants']['Row']

interface RealtimeApplicantsListProps {
  initialApplicants: Applicant[]
  companyId: string
}

export function RealtimeApplicantsList({ initialApplicants, companyId }: RealtimeApplicantsListProps) {
  const [applicants, setApplicants] = useState(initialApplicants)
  
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Subscribe to changes
    const channel = supabase
      .channel('applicants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applicants',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setApplicants(prev => [payload.new as Applicant, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setApplicants(prev => 
              prev.map(app => 
                app.id === payload.new.id ? payload.new as Applicant : app
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setApplicants(prev => 
              prev.filter(app => app.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId])
  
  if (applicants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No applicants found</p>
        <Link href="/dashboard/applicants/new">
          <Button className="bg-teal-600 hover:bg-teal-700">
            Add Your First Applicant
          </Button>
        </Link>
      </div>
    )
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">Name</th>
            <th className="text-left py-3 px-4">Email</th>
            <th className="text-left py-3 px-4">Phone</th>
            <th className="text-left py-3 px-4">Income</th>
            <th className="text-left py-3 px-4">AMI %</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-left py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((applicant) => (
            <tr key={applicant.id} className="border-b hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                {applicant.first_name} {applicant.last_name}
              </td>
              <td className="py-3 px-4">{applicant.email}</td>
              <td className="py-3 px-4">{applicant.phone || '-'}</td>
              <td className="py-3 px-4">
                ${applicant.income.toLocaleString()}
              </td>
              <td className="py-3 px-4">{applicant.ami_percent}%</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  applicant.status === 'approved' 
                    ? 'bg-green-100 text-green-800'
                    : applicant.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {applicant.status}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex space-x-2">
                  <Link href={`/dashboard/applicants/${applicant.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/dashboard/applicants/${applicant.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}