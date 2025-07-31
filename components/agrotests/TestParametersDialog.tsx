'use client'

import React from 'react'
import { AgroTest } from '@/app/types/agrotest'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SampleType } from '@/lib/generated/prisma-client'

interface TestParametersDialogProps {
  test: AgroTest | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const TestParametersDialog: React.FC<TestParametersDialogProps> = ({
  test,
  isOpen,
  onOpenChange,
}) => {
  const isSoilTest = test?.sampleType === SampleType.SOIL;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Parameters - {test?.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parameter Name</TableHead>
                <TableHead>Unit</TableHead>
                {isSoilTest && <TableHead>Soil Category</TableHead>}
                <TableHead>কৃষক মূল্য</TableHead>
                <TableHead>সরকারি মূল্য</TableHead>
                <TableHead>বেসরকারি মূল্য</TableHead>
                <TableHead>Comparison Rules</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {test?.testParameter.map((param) => (
                <TableRow key={param.id}>
                  <TableCell className="font-medium">{param.name}</TableCell>
                  <TableCell>{param.unit}</TableCell>
                  {isSoilTest && <TableCell>{param.soilCategory}</TableCell>}
                  <TableCell>
                    {param.pricing.find(p => p.clientType === 'FARMER')?.price || '-'} ৳
                  </TableCell>
                  <TableCell>
                    {param.pricing.find(p => p.clientType === 'GOVT_ORG')?.price || '-'} ৳
                  </TableCell>
                  <TableCell>
                    {param.pricing.find(p => p.clientType === 'PRIVATE')?.price || '-'} ৳
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {param.comparisonRules.map((rule) => (
                        <div key={rule.id} className="text-sm">
                          <div className="font-semibold">
                            {rule.min === 0 ? (
                              `${rule.max} ${param.unit} -এর নিচে`
                            ) : rule.max === 0 ? (
                              `${rule.min} ${param.unit} - এর উপরে`
                            ) : (
                              `${rule.min} - ${rule.max} ${param.unit}`
                            )}
                            {isSoilTest && rule.soilCategory && (
                              <span className="ml-2 text-muted-foreground">
                                ({rule.soilCategory.charAt(0) + rule.soilCategory.slice(1).toLowerCase()})
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            {rule.interpretation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TestParametersDialog 