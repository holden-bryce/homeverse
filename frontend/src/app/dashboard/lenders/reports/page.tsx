'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle, ModalTrigger } from '@/components/ui/modal'
import { 
  FileText, 
  Download, 
  Plus, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  BarChart3,
  Target,
  Loader2,
  Filter
} from 'lucide-react'
import { useReports, useCreateReport, useCRAMetrics } from '@/lib/api/hooks'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toast'

const reportTypes = [
  { value: 'cra_performance', label: 'CRA Performance Report', description: 'Quarterly Community Reinvestment Act compliance report' },
  { value: 'affordable_housing', label: 'Affordable Housing Summary', description: 'Annual affordable housing investment analysis' },
  { value: 'community_impact', label: 'Community Impact Analysis', description: 'Social and economic impact assessment' },
  { value: 'investment_analysis', label: 'Investment Performance Report', description: 'ROI and financial performance analysis' },
  { value: 'geographic_distribution', label: 'Geographic Distribution Report', description: 'Investment allocation by geographic region' }
]

const mockUpcomingReports = [
  {
    id: '1',
    title: 'Q4 2024 CRA Performance Report',
    type: 'cra_performance',
    due_date: '2024-01-15',
    status: 'in_progress',
    completeness: 85,
    priority: 'high'
  },
  {
    id: '2',
    title: 'Annual Affordable Housing Summary',
    type: 'affordable_housing',
    due_date: '2024-03-31',
    status: 'not_started',
    completeness: 0,
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Community Investment Analysis',
    type: 'community_impact',
    due_date: '2024-02-28',
    status: 'review',
    completeness: 100,
    priority: 'low'
  }
]

export default function LendersReportsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newReportData, setNewReportData] = useState({
    report_type: '',
    parameters: {}
  })

  const { data: reports = [], isLoading: reportsLoading } = useReports()
  const { data: craMetrics = [], isLoading: craLoading } = useCRAMetrics()
  const createReport = useCreateReport()

  const handleGenerateReport = async () => {
    if (!newReportData.report_type) return

    setIsGenerating(true)
    try {
      await createReport.mutateAsync(newReportData)
      setNewReportData({ report_type: '', parameters: {} })
      setIsModalOpen(false)
      toast({
        title: "Report generated successfully",
        description: "Your report has been generated and will appear in the reports list.",
      })
    } catch (error) {
      console.error('Failed to generate report:', error)
      // Fallback: Add a mock report to localStorage
      const mockReport = {
        id: `rpt_${Date.now()}`,
        report_type: newReportData.report_type,
        name: `${reportTypes.find(t => t.value === newReportData.report_type)?.label} - ${new Date().toLocaleDateString()}`,
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        file_url: '#',
        parameters: newReportData.parameters
      }
      
      const existingReports = JSON.parse(localStorage.getItem('generated_reports') || '[]')
      localStorage.setItem('generated_reports', JSON.stringify([mockReport, ...existingReports]))
      
      setNewReportData({ report_type: '', parameters: {} })
      setIsModalOpen(false)
      
      toast({
        title: "Report generated (Demo Mode)",
        description: "Your report has been generated in demo mode and added to the reports list.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      setNewReportData({ report_type: '', parameters: {} })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress': return 'bg-teal-100 text-teal-800 border-teal-200'
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress': return <Clock className="h-4 w-4 text-teal-500" />
      case 'review': return <Eye className="h-4 w-4 text-yellow-500" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRA Reports & Compliance</h1>
          <p className="text-gray-600 mt-1">
            Generate and manage Community Reinvestment Act compliance reports
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50">
            <Filter className="mr-2 h-4 w-4" />
            Filter Reports
          </Button>
          <Modal open={isModalOpen} onOpenChange={handleModalClose}>
            <ModalTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Generate New Report</ModalTitle>
                <ModalDescription>
                  Create a new compliance or performance report
                </ModalDescription>
              </ModalHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="report_type">Report Type</Label>
                  <Select
                    value={newReportData.report_type}
                    onValueChange={(value) => setNewReportData(prev => ({ ...prev, report_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newReportData.report_type && (
                    <p className="text-sm text-gray-600">
                      {reportTypes.find(t => t.value === newReportData.report_type)?.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      onChange={(e) => setNewReportData(prev => ({
                        ...prev,
                        parameters: { ...prev.parameters, start_date: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      onChange={(e) => setNewReportData(prev => ({
                        ...prev,
                        parameters: { ...prev.parameters, end_date: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    disabled={isGenerating}
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={!newReportData.report_type || isGenerating}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ModalContent>
          </Modal>
        </div>
      </div>

      {/* CRA Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {craLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          craMetrics.slice(0, 4).map((metric: any, index: number) => (
            <Card key={index} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.category}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{metric.current}%</p>
                    <p className={`text-sm mt-1 ${
                      metric.current >= metric.target ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Target: {metric.target}%
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    metric.current >= metric.target ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Target className={`h-6 w-6 ${
                      metric.current >= metric.target ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-teal-100 rounded-full p-1">
          <TabsTrigger value="overview" className="rounded-full">Recent Reports</TabsTrigger>
          <TabsTrigger value="scheduled" className="rounded-full">Scheduled</TabsTrigger>
          <TabsTrigger value="templates" className="rounded-full">Templates</TabsTrigger>
          <TabsTrigger value="archive" className="rounded-full">Archive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Latest generated reports and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.slice(0, 10).map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(report.status)}
                            <div>
                              <div className="font-medium">
                                {reportTypes.find(t => t.value === report.report_type)?.label || report.report_type}
                              </div>
                              <div className="text-sm text-gray-500">
                                Generated by user
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full">
                            {report.report_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(report.created_at)}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(report.status)} rounded-full border`}>
                            {report.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {report.file_url && (
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Upcoming Scheduled Reports</CardTitle>
              <CardDescription>
                Reports scheduled for automatic generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUpcomingReports.map((report) => (
                  <div key={report.id} className="border border-teal-100 rounded-xl p-4 hover:bg-teal-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold">{report.title}</h3>
                        <Badge className={`${getStatusColor(report.status)} rounded-full border`}>
                          {report.status.replace('_', ' ')}
                        </Badge>
                        <span className={`text-sm font-medium ${getPriorityColor(report.priority)}`}>
                          {report.priority} priority
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Due: {formatDate(report.due_date)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          Progress: {report.completeness}%
                        </span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${report.completeness}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Edit Schedule
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>
                Pre-configured report templates for quick generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTypes.map((template) => (
                  <Card key={template.value} className="border border-teal-200 hover:border-teal-300 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{template.label}</h3>
                          <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        onClick={() => {
                          setNewReportData({ report_type: template.value, parameters: {} })
                          setIsModalOpen(true)
                        }}
                      >
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Report Archive</CardTitle>
              <CardDescription>
                Historical reports and compliance documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Archived Reports</h3>
                <p className="text-gray-500 mb-4">
                  Completed reports will appear here for historical reference
                </p>
                <Button variant="outline">
                  Configure Archive Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}