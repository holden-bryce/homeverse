'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useCreateInvestment, useProjects } from '@/lib/api/hooks'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Building2, MapPin, DollarSign, TrendingUp, Calendar, Users } from 'lucide-react'
import type { InvestmentForm } from '@/types'

export default function NewInvestmentPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<InvestmentForm>({
    project_id: '',
    investment_amount: 0,
    expected_roi: 0,
    units_funded: 0,
    completion_date: '',
    risk_level: 'medium',
    ami_target: '30-80%'
  })
  const [selectedProject, setSelectedProject] = useState<any>(null)

  const { data: projects = [], isLoading: projectsLoading } = useProjects({ status: 'active' })
  const createInvestment = useCreateInvestment()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createInvestment.mutateAsync(formData)
      router.push('/dashboard/lenders/investments')
    } catch (error) {
      console.error('Failed to create investment:', error)
    }
  }

  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    setSelectedProject(project)
    setFormData(prev => ({
      ...prev,
      project_id: projectId,
      ami_target: project ? `${project.ami_min}-${project.ami_max}%` : prev.ami_target
    }))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Investment</h1>
          <p className="text-gray-600 mt-1">
            Create a new investment in an affordable housing project
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Investment Details</CardTitle>
              <CardDescription>
                Enter the details for your new investment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Selection */}
                <div className="space-y-2">
                  <Label htmlFor="project">Select Project</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={handleProjectSelect}
                    required
                  >
                    <option value="">Choose a project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} - {project.developer_name}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Investment Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="investment_amount">Investment Amount ($)</Label>
                    <Input
                      id="investment_amount"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.investment_amount || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        investment_amount: Number(e.target.value)
                      }))}
                      placeholder="e.g., 2500000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expected_roi">Expected ROI (%)</Label>
                    <Input
                      id="expected_roi"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.expected_roi || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        expected_roi: Number(e.target.value)
                      }))}
                      placeholder="e.g., 8.5"
                      required
                    />
                  </div>
                </div>

                {/* Units and Completion */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="units_funded">Units Funded</Label>
                    <Input
                      id="units_funded"
                      type="number"
                      min="1"
                      value={formData.units_funded || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        units_funded: Number(e.target.value)
                      }))}
                      placeholder="e.g., 48"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="completion_date">Expected Completion</Label>
                    <Input
                      id="completion_date"
                      type="date"
                      value={formData.completion_date}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        completion_date: e.target.value
                      }))}
                      required
                    />
                  </div>
                </div>

                {/* Risk Level and AMI Target */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="risk_level">Risk Level</Label>
                    <Select
                      value={formData.risk_level}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        risk_level: value as 'low' | 'medium' | 'high'
                      }))}
                    >
                      <option value="low">Low Risk</option>
                      <option value="medium">Medium Risk</option>
                      <option value="high">High Risk</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ami_target">AMI Target Range</Label>
                    <Input
                      id="ami_target"
                      value={formData.ami_target}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ami_target: e.target.value
                      }))}
                      placeholder="e.g., 30-80%"
                      required
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-sage-600 hover:bg-sage-700"
                    disabled={createInvestment.isPending}
                  >
                    {createInvestment.isPending ? 'Creating...' : 'Create Investment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Project Preview */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Project Preview</CardTitle>
              <CardDescription>
                Details of the selected project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProject ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedProject.name}</h3>
                    <p className="text-sm text-gray-600">{selectedProject.developer_name}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>Location: {selectedProject.location[0]}, {selectedProject.location[1]}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>{selectedProject.unit_count} total units</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <span>AMI Range: {selectedProject.ami_min}% - {selectedProject.ami_max}%</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Est. Delivery: {selectedProject.est_delivery}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <Badge className={`${
                      selectedProject.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedProject.status === 'planning' ? 'bg-teal-100 text-teal-800' :
                      'bg-gray-100 text-gray-800'
                    } rounded-full`}>
                      {selectedProject.status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a project to see details</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investment Summary */}
          {formData.investment_amount > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Investment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Investment Amount</span>
                    <span className="font-medium">{formatCurrency(formData.investment_amount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Expected ROI</span>
                    <span className="font-medium">{formData.expected_roi}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Units Funded</span>
                    <span className="font-medium">{formData.units_funded}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Risk Level</span>
                    <Badge className={`${
                      formData.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                      formData.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    } rounded-full`}>
                      {formData.risk_level}
                    </Badge>
                  </div>

                  {formData.investment_amount > 0 && formData.expected_roi > 0 && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">Projected Annual Return</span>
                        <span className="font-bold text-sage-600">
                          {formatCurrency(formData.investment_amount * (formData.expected_roi / 100))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}