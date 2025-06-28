import React from 'react'
import Link from 'next/link'
import { Plus, Search, FileText, Users, Home, MapPin, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon = Search,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <Icon className="w-8 h-8 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mx-auto mb-6">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  )
}

// Specific empty states
export const EmptyStates = {
  Applicants: () => (
    <EmptyState
      icon={Users}
      title="No applicants yet"
      description="Start building your applicant database by adding your first applicant."
      action={
        <Link href="/dashboard/applicants/new">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Add First Applicant
          </Button>
        </Link>
      }
    />
  ),

  Projects: () => (
    <EmptyState
      icon={Home}
      title="No projects found"
      description="Create your first housing project to start matching with applicants."
      action={
        <Link href="/dashboard/projects/new">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Create Project
          </Button>
        </Link>
      }
    />
  ),

  SearchResults: ({ searchTerm }: { searchTerm: string }) => (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any results for "${searchTerm}". Try adjusting your search.`}
    />
  ),

  Applications: () => (
    <EmptyState
      icon={FileText}
      title="No applications yet"
      description="You haven't submitted any applications. Start by browsing available properties."
      action={
        <Link href="/dashboard/buyers">
          <Button>
            <Search className="w-5 h-5 mr-2" />
            Browse Properties
          </Button>
        </Link>
      }
    />
  ),

  Investments: () => (
    <EmptyState
      icon={CreditCard}
      title="No investments yet"
      description="Start building your portfolio by exploring investment opportunities."
      action={
        <Link href="/dashboard/lenders/opportunities">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            View Opportunities
          </Button>
        </Link>
      }
    />
  ),

  Map: () => (
    <EmptyState
      icon={MapPin}
      title="No locations to display"
      description="Add projects or search for properties to see them on the map."
    />
  ),

  Generic: ({ entity = "items" }: { entity?: string }) => (
    <EmptyState
      icon={FileText}
      title={`No ${entity} found`}
      description={`There are no ${entity} to display at this time.`}
    />
  )
}