'use client'

import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronUp, ChevronsUpDown, Copy, Search, Beaker, Filter, TestTube, ClipboardList, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { AgroTest } from "@/app/types/agrotest"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Column<T> {
  header: string
  accessorKey: keyof T
  cell?: (item: T) => React.ReactNode
}

interface AgroTestTableProps<T extends AgroTest> {
  data: T[]
  columns: Column<T>[]
  onRowSelect?: (selectedItems: T[]) => void
  onRowClick?: (item: T) => void
  searchable?: boolean
  selectable?: boolean
  itemsPerPage?: number
  toolbar?: React.ReactNode
  onSelectionChange?: (selectedIds: Set<string>) => void
  onDataChange?: () => void
}

function AgroTestTable<T extends AgroTest>({
  data,
  columns,
  onRowSelect,
  onRowClick,
  searchable = false,
  selectable = false,
  itemsPerPage = 10,
  toolbar,
  onSelectionChange,
  onDataChange,
}: AgroTestTableProps<T>) {
  const [selectedItems, setSelectedItems] = useState<T[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null
    direction: 'asc' | 'desc' | null
  }>({ key: null, direction: null })

  const handleCopy = async (item: T) => {
    try {
      setLoading(true)
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

      toast.success('Agro test copied successfully');
      onDataChange?.();
    } catch (error) {
      console.error('Error copying agro test:', error);
      toast.error('Failed to copy agro test');
    } finally {
      setLoading(false)
    }
  }

  // Filter data based on search query
  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue === bValue) return 0
    if (aValue === null) return 1
    if (bValue === null) return -1

    const comparison = String(aValue).localeCompare(String(bValue))
    return sortConfig.direction === 'asc' ? comparison : -comparison
  })

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (key: keyof T) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key
          ? current.direction === 'asc'
            ? 'desc'
            : current.direction === 'desc'
            ? null
            : 'asc'
          : 'asc',
    }))
  }

  const handleSelectAll = (checked: boolean) => {
    const newSelectedItems = checked ? paginatedData : []
    setSelectedItems(newSelectedItems)
    onRowSelect?.(newSelectedItems)
    onSelectionChange?.(new Set(newSelectedItems.map(item => item.id)))
  }

  const handleSelectItem = (item: T, checked: boolean) => {
    const newSelectedItems = checked
      ? [...selectedItems, item]
      : selectedItems.filter((i) => i.id !== item.id)
    setSelectedItems(newSelectedItems)
    onRowSelect?.(newSelectedItems)
    onSelectionChange?.(new Set(newSelectedItems.map(item => item.id)))
  }

  const getSortIcon = (key: keyof T) => {
    if (sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4" />
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  // Calculate statistics
  const stats = {
    total: data.length,
    soilAndWaterTests: data.filter(test => test.sampleType === 'SOIL' || test.sampleType === 'WATER').length,
    fertilizerTests: data.filter(test => test.sampleType === 'FERTILIZER').length,
    parameters: data.reduce((acc, test) => acc + test.testParameter.length, 0),
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-red-500 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-12 w-[250px]" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Tests</p>
                <h3 className="text-2xl font-bold tracking-tight">{stats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <TestTube className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Test Parameters</p>
                <h3 className="text-2xl font-bold tracking-tight">{stats.parameters}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Beaker className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Soil & Water Tests</p>
                <h3 className="text-2xl font-bold tracking-tight">{stats.soilAndWaterTests}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Fertilizer Tests</p>
                <h3 className="text-2xl font-bold tracking-tight">{stats.fertilizerTests}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-col gap-4">
          <div>
            <CardTitle>Agro Tests</CardTitle>
            <CardDescription>
              Manage and view all available agro tests
            </CardDescription>
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="relative w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {toolbar && (
              <div className="flex items-center gap-2">{toolbar}</div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {selectable && (
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedItems.length === paginatedData.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  {columns.map((column) => (
                    <TableHead
                      key={String(column.accessorKey)}
                      className="cursor-pointer"
                      onClick={() => handleSort(column.accessorKey)}
                    >
                      <div className="flex items-center gap-2">
                        {column.header}
                        {getSortIcon(column.accessorKey)}
                      </div>
                    </TableHead>
                  ))}
                  {/* <TableHead className="text-right">Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + (selectable ? 2 : 1)} className="h-[400px]">
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="p-4 bg-muted/50 rounded-full mb-4">
                          <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          {searchQuery ? 'No matching tests found' : 'No tests available'}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          {searchQuery 
                            ? 'Try adjusting your search to find what you\'re looking for.'
                            : 'There are currently no tests available.'}
                        </p>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow
                      key={item.id}
                      className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={() => onRowClick?.(item)}
                    >
                      {selectable && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedItems.some((i) => i.id === item.id)}
                            onCheckedChange={(checked) =>
                              handleSelectItem(item, checked as boolean)
                            }
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell key={String(column.accessorKey)}>
                          {column.cell
                            ? column.cell(item)
                            : String(item[column.accessorKey])}
                        </TableCell>
                      ))}
                      {/* <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(item);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell> */}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default AgroTestTable