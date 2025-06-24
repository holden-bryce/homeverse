'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator, Users, DollarSign, Home, Info, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

// AMI percentages and limits for San Francisco Bay Area (2024)
const AMI_LIMITS = {
  '1': { '30%': 29650, '50%': 49400, '60%': 59280, '80%': 78850, '100%': 98600, '120%': 118320 },
  '2': { '30%': 33900, '50%': 56450, '60%': 67740, '80%': 90100, '100%': 112700, '120%': 135240 },
  '3': { '30%': 38150, '50%': 63500, '60%': 76200, '80%': 101350, '100%': 126750, '120%': 152100 },
  '4': { '30%': 42350, '50%': 70550, '60%': 84660, '80%': 112600, '100%': 140750, '120%': 168900 },
  '5': { '30%': 45750, '50%': 76200, '60%': 91440, '80%': 121600, '100%': 152000, '120%': 182400 },
  '6': { '30%': 49150, '50%': 81850, '60%': 98220, '80%': 130600, '100%': 163250, '120%': 195900 },
  '7': { '30%': 52550, '50%': 87500, '60%': 105000, '80%': 139600, '100%': 174500, '120%': 209400 },
  '8': { '30%': 55900, '50%': 93150, '60%': 111780, '80%': 148600, '100%': 185750, '120%': 222900 }
}

const MAX_RENT_PERCENTAGE = 0.3 // 30% of income for rent

export default function CalculatorPage() {
  const [income, setIncome] = useState('')
  const [householdSize, setHouseholdSize] = useState('1')
  const [results, setResults] = useState<any>(null)

  const calculateAMI = () => {
    const annualIncome = parseFloat(income) || 0
    const size = householdSize as keyof typeof AMI_LIMITS
    const limits = AMI_LIMITS[size] || AMI_LIMITS['1']
    
    // Calculate which AMI brackets the household qualifies for
    const qualifiedBrackets = []
    let amiPercentage = 0
    
    for (const [bracket, limit] of Object.entries(limits)) {
      if (annualIncome <= limit) {
        qualifiedBrackets.push(bracket)
      }
      if (annualIncome > 0) {
        amiPercentage = Math.round((annualIncome / limits['100%']) * 100)
      }
    }
    
    // Calculate maximum affordable rent (30% of monthly income)
    const monthlyIncome = annualIncome / 12
    const maxRent = Math.round(monthlyIncome * MAX_RENT_PERCENTAGE)
    
    // Determine eligibility status
    let eligibilityStatus = 'not-eligible'
    let eligibilityMessage = ''
    
    if (annualIncome <= limits['30%']) {
      eligibilityStatus = 'extremely-low'
      eligibilityMessage = 'Qualifies for Extremely Low Income housing'
    } else if (annualIncome <= limits['50%']) {
      eligibilityStatus = 'very-low'
      eligibilityMessage = 'Qualifies for Very Low Income housing'
    } else if (annualIncome <= limits['80%']) {
      eligibilityStatus = 'low'
      eligibilityMessage = 'Qualifies for Low Income housing'
    } else if (annualIncome <= limits['120%']) {
      eligibilityStatus = 'moderate'
      eligibilityMessage = 'Qualifies for Moderate Income housing'
    } else {
      eligibilityStatus = 'above'
      eligibilityMessage = 'Income exceeds affordable housing limits'
    }
    
    setResults({
      annualIncome,
      monthlyIncome: Math.round(monthlyIncome),
      amiPercentage,
      qualifiedBrackets,
      maxRent,
      eligibilityStatus,
      eligibilityMessage,
      limits
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'extremely-low':
      case 'very-low':
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'moderate':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <XCircle className="h-5 w-5 text-red-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'extremely-low':
      case 'very-low':
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AMI Calculator</h1>
        <p className="text-gray-600">Calculate your Area Median Income (AMI) percentage and housing eligibility</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-teal-600" />
              Income Information
            </CardTitle>
            <CardDescription>
              Enter your household information to calculate AMI eligibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="income">Annual Household Income</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="income"
                  type="number"
                  placeholder="75000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total pre-tax income for all household members
              </p>
            </div>

            <div>
              <Label htmlFor="household">Household Size</Label>
              <Select value={householdSize} onValueChange={setHouseholdSize}>
                <SelectTrigger id="household">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} {size === 1 ? 'Person' : 'People'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Include all adults and children in your household
              </p>
            </div>

            <Button 
              onClick={calculateAMI} 
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={!income || parseFloat(income) <= 0}
            >
              Calculate AMI
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-teal-600" />
                Your Results
              </CardTitle>
              <CardDescription>
                Based on San Francisco Bay Area AMI limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Eligibility Status */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                {getStatusIcon(results.eligibilityStatus)}
                <div>
                  <p className="font-semibold text-gray-900">{results.eligibilityMessage}</p>
                  <p className="text-sm text-gray-600">
                    Your household is at {results.amiPercentage}% of Area Median Income
                  </p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Monthly Income</p>
                  <p className="text-lg font-semibold">${results.monthlyIncome.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Max Affordable Rent</p>
                  <p className="text-lg font-semibold text-teal-600">${results.maxRent.toLocaleString()}</p>
                </div>
              </div>

              {/* Qualified Brackets */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Qualified Income Brackets</p>
                <div className="flex flex-wrap gap-2">
                  {results.qualifiedBrackets.length > 0 ? (
                    results.qualifiedBrackets.map((bracket: string) => (
                      <Badge key={bracket} className={getStatusColor(results.eligibilityStatus)}>
                        {bracket} AMI
                      </Badge>
                    ))
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                      Above 120% AMI
                    </Badge>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Housing Cost Guidance</p>
                    <p>
                      Experts recommend spending no more than 30% of your monthly income on rent. 
                      Based on your income, you should look for housing under ${results.maxRent}/month.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AMI Reference Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>2024 AMI Limits Reference</CardTitle>
          <CardDescription>
            San Francisco Bay Area income limits by household size
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Household Size</th>
                  <th className="text-right py-2">30% AMI</th>
                  <th className="text-right py-2">50% AMI</th>
                  <th className="text-right py-2">80% AMI</th>
                  <th className="text-right py-2">100% AMI</th>
                  <th className="text-right py-2">120% AMI</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(AMI_LIMITS).slice(0, 4).map(([size, limits]) => (
                  <tr key={size} className="border-b">
                    <td className="py-2">{size} {parseInt(size) === 1 ? 'Person' : 'People'}</td>
                    <td className="text-right py-2">${limits['30%'].toLocaleString()}</td>
                    <td className="text-right py-2">${limits['50%'].toLocaleString()}</td>
                    <td className="text-right py-2">${limits['80%'].toLocaleString()}</td>
                    <td className="text-right py-2">${limits['100%'].toLocaleString()}</td>
                    <td className="text-right py-2">${limits['120%'].toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}