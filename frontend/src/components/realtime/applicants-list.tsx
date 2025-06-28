'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ResponsiveTable, type Column } from '@/components/ui/responsive-table'
import { EmptyStates } from '@/components/ui/empty-state'
import type { Database } from '@/types/database'

type Applicant = Database['public']['Tables']['applicants']['Row']

interface RealtimeApplicantsListProps {
  initialApplicants: Applicant[]
  companyId: string
}

export function RealtimeApplicantsList({ initialApplicants, companyId }: RealtimeApplicantsListProps) {
  const [applicants, setApplicants] = useState(initialApplicants)
  const router = useRouter()
  
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
  
  const columns: Column<Applicant>[] = [
    {
      key: 'full_name',
      label: 'Name',
      render: (value) => value || 'No Name'
    },
    {
      key: 'email',
      label: 'Email',
      className: 'text-gray-600'
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => value || '-',
      mobileHidden: true
    },
    {
      key: 'income',
      label: 'Income',
      render: (value) => value ? `$${value.toLocaleString()}` : '-',
      className: 'font-medium'
    },
    {
      key: 'ami_percent',
      label: 'AMI %',
      render: (value) => value ? `${value}%` : '-',
      mobileHidden: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
          value === 'approved' 
            ? 'bg-green-100 text-green-800'
            : value === 'rejected'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, applicant) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/applicants/${applicant.id}`}>
            <Button variant="ghost" size="sm" title="View applicant">
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
          </Link>
          <Link href={`/dashboard/applicants/${applicant.id}/edit`}>
            <Button variant="ghost" size="sm" title="Edit applicant">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </Link>
        </div>
      )
    }
  ]
  
  return (
    <ResponsiveTable
      data={applicants}
      columns={columns}
      keyExtractor={(applicant) => applicant.id}
      onRowClick={(applicant) => router.push(`/dashboard/applicants/${applicant.id}`)}
      emptyState={<EmptyStates.Applicants />}
    />
  )
}