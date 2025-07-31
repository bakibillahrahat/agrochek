"use client"
import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from 'date-fns'
import { ReportStatus } from '@/lib/generated/prisma-client'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Eye, MoreHorizontal, Pencil, Trash, FileText, CheckCircle2, AlertCircle, Clock, Calendar, Filter, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useRouter } from 'next/navigation'

interface Report {
  id: string
  reportNumber: string
  reportType: string
  issueDate: string
  createdAt: string
  status: ReportStatus
  client: {
    name: string
    phone: string
  }
  order: {
    id: string
  }
  samples: {
    sampleType: string
    testResults: {
      id: string
      value: number | null
      wetlandValue: number | null
      uplandValue: number | null
      interpretation: string | null
      uplandInterpretation: string | null
      wetlandInterpretation: string | null
      testParamater: {
        name: string
        unit: string | null
      }
    }[]
  }[]
}

export default function ReportsDataTable() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL')
  const [dateFilter, setDateFilter] = useState<string>('ALL')
  const [sampleTypeFilter, setSampleTypeFilter] = useState<string>('ALL')
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [reportsToDelete, setReportsToDelete] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingReports, setDeletingReports] = useState<Set<string>>(new Set())
  const [viewReport, setViewReport] = useState<Report | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Function to format relative time
  const formatRelativeTime = (dateString: string): string => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds} sec${diffInSeconds !== 1 ? 's' : ''} ago`
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
    }

    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`
    }

    const diffInYears = Math.floor(diffInMonths / 12)
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`
  }

  useEffect(() => {
    fetchReports()
  }, [retryCount])

  // Update relative time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update relative times
      setReports(prev => [...prev])
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error === "Database connection error") {
          throw new Error("Unable to connect to the database. Please try again later.")
        }
        throw new Error(errorData.message || 'Failed to fetch reports')
      }

      const data = await response.json()
      setReports(data)
      setError(null)
      setRetryCount(0) // Reset retry count on success
    } catch (err) {
      console.error('Error fetching reports:', err)
      if (err instanceof Error && err.message.includes("Unable to connect to the database")) {
        setError("Database connection error. Please try again later.")
        // Implement retry logic
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, 5000) // Retry after 5 seconds
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch reports')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.DRAFT:
        return 'bg-yellow-500'
      case ReportStatus.ISSUED:
        return 'bg-green-500'
      case ReportStatus.REJECTED:
        return 'bg-red-500'
      case ReportStatus.PENDING_REVIEW:
        return 'bg-blue-500'
      case ReportStatus.APPROVED:
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: ReportStatus) => {
    return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')
  }

  const handleCheckboxChange = (reportId: string) => {
    setSelectedReports(
      selectedReports.includes(reportId)
        ? selectedReports.filter(id => id !== reportId)
        : [...selectedReports, reportId]
    )
  }

  const handleView = (reportId: string) => {
    router.push(`/dashboard/reports/${reportId}`, )
  }

  const handleEdit = (reportId: string) => {
    router.push(`/dashboard/reports/${reportId}/edit`)
  }

  const handleDelete = async (reportId: string) => {
    try {
      setDeletingReports(prev => new Set([...prev, reportId]))
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete report')
      }
      setReports(prev => prev.filter(r => r.id !== reportId))
      setReportsToDelete([])
    } catch (err) {
      console.error('Error deleting report:', err)
    } finally {
      setDeletingReports(prev => {
        const newSet = new Set(prev)
        newSet.delete(reportId)
        return newSet
      })
    }
  }

  const handleBulkDelete = async () => {
    try {
      setIsDeleting(true)
      await Promise.all(reportsToDelete.map(id => handleDelete(id)))
      setSelectedReports([])
    } catch (err) {
      console.error('Error deleting reports:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update report status')
      }

      // Update the local state
      const updatedReports = reports.map(report =>
        report.id === reportId
          ? { ...report, status: newStatus }
          : report
      )
      setReports(updatedReports)

      // If report status is set to APPROVED, automatically update order status to COMPLETED
      if (newStatus === ReportStatus.APPROVED) {
        const report = reports.find(r => r.id === reportId)
        if (report?.order?.id) {
          try {
            const orderResponse = await fetch('/api/orders', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                id: report.order.id, 
                status: 'COMPLETED' 
              }),
            })

            if (!orderResponse.ok) {
              console.error('Failed to update order status to COMPLETED')
              // Don't throw error here to avoid reverting report status update
            } else {
              console.log(`Order ${report.order.id} status updated to COMPLETED`)
            }
          } catch (orderError) {
            console.error('Error updating order status:', orderError)
            // Don't throw error here to avoid reverting report status update
          }
        }
      }
    } catch (error) {
      console.error('Error updating report status:', error)
      // You might want to show an error toast here
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesStatus = statusFilter === 'ALL' || report.status === statusFilter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = searchQuery === '' || 
      report.reportNumber.toLowerCase().includes(searchLower) ||
      report.client.name.toLowerCase().includes(searchLower) ||
      report.client.phone.toLowerCase().includes(searchLower)

    // Date filter logic
    const matchesDate = (() => {
      if (dateFilter === 'ALL') return true
      
      const reportDate = new Date(report.createdAt)
      const now = new Date()
      
      switch (dateFilter) {
        case 'TODAY':
          return reportDate.toDateString() === now.toDateString()
        case 'YESTERDAY':
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          return reportDate.toDateString() === yesterday.toDateString()
        case 'LAST_7_DAYS':
          const sevenDaysAgo = new Date(now)
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          return reportDate >= sevenDaysAgo
        case 'LAST_30_DAYS':
          const thirtyDaysAgo = new Date(now)
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return reportDate >= thirtyDaysAgo
        case 'LAST_90_DAYS':
          const ninetyDaysAgo = new Date(now)
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
          return reportDate >= ninetyDaysAgo
        default:
          return true
      }
    })()

    // Sample type filter logic
    const matchesSampleType = (() => {
      if (sampleTypeFilter === 'ALL') return true
      
      return report.samples.some(sample => 
        sample.sampleType?.toLowerCase() === sampleTypeFilter.toLowerCase()
      )
    })()

    return matchesStatus && matchesSearch && matchesDate && matchesSampleType
  })

  // Get unique sample types from reports
  const sampleTypes = Array.from(new Set(
    reports.flatMap(report => 
      report.samples.map(sample => sample.sampleType).filter(Boolean)
    )
  )).sort()

  // Clear all filters function
  const clearAllFilters = () => {
    setSearchQuery('')
    setStatusFilter('ALL')
    setDateFilter('ALL')
    setSampleTypeFilter('ALL')
  }

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || dateFilter !== 'ALL' || sampleTypeFilter !== 'ALL'

  const stats = {
    total: reports.length,
    draft: reports.filter(r => r.status === ReportStatus.DRAFT).length,
    pending: reports.filter(r => r.status === ReportStatus.PENDING_REVIEW).length,
    issued: reports.filter(r => r.status === ReportStatus.ISSUED).length,
    approved: reports.filter(r => r.status === ReportStatus.APPROVED).length,
    rejected: reports.filter(r => r.status === ReportStatus.REJECTED).length,
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-red-500 text-center">{error}</div>
        </CardContent>
      </Card>
    )
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
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-lg sm:rounded-xl">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Reports</p>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">{stats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-lg sm:rounded-xl">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Pending Review</p>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">{stats.pending}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg sm:rounded-xl">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Approved</p>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">{stats.approved}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg sm:rounded-xl">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Rejected</p>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">{stats.rejected}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-6">
          <div>
            <CardTitle className="text-lg sm:text-xl">Reports Management</CardTitle>
            <CardDescription className="text-sm">
              Manage and track all reports in the system
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3 sm:gap-4">
            <div className="relative w-full sm:w-[280px] lg:w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
            
            {/* Filters Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  {statusFilter !== 'ALL' && (
                    <Badge variant="secondary" className="text-xs">
                      Status: {getStatusText(statusFilter)}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setStatusFilter('ALL')}
                      />
                    </Badge>
                  )}
                  {dateFilter !== 'ALL' && (
                    <Badge variant="secondary" className="text-xs">
                      Date: {dateFilter.replace('_', ' ').toLowerCase()}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setDateFilter('ALL')}
                      />
                    </Badge>
                  )}
                  {sampleTypeFilter !== 'ALL' && (
                    <Badge variant="secondary" className="text-xs">
                      Type: {sampleTypeFilter}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setSampleTypeFilter('ALL')}
                      />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs h-6 px-2"
                  >
                    Clear all
                  </Button>
                </div>
              )}
              
              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Status
                      {statusFilter !== 'ALL' && (
                        <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" align="end">
                    <div className="p-3">
                      <h4 className="font-medium text-sm mb-2">Filter by Status</h4>
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value as ReportStatus | 'ALL')}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Statuses</SelectItem>
                          {Object.values(ReportStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                                <span>{getStatusText(status)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Date Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      <Calendar className="h-3 w-3 mr-1" />
                      Date
                      {dateFilter !== 'ALL' && (
                        <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" align="end">
                    <div className="p-3">
                      <h4 className="font-medium text-sm mb-2">Filter by Date</h4>
                      <Select
                        value={dateFilter}
                        onValueChange={(value) => setDateFilter(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Dates</SelectItem>
                          <SelectItem value="TODAY">Today</SelectItem>
                          <SelectItem value="YESTERDAY">Yesterday</SelectItem>
                          <SelectItem value="LAST_7_DAYS">Last 7 Days</SelectItem>
                          <SelectItem value="LAST_30_DAYS">Last 30 Days</SelectItem>
                          <SelectItem value="LAST_90_DAYS">Last 90 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Sample Type Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      <Filter className="h-3 w-3 mr-1" />
                      Sample Type
                      {sampleTypeFilter !== 'ALL' && (
                        <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" align="end">
                    <div className="p-3">
                      <h4 className="font-medium text-sm mb-2">Filter by Sample Type</h4>
                      <Select
                        value={sampleTypeFilter}
                        onValueChange={(value) => setSampleTypeFilter(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select sample type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Types</SelectItem>
                          {sampleTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              {selectedReports.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setReportsToDelete(selectedReports)}
                  className="flex items-center gap-2 w-full sm:w-auto text-sm"
                  disabled={isDeleting}
                >
                  <Trash className="h-4 w-4" />
                  <span className="hidden xs:inline">
                    {isDeleting ? 'Deleting...' : `Delete Selected (${selectedReports.length})`}
                  </span>
                  <span className="xs:hidden">
                    Delete ({selectedReports.length})
                  </span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 -mt-15">
          <div className="rounded-md border-0 sm:border">
            <div className="relative">
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3 p-4">
                {filteredReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <div className="p-3 bg-muted/50 rounded-full mb-3">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold mb-2">
                      {searchQuery ? 'No matching reports found' : 'No reports available'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {searchQuery || hasActiveFilters
                        ? 'Try adjusting your search or filters.'
                       : 'There are currently no reports in the selected status.'}
                    </p>
                    {(searchQuery || hasActiveFilters) && (
                      <button
                        onClick={clearAllFilters}
                        className="mt-3 text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <Card key={report.id} className={`${deletingReports.has(report.id) ? "opacity-50" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedReports.includes(report.id)}
                              onCheckedChange={() => handleCheckboxChange(report.id)}
                              disabled={deletingReports.has(report.id)}
                            />
                            <div>
                              <h4 className="font-semibold text-sm">{report.reportNumber}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`} />
                                <span className="text-xs text-muted-foreground">{getStatusText(report.status)}</span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(report.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setReportsToDelete([report.id])}
                                className="text-red-600"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Client:</span>
                            <div className="text-right">
                              <div className="font-medium">{report.client.name}</div>
                              <div className="text-xs text-muted-foreground">{report.client.phone}</div>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span>{report.reportType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Issue Date:</span>
                            <span>{report.issueDate ? format(new Date(report.issueDate), 'MMM dd, yyyy') : 'Not issued'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created:</span>
                            <span>{formatRelativeTime(report.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Samples:</span>
                            <span>{report.samples.length}</span>
                          </div>
                          {report.samples.length > 0 && report.samples[0].sampleType && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sample Type:</span>
                              <Badge variant="outline" className="text-xs">
                                {report.samples[0].sampleType}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(report.id)}
                            className="w-full text-sm"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[50px] bg-background">
                          <Checkbox
                            checked={filteredReports.length > 0 && selectedReports.length === filteredReports.length}
                            onCheckedChange={(checked) => {
                              setSelectedReports(checked ? filteredReports.map(report => report.id) : [])
                            }}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead className="bg-background min-w-[120px]">Report Number</TableHead>
                        <TableHead className="bg-background min-w-[150px]">Client</TableHead>
                        <TableHead className="bg-background min-w-[80px] max-w-[100px]">Type</TableHead>
                        <TableHead className="bg-background min-w-[120px]">Issue Date</TableHead>
                        <TableHead className="bg-background min-w-[100px]">Created</TableHead>
                        <TableHead className="bg-background min-w-[140px]">Status</TableHead>
                        <TableHead className="bg-background min-w-[80px]">Samples</TableHead>
                        <TableHead className="bg-background min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-[400px]">
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <div className="p-4 bg-muted/50 rounded-full mb-4">
                                <Search className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <h3 className="text-lg font-semibold mb-2">
                                {searchQuery ? 'No matching reports found' : 'No reports available'}
                              </h3>
                              <p className="text-sm text-muted-foreground max-w-sm">
                                {searchQuery || hasActiveFilters
                                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                                 : 'There are currently no reports in the selected status.'}
                              </p>
                              {(searchQuery || hasActiveFilters) && (
                                <button
                                  onClick={clearAllFilters}
                                  className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
                                >
                                  Clear all filters
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredReports.map((report) => (
                          <TableRow 
                            key={report.id}
                            className={deletingReports.has(report.id) ? "opacity-50" : ""}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedReports.includes(report.id)}
                                onCheckedChange={() => handleCheckboxChange(report.id)}
                                aria-label={`Select report ${report.id}`}
                                disabled={deletingReports.has(report.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{report.reportNumber}</TableCell>
                            <TableCell>
                              <div className="font-medium">{report.client.name}</div>
                              <div className="text-sm text-muted-foreground">{report.client.phone}</div>
                            </TableCell>
                            <TableCell className="max-w-[100px]">
                              <div className="truncate text-sm" title={report.reportType}>
                                {report.reportType}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {report.issueDate ? format(new Date(report.issueDate), 'MMM dd, yyyy') : 'Not issued'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {formatRelativeTime(report.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={report.status}
                                onValueChange={(value) => handleStatusChange(report.id, value as ReportStatus)}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`} />
                                    <span className="text-sm truncate">{getStatusText(report.status)}</span>
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(ReportStatus).map((status) => (
                                    <SelectItem key={status} value={status}>
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                                        <span>{getStatusText(status)}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-center">
                              {report.samples.length}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleView(report.id)}
                                  className="flex items-center gap-1 text-xs px-2"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span className="hidden lg:inline">View</span>
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="px-2">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setReportsToDelete([report.id])}
                                      className="text-red-600"
                                    >
                                      <Trash className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog 
        open={reportsToDelete.length > 0} 
        onOpenChange={() => setReportsToDelete([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reportsToDelete.length === 1 
                ? "Delete Report"
                : `Delete Selected Reports`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reportsToDelete.length === 1 
                ? "Are you sure you want to delete this report? This action cannot be undone and will permanently remove the report from the system."
                : `Are you sure you want to delete ${reportsToDelete.length} selected report(s)? This action cannot be undone and will permanently remove the reports from the system.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}