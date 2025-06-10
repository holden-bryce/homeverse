'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  MapPin, 
  Calendar,
  Users,
  TrendingUp,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toast'
import { useApplicants, useDeleteApplicant } from '@/lib/supabase/hooks'
import { useConfirmationModal } from '@/components/ui/confirmation-modal'

const stats = [
  {
    title: 'Total Applicants',
    value: '2,847',
    change: '+12.5%',
    icon: Users,
  },
  {
    title: 'Active Matches',
    value: '1,247',
    change: '+8.2%',
    icon: TrendingUp,
  },
  {
    title: 'Waitlisted',
    value: '456',
    change: '-2.1%',
    icon: Calendar,
  },
]

export default function ApplicantsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [amiBandFilter, setAmiBandFilter] = useState('all')
  
  const { data: applicants = [], isLoading, refetch: fetchApplicants } = useApplicants()
  const deleteApplicant = useDeleteApplicant()
  const { confirm, ConfirmationModal } = useConfirmationModal()

  const handleDeleteApplicant = (applicantId: string, applicantName: string) => {
    confirm({
      title: 'Delete Applicant',
      description: `Are you sure you want to delete ${applicantName}? This action cannot be undone and will permanently remove all their data.`,
      variant: 'danger',
      confirmText: 'Delete Applicant',
      onConfirm: async () => {
        try {
          await deleteApplicant.mutateAsync(applicantId)
          toast({
            title: 'Applicant Deleted',
            description: `${applicantName} has been successfully deleted.`,
            variant: 'success'
          })
          // Refresh the data
          fetchApplicants()
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to delete applicant. Please try again.',
            variant: 'destructive'
          })
          throw error // Re-throw to keep modal open on error
        }
      }
    })
  }

  // Data fetching is now handled by useApplicants hook

  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = (
      applicant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const matchesStatus = statusFilter === 'all' || applicant.status === statusFilter
    const matchesAmiBand = amiBandFilter === 'all' || applicant.ami_band === amiBandFilter || applicant.ami_percent?.toString() === amiBandFilter
    
    return matchesSearch && matchesStatus && matchesAmiBand
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-sage-100 text-sage-800 border-sage-200'
      case 'matched':
        return 'bg-teal-100 text-teal-800 border-teal-200'
      case 'waitlisted':
        return 'bg-cream-100 text-cream-800 border-cream-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applicants</h1>
            <p className="text-gray-600 mt-1">
              Manage housing applicants and their matching preferences
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button 
              className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-6" 
              onClick={() => router.push('/dashboard/applicants/new')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Applicant
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className="text-sm text-sage-600 mt-1">{stat.change} from last month</p>
                    </div>
                    <div className="h-12 w-12 bg-sage-100 rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-sage-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Applicant Directory</CardTitle>
            <CardDescription>
              Search and filter through your applicant database
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by email or applicant details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-sage-200 focus:border-sage-400 rounded-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={amiBandFilter} onValueChange={setAmiBandFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by AMI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All AMI Bands</SelectItem>
                <SelectItem value="30%">30% AMI</SelectItem>
                <SelectItem value="50%">50% AMI</SelectItem>
                <SelectItem value="80%">80% AMI</SelectItem>
                <SelectItem value="120%">120% AMI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Applicants Table */}
          <div className="rounded-2xl border border-sage-100 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-sage-50/50">
                  <TableHead className="font-semibold text-gray-700 min-w-[200px]">Applicant</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden sm:table-cell">Household Size</TableHead>
                  <TableHead className="font-semibold text-gray-700 min-w-[100px]">AMI Band</TableHead>
                  <TableHead className="font-semibold text-gray-700 min-w-[100px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden md:table-cell">Location</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden lg:table-cell">Matches</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden lg:table-cell">Created</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700 min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredApplicants.map((applicant) => (
                  <TableRow key={applicant.id} className="hover:bg-sage-50/50 transition-colors">
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {applicant.first_name || applicant.email?.split('@')[0] || 'Unknown'} {applicant.last_name || ''}
                        </div>
                        <div className="text-sm text-gray-500">{applicant.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        {applicant.household_size || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-cream-100 text-cream-800 border border-cream-200 rounded-full">
                        {applicant.ami_percent ? `${applicant.ami_percent}%` : '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(applicant.status || 'active')} rounded-full border`}>
                        {applicant.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {applicant.location_preference || 'Any location'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-center">
                        <span className="font-medium">{applicant.matches_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm text-gray-500">
                        {applicant.created_at ? new Date(applicant.created_at).toLocaleDateString() : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-full h-8 w-8 p-0 hover:bg-sage-100" 
                          onClick={() => router.push(`/dashboard/applicants/${applicant.id}`)}
                          aria-label={`View details for ${applicant.first_name || 'applicant'} ${applicant.last_name || ''}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-full h-8 w-8 p-0 hover:bg-sage-100" 
                          onClick={() => router.push(`/dashboard/applicants/${applicant.id}/edit`)}
                          aria-label={`Edit ${applicant.first_name || 'applicant'} ${applicant.last_name || ''}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-full h-8 w-8 p-0 hover:bg-red-100"
                          onClick={() => handleDeleteApplicant(
                            applicant.id, 
                            `${applicant.first_name || applicant.email?.split('@')[0] || 'Unknown'} ${applicant.last_name || ''}`.trim()
                          )}
                          disabled={deleteApplicant.isPending}
                          aria-label={`Delete ${applicant.first_name || 'applicant'} ${applicant.last_name || ''}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredApplicants.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 bg-sage-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-12 w-12 text-sage-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applicants found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || amiBandFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first applicant.'}
              </p>
              {(!searchTerm && statusFilter === 'all' && amiBandFilter === 'all') && (
                <Button 
                  className="mt-4 bg-sage-600 hover:bg-sage-700 text-white rounded-full" 
                  onClick={() => router.push('/dashboard/applicants/new')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Applicant
                </Button>
              )}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
      {ConfirmationModal}
    </div>
  )
}