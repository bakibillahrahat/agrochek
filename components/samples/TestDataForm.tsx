"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SampleType, Sample, TestParameter, SoilCategory } from '@/lib/generated/prisma-client'
import TestResultForm from './TestResultForm'

interface ComparisonRule {
  soilCategory: SoilCategory | null
  min: number | null
  max: number | null
  interpretation: string | null
  type: string
}

interface TestDataFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sample: Sample & {
    orderItem: {
      orderTestParameters: {
        testParameter: TestParameter & {
          comparisonRules: ComparisonRule[]
        }
      }[]
    }
    testResults: {
      id: string
      value: number | null
      interpretation: string | null
      wetlandInterpretation: string | null
      uplandInterpretation: string | null
      testParamater: {
        id: string
        name: string
        unit: string | null
        comparisonRules: ComparisonRule[]
      }
    }[]
  }
  onSuccess?: () => void
}

export default function TestDataForm({ open, onOpenChange, sample, onSuccess }: TestDataFormProps) {
  // Get the test parameters for this order item
  const testParameters = sample.orderItem.orderTestParameters.map(otp => ({
    ...otp.testParameter,
    comparisonRules: otp.testParameter.comparisonRules
  }))

  // Map existing results to match TestResult type
  const existingResults = sample.testResults.map(result => ({
    ...result,
    testParamater: {
      ...result.testParamater,
      comparisonRules: result.testParamater.comparisonRules
    }
  }))

  if (testParameters.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>No Test Parameters</DialogTitle>
            <DialogDescription>
              This sample has no test parameters assigned. Please add test parameters to the order first.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Enter Test Results</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-sm">
              Sample ID: {sample.sampleIdNumber}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Type: {sample.sampleType}
            </Badge>
          </div>
        </DialogHeader>
        <TestResultForm
          sampleId={sample.id}
          parameters={testParameters}
          existingResults={existingResults}
          onSuccess={() => {
            onSuccess?.()
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
          sampleType={sample.sampleType}
        />
      </DialogContent>
    </Dialog>
  )
} 