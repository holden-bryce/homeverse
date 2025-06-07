'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MoreHorizontal,
  Download,
  Filter,
  Search,
  Bell,
  Settings,
  Loader2
} from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: ReactNode
  subtitle?: string
  loading?: boolean
}

export function MetricCard({ title, value, change, trend, icon, subtitle, loading }: MetricCardProps) {
  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            {change && (
              <div className="flex items-center space-x-1">
                {trend === 'up' && <TrendingUp className="h-3 w-3 text-sage-600" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                <p className={`text-sm font-medium ${
                  trend === 'up' ? 'text-sage-600' : 
                  trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {change}
                </p>
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="h-14 w-14 bg-sage-100 rounded-xl flex items-center justify-center ml-4">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}

export function ChartCard({ title, description, children, actions, className = "" }: ChartCardProps) {
  return (
    <Card className={`border-0 shadow-lg bg-white/80 backdrop-blur-sm ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-sm text-gray-600 mt-1">
              {description}
            </CardDescription>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

interface QuickActionsProps {
  actions: Array<{
    label: string
    icon: ReactNode
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
    loading?: boolean
  }>
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'outline'}
          onClick={action.onClick}
          disabled={action.loading}
          className={`${
            action.variant === 'default' 
              ? 'bg-sage-600 hover:bg-sage-700 text-white' 
              : 'border-sage-200 text-sage-700 hover:bg-sage-50'
          } rounded-full px-4`}
        >
          {action.loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            action.icon
          )}
          {action.label}
        </Button>
      ))}
    </div>
  )
}

interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  label: string
  description?: string
}

export function StatusIndicator({ status, label, description }: StatusIndicatorProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        }
      case 'warning':
        return {
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        }
      case 'info':
        return {
          icon: <AlertCircle className="h-5 w-5 text-teal-600" />,
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-200',
          textColor: 'text-teal-800'
        }
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-600" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <div className={`p-4 rounded-xl border ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start space-x-3">
        {config.icon}
        <div>
          <h4 className={`font-medium ${config.textColor}`}>{label}</h4>
          {description && (
            <p className={`text-sm mt-1 ${config.textColor} opacity-80`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  color?: 'sage' | 'cream' | 'blue' | 'green' | 'red'
  showPercentage?: boolean
}

export function ProgressBar({ value, max, label, color = 'sage', showPercentage = true }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'sage':
        return 'bg-sage-500'
      case 'cream':
        return 'bg-cream-500'
      case 'teal':
        return 'bg-teal-500'
      case 'green':
        return 'bg-green-500'
      case 'red':
        return 'bg-red-500'
      default:
        return 'bg-sage-500'
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${getColorClasses(color)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface ActivityFeedProps {
  activities: Array<{
    id: string
    type: 'investment' | 'application' | 'project' | 'compliance' | 'notification'
    title: string
    description: string
    timestamp: string
    status?: 'success' | 'warning' | 'error' | 'info'
    entity_type?: string
    entity_id?: string
    metadata?: any
  }>
  maxItems?: number
  onActivityClick?: (activity: any) => void
}

export function ActivityFeed({ activities, maxItems = 10, onActivityClick }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'investment':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'application':
        return <AlertCircle className="h-4 w-4 text-teal-600" />
      case 'project':
        return <CheckCircle className="h-4 w-4 text-sage-600" />
      case 'compliance':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, maxItems).map((activity) => (
        <div 
          key={activity.id} 
          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-sage-50/50 transition-colors cursor-pointer"
          onClick={() => onActivityClick && onActivityClick(activity)}
        >
          <div className="flex-shrink-0 mt-1">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate hover:text-sage-600">
              {activity.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {activity.description}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
          {activity.status && (
            <Badge className={`${
              activity.status === 'success' ? 'bg-green-100 text-green-800' :
              activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              activity.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-teal-100 text-teal-800'
            } rounded-full border-0`}>
              {activity.status}
            </Badge>
          )}
        </div>
      ))}
    </div>
  )
}

interface DataTableProps {
  columns: Array<{
    key: string
    label: string
    width?: string
    render?: (value: any, row: any) => ReactNode
  }>
  data: Array<Record<string, any>>
  loading?: boolean
  emptyMessage?: string
}

export function DataTable({ columns, data, loading, emptyMessage = 'No data available' }: DataTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-sm font-medium text-gray-600"
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-sage-50/30 transition-colors">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-sm">
                  {column.render 
                    ? column.render(row[column.key], row)
                    : row[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Custom chart components for better integration
export function SimpleLineChart({ data, xKey, yKey, color = '#10b981' }: {
  data: any[]
  xKey: string
  yKey: string
  color?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={xKey} stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }} 
        />
        <Line 
          type="monotone" 
          dataKey={yKey} 
          stroke={color} 
          strokeWidth={2}
          dot={{ fill: color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: 'white' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function SimpleAreaChart({ data, xKey, yKey, color = '#10b981' }: {
  data: any[]
  xKey: string
  yKey: string
  color?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={xKey} stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }} 
        />
        <Area 
          type="monotone" 
          dataKey={yKey} 
          stroke={color} 
          fill={`${color}20`}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function SimpleBarChart({ data, xKey, yKey, color = '#10b981' }: {
  data: any[]
  xKey: string
  yKey: string
  color?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={xKey} stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }} 
        />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}