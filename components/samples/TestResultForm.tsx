"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { SoilCategory, SampleType } from '@/lib/generated/prisma-client'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TestParameter {
  id: string
  name: string
  unit: string | null
  comparisonRules: {
    soilCategory: SoilCategory | null
    min: number | null
    max: number | null
    interpretation: string | null
    type: string
  }[]
}

interface TestResult {
  id: string
  testParameterId?: string
  value: number | null
  interpretation: string | null
  wetlandInterpretation: string | null
  uplandInterpretation: string | null
  testParamater: {
    id: string
    name: string
    unit: string | null
    comparisonRules: {
      soilCategory: SoilCategory | null
    }[]
  }
}

interface TestResultFormProps {
  sampleId: string
  parameters: TestParameter[]
  existingResults?: TestResult[]
  onSuccess: () => void
  onCancel: () => void
  sampleType: SampleType
}

export default function TestResultForm({ 
  sampleId, 
  parameters, 
  existingResults = [], 
  onSuccess, 
  onCancel,
  sampleType
}: TestResultFormProps) {
  const [results, setResults] = useState<Record<string, {
    value: string
  }>>(() => {
    // Initialize state with existing results
    const initialResults: Record<string, any> = {}
    existingResults.forEach(result => {
      initialResults[result.testParamater.id] = {
        value: result.value?.toString() || ''
      }
    })
    return initialResults
  })
  const [loading, setLoading] = useState(false)

  const handleValueChange = (parameterId: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [parameterId]: {
        ...prev[parameterId],
        value
      }
    }))
  }

  const validateResults = () => {
    for (const parameter of parameters) {
      const result = results[parameter.id]
      if (!result) {
        throw new Error(`Please enter values for ${parameter.name}`)
      }

      if (!result.value && result.value !== '0') {
        throw new Error(`Please enter a value for ${parameter.name}`)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      validateResults()

      const testResults = Object.entries(results).map(([testParameterId, values]) => ({
        testParameterId,
        value: values.value
      }))

      const response = await fetch(`/api/samples/${sampleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testResults }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update test results')
      }

      toast.success('Test results updated successfully')
      onSuccess()
    } catch (error) {
      console.error('Error updating test results:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update test results')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Test Results</h2>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {parameters.map((parameter) => {
          const result = results[parameter.id]
          const value = result?.value || ''

          return (
            <div key={parameter.id} className="space-y-2">
              <div>
                <h3 className="text-lg font-medium">
                  {parameter.name}
                  {parameter.unit && (
                    <span className="text-sm text-gray-500 ml-2">({parameter.unit})</span>
                  )}
                </h3>
              </div>

              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  step="any"
                  value={value}
                  onChange={(e) => handleValueChange(parameter.id, e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Results'}
        </Button>
      </div>
    </form>
  )
} 