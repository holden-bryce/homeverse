'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ActivityDetailModal } from '@/components/ui/activity-modal'
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Bell,
  User,
  Search,
  Filter,
  Calendar,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react'
import { useActivities } from '@/lib/api/hooks'
import { formatDistanceToNow } from '@/lib/utils'

const activityTypes = [
  { value: 'all', label: 'All Activities' },
  { value: 'investment', label: 'Investments' },
  { value: 'project', label: 'Projects' },
  { value: 'applicant', label: 'Applicants' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'auth', label: 'Authentication' },
  { value: 'notification', label: 'Notifications' }
]

export default function ActivitiesPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [page, setPage] = useState(0)
  const limit = 20

  const { data: activities = [], isLoading, refetch } = useActivities({ 
    type: selectedType === 'all' ? undefined : selectedType,
    limit,
    offset: page * limit
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'investment':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'application':
      case 'applicant':
        return <User className="h-5 w-5 text-purple-600" />
      case 'project':
        return <CheckCircle className="h-5 w-5 text-sage-600" />
      case 'compliance':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'auth':
        return <User className="h-5 w-5 text-gray-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-teal-100 text-teal-800'
    }
  }

  const filteredActivities = activities.filter(activity => 
    searchQuery === '' || 
    activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleActivityClick = (activity: any) => {
    setSelectedActivity(activity.id)
    setIsActivityModalOpen(true)
  }

  const exportActivities = () => {
    const data = {
      activities: filteredActivities,
      exportedAt: new Date().toISOString(),
      filters: {
        type: selectedType,
        search: searchQuery
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activities-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-gray-600 mt-1">
              Track all system activities and user actions
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button 
              variant="outline"
              onClick={exportActivities}
              className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full"
                />
              </div>
              
              <Select
                value={selectedType}
                onValueChange={setSelectedType}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="All Activities" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center justify-end space-x-2 text-sm text-gray-600">
                <Activity className="h-4 w-4" />
                <span>{filteredActivities.length} activities</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading activities...</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No activities found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="p-6 hover:bg-sage-50/30 transition-colors cursor-pointer"
                    onClick={() => handleActivityClick(activity)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 hover:text-sage-600">
                              {activity.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {activity.user_email}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDistanceToNow(new Date(activity.created_at))} ago
                              </span>
                              {activity.entity_type && (
                                <span className="capitalize">
                                  {activity.entity_type}
                                </span>
                              )}
                            </div>
                          </div>
                          {activity.status && (
                            <Badge className={`${getStatusColor(activity.status)} rounded-full border-0 ml-4`}>
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredActivities.length > 0 && (
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded-full"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page + 1}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={filteredActivities.length < limit}
              className="rounded-full"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        activityId={selectedActivity}
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false)
          setSelectedActivity(null)
        }}
      />
    </div>
  )
}