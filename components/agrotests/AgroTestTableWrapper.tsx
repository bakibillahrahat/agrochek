'use client'

import React from 'react'
import AgroTestTable from './AgroTestTable'
import TestParametersDialog from './TestParametersDialog'
import AgroTestForm from './AgroTestForm'
import { AgroTest } from '@/app/types/agrotest'
import { Button } from '@/components/ui/button'
import { Eye, MoreHorizontal, Pencil, Trash2, Copy, Plus, Filter } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

const SAMPLE_TYPES = [
  { label: 'All', value: '' },
  { label: 'Soil', value: 'SOIL' },
  { label: 'Water', value: 'WATER' },
  { label: 'Fertilizer', value: 'FERTILIZER' },
]

interface AgroTestTableWrapperProps {
  data: AgroTest[]
}

const AgroTestTableWrapper: React.FC<AgroTestTableWrapperProps> = ({ data: initialData }) => {
  const [sampleTypeFilter, setSampleTypeFilter] = React.useState<string>('')
  const [selectedTest, setSelectedTest] = React.useState<AgroTest | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [data, setData] = React.useState<AgroTest[]>(initialData)
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())
  const [testToDelete, setTestToDelete] = React.useState<AgroTest | null>(null)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false)

  // Function to refresh data
  const refreshData = async () => {
    try {
      const response = await fetch('/api/agrotest')
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      const newData = await response.json()
      setData(newData)
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast.error('Failed to refresh data')
    }
  }

  const handleView = (item: AgroTest) => {
    setSelectedTest(item)
    setIsViewDialogOpen(true)
  }

  const handleUpdate = (item: AgroTest) => {
    setSelectedTest(item)
    setIsUpdateDialogOpen(true)
  }

  const handleDelete = async (item: AgroTest) => {
    setTestToDelete(item)
  }

  const confirmDelete = async () => {
    if (!testToDelete) return

    try {
      const response = await fetch(`/api/agrotest?id=${testToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete test')
      }

      setData(prevData => prevData.filter(test => test.id !== testToDelete.id))
      toast.success('Test deleted successfully')
    } catch (error) {
      console.error('Error deleting test:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete test')
    } finally {
      setTestToDelete(null)
    }
  }

  const handleBulkDelete = () => {
    setIsBulkDeleteOpen(true)
  }

  const confirmBulkDelete = async () => {
    try {
      setIsSubmitting(true)
      const deletePromises = Array.from(selectedRows).map(id =>
        fetch(`/api/agrotest?id=${id}`, { method: 'DELETE' })
      )

      const results = await Promise.allSettled(deletePromises)
      const failedDeletes = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected'
      )

      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} tests`)
      }

      setData(prevData => prevData.filter(test => !selectedRows.has(test.id)))
      setSelectedRows(new Set())
      toast.success(`${selectedRows.size} tests deleted successfully`)
    } catch (error) {
      console.error('Error deleting tests:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete tests')
    } finally {
      setIsSubmitting(false)
      setIsBulkDeleteOpen(false)
    }
  }

  const handleCopy = async (item: AgroTest) => {
    try {
      const response = await fetch('/api/agrotest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${item.name} (Copy)`,
          sampleType: item.sampleType,
          testParameters: item.testParameter.map(param => ({
            name: param.name,
            soilCategory: param.soilCategory,
            unit: param.unit,
            comparisonRules: param.comparisonRules,
            pricing: param.pricing
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to copy agro test');
      }

      await refreshData();
      toast.success('Agro test copied successfully');
    } catch (error) {
      console.error('Error copying agro test:', error);
      toast.error('Failed to copy agro test');
    }
  }

  const handleAdd = () => {
    setIsAddDialogOpen(true)
  }

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/agrotest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create test')
      }

      const newTest = await response.json()
      setData(prevData => [...prevData, newTest])
      setIsAddDialogOpen(false)
      toast.success('Test created successfully')
    } catch (error) {
      console.error('Error creating test:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create test')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/agrotest?id=${selectedTest?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedTest?.id,
          ...formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update test')
      }

      const updatedTest = await response.json()
      setData(prevData => prevData.map(test => 
        test.id === updatedTest.id ? updatedTest : test
      ))
      setIsUpdateDialogOpen(false)
      setSelectedTest(null)
      toast.success('Test updated successfully')
    } catch (error) {
      console.error('Error updating test:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update test')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFilter = () => {
    // TODO: Implement filter functionality
    console.log('Open filter')
  }


  // Filter data by sample type
  const filteredData = sampleTypeFilter
    ? data.filter((item) => item.sampleType === sampleTypeFilter)
    : data

  const columns = [
    { header: 'Name', accessorKey: 'name' as keyof AgroTest },
    { 
      header: 'Sample Type', 
      accessorKey: 'sampleType' as keyof AgroTest,
      cell: (item: AgroTest) => (
        <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded capitalize font-medium">
          {String(item.sampleType).toLowerCase()}
        </Badge>
      )
    },
    { 
      header: 'Parameters', 
      accessorKey: 'testParameter' as keyof AgroTest,
      cell: (item: AgroTest) => `${item.testParameter.length} parameters`
    },
    { 
      header: 'Created At', 
      accessorKey: 'createdAt' as keyof AgroTest,
      cell: (item: AgroTest) => new Date(item.createdAt).toLocaleDateString()
    },
    {
      header: 'Actions',
      accessorKey: 'id' as keyof AgroTest,
      cell: (item: AgroTest) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleView(item)}
            className="h-8 w-8"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCopy(item)}
            className="h-8 w-8"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleUpdate(item)}>
                <Pencil className="h-4 w-4 mr-2" />
                Update
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(item)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Agriculture Tests Information</h2>
        <p className="text-muted-foreground">
          Manage your agro tests and their parameters
        </p>
      </div>
      <AgroTestTable 
        data={filteredData}
        columns={columns}
        searchable={true}
        selectable={true}
        onSelectionChange={setSelectedRows}
        toolbar={
          <div className="flex items-center gap-2">
            {selectedRows.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isSubmitting}
                className="h-8"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedRows.size})
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {sampleTypeFilter ? SAMPLE_TYPES.find(t => t.value === sampleTypeFilter)?.label : 'Filter'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {SAMPLE_TYPES.map((type) => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() => setSampleTypeFilter(type.value)}
                    className={sampleTypeFilter === type.value ? 'font-bold bg-muted' : ''}
                  >
                    {type.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              onClick={handleAdd}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Test
            </Button>
          </div>
        }
      />

      <TestParametersDialog
        test={selectedTest}
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      <AgroTestForm
        mode="create"
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <AgroTestForm
        mode="edit"
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        onSubmit={handleUpdateSubmit}
        isLoading={isSubmitting}
        initialData={selectedTest || undefined}
      />

      <AlertDialog open={!!testToDelete} onOpenChange={() => !isSubmitting && setTestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this test? This action cannot be undone.
              This will permanently delete the test and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={() => !isSubmitting && setIsBulkDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Tests</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.size} selected tests?
              This action cannot be undone. This will permanently delete the tests
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              disabled={isSubmitting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : `Delete ${selectedRows.size} Tests`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AgroTestTableWrapper 