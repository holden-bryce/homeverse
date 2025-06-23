'use client'

import { useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createInvestment } from '../../actions'
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Users,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface Project {
  id: string
  name: string
  companies?: { name: string }
  address: string
  city: string
  state: string
  total_units: number
  affordable_units: number
  ami_levels?: string[]
  status: string
}

// Removed server-side function

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit"
      disabled={pending}
      className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        'Create Investment'
      )}
    </Button>
  )
}

export default function NewInvestmentPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('projects')
          .select('*, companies(name)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        
        setProjects(data || [])
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/lenders/investments" className="group">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full hover:bg-sage-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Investments
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Investment</h1>
            <p className="text-gray-600 mt-1">
              Invest in affordable housing projects
            </p>
          </div>
        </div>

        {/* Form */}
        <form action={createInvestment} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-sage-600" />
                Investment Details
              </CardTitle>
              <CardDescription>
                Enter the details for your investment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Project Selection */}
              <div>
                <Label htmlFor="project_id">Select Project*</Label>
                <select
                  id="project_id"
                  name="project_id"
                  required
                  className="w-full mt-1 rounded-lg border-sage-200 focus:border-sage-500 focus:ring-sage-500"
                >
                  <option value="">Choose a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.city}, {project.state} ({project.affordable_units} affordable units)
                    </option>
                  ))}
                </select>
              </div>

              {/* Investment Amount */}
              <div>
                <Label htmlFor="amount">Investment Amount ($)*</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  className="rounded-lg border-sage-200"
                  placeholder="e.g., 500000"
                />
              </div>

              {/* Investment Type */}
              <div>
                <Label htmlFor="investment_type">Investment Type*</Label>
                <select
                  id="investment_type"
                  name="investment_type"
                  required
                  className="w-full mt-1 rounded-lg border-sage-200 focus:border-sage-500 focus:ring-sage-500"
                >
                  <option value="">Choose type...</option>
                  <option value="equity">Equity</option>
                  <option value="debt">Debt</option>
                  <option value="grant">Grant</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Expected Return */}
                <div>
                  <Label htmlFor="expected_return">Expected Return (%)</Label>
                  <Input
                    id="expected_return"
                    name="expected_return"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="rounded-lg border-sage-200"
                    placeholder="e.g., 8.5"
                  />
                </div>

                {/* Term */}
                <div>
                  <Label htmlFor="term_months">Term (months)</Label>
                  <Input
                    id="term_months"
                    name="term_months"
                    type="number"
                    min="1"
                    className="rounded-lg border-sage-200"
                    placeholder="e.g., 60"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Investment Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  className="w-full mt-1 rounded-lg border-sage-200 focus:border-sage-500 focus:ring-sage-500"
                  placeholder="Any additional notes or requirements..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/lenders/investments">
              <Button variant="outline" className="rounded-full">
                Cancel
              </Button>
            </Link>
            <SubmitButton />
          </div>
        </form>

        {/* Available Projects Info */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-sage-600" />
              Available Projects
            </CardTitle>
            <CardDescription>
              Projects currently seeking investment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.id} className="p-4 rounded-lg border border-sage-200 hover:border-sage-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <MapPin className="inline-block h-3 w-3 mr-1" />
                        {project.address}, {project.city}, {project.state}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span>
                          <Building2 className="inline-block h-3 w-3 mr-1 text-sage-600" />
                          {project.total_units} total units
                        </span>
                        <span>
                          <Users className="inline-block h-3 w-3 mr-1 text-sage-600" />
                          {project.affordable_units} affordable
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-sage-100 text-sage-800 rounded-full">
                      {project.status}
                    </Badge>
                  </div>
                  {project.ami_levels && project.ami_levels.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {project.ami_levels.map((level) => (
                        <Badge key={level} variant="secondary" className="text-xs rounded-full">
                          {level} AMI
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}