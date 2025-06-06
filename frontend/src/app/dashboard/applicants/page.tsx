'use client'

import { useState } from 'react'
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

// Mock data - in real app this would come from API
const applicants = [
  {
    id: '1',
    email: 'john.doe@email.com',
    household_size: 2,
    ami_band: '50%',
    status: 'active',
    geo_point: [37.7749, -122.4194] as [number, number],
    preferences: { 
      unit_type: '1BR',
      max_commute: 30,
      amenities: ['parking', 'laundry']
    },
    created_at: '2024-01-15T10:00:00Z',
    matches_count: 5,
  },
  {
    id: '2',
    email: 'jane.smith@email.com',
    household_size: 4,
    ami_band: '80%',
    status: 'matched',
    geo_point: [37.7849, -122.4094] as [number, number],
    preferences: { 
      unit_type: '2BR',
      max_commute: 45,
      amenities: ['playground', 'parking']
    },
    created_at: '2024-01-20T14:30:00Z',
    matches_count: 3,
  },
  {
    id: '3',
    email: 'bob.wilson@email.com',
    household_size: 1,
    ami_band: '30%',
    status: 'waitlisted',
    geo_point: [37.7649, -122.4294] as [number, number],
    preferences: { 
      unit_type: 'Studio',
      max_commute: 60,
      amenities: ['transit']
    },
    created_at: '2024-01-25T09:15:00Z',
    matches_count: 1,
  },
]

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
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [amiBandFilter, setAmiBandFilter] = useState('all')

  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = applicant.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || applicant.status === statusFilter
    const matchesAmiBand = amiBandFilter === 'all' || applicant.ami_band === amiBandFilter
    
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
          <div className="flex space-x-3">
            <Button variant="outline" className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-6" onClick={() => alert('Add applicant page coming soon!')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Applicant
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <div className="rounded-2xl border border-sage-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-sage-50/50">
                  <TableHead className="font-semibold text-gray-700">Applicant</TableHead>
                  <TableHead className="font-semibold text-gray-700">Household Size</TableHead>
                  <TableHead className="font-semibold text-gray-700">AMI Band</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">Location</TableHead>
                  <TableHead className="font-semibold text-gray-700">Matches</TableHead>
                  <TableHead className="font-semibold text-gray-700">Created</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplicants.map((applicant) => (
                  <TableRow key={applicant.id} className="hover:bg-sage-50/50 transition-colors">
                    <TableCell>
                      <div>
                        <div className="font-medium">{applicant.email}</div>
                        <div className="text-sm text-gray-500">
                          Prefers {applicant.preferences.unit_type}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        {applicant.household_size}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-cream-100 text-cream-800 border border-cream-200 rounded-full">{applicant.ami_band}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(applicant.status)} rounded-full border`}>
                        {applicant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {applicant.geo_point[0].toFixed(2)}, {applicant.geo_point[1].toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="font-medium">{applicant.matches_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(applicant.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0 hover:bg-sage-100" onClick={() => alert(`View applicant ${applicant.email} coming soon!`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0 hover:bg-sage-100" onClick={() => alert(`Edit applicant ${applicant.email} coming soon!`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0 hover:bg-red-100">
                          <Trash2 className="h-4 w-4" />
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
                <Button className="mt-4 bg-sage-600 hover:bg-sage-700 text-white rounded-full" onClick={() => alert('Add applicant page coming soon!')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Applicant
                </Button>
              )}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}