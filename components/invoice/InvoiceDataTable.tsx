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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eye, MoreHorizontal, Pencil, Trash, ChevronDown, Plus, Search, Filter, Loader2, Receipt, DollarSign, FileText, CheckCircle2 } from "lucide-react"
import { useRouter } from 'next/navigation'
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertCircle,
} from "lucide-react"
import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoiceView } from './InvoiceView'

interface Invoice {
  id: string
  orderId: string
  totalAmount: number
  status: 'PAID' | 'DUE' | 'CANCELLED'
  createdAt: string | Date
  order?: {
    client?: {
      name: string
      phone: string
    }
    items?: {
      id: string
      name: string
      quantity: number
      price: number
    }[]
  }
}

interface InvoiceDataTableProps {
  initialInvoices: Invoice[]
  onDelete: (invoiceId: string) => Promise<void>
  onStatusUpdate: (invoiceId: string, newStatus: 'PAID' | 'DUE' | 'CANCELLED') => Promise<void>
  isLoading: boolean
  selectedInvoices: string[]
  onSelectionChange: (selectedIds: string[]) => void
}

const InvoiceDataTable = ({ 
  initialInvoices, 
  onDelete, 
  onStatusUpdate,
  isLoading,
  selectedInvoices,
  onSelectionChange,
}: InvoiceDataTableProps) => {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'PAID' | 'DUE' | 'CANCELLED' | 'ALL'>('ALL')
  const [selectedInvoicesToDelete, setSelectedInvoicesToDelete] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null)
  const [deletingInvoices, setDeletingInvoices] = useState<Set<string>>(new Set())
  const [tableLoading, setTableLoading] = useState(false)

  // Update invoices when initialInvoices changes
  useEffect(() => {
    setInvoices(initialInvoices)
  }, [initialInvoices])

  // Filter invoices based on search query and status filter
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchQuery === '' || 
      invoice.order?.client?.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.order?.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCheckboxChange = (invoiceId: string) => {
    onSelectionChange(
      selectedInvoices.includes(invoiceId)
        ? selectedInvoices.filter(id => id !== invoiceId)
        : [...selectedInvoices, invoiceId]
    )
  }

  const handleStatusUpdate = async (invoiceId: string, newStatus: 'PAID' | 'DUE' | 'CANCELLED') => {
    try {
      // Optimistically update the UI
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, status: newStatus }
            : invoice
        )
      )
      await onStatusUpdate(invoiceId, newStatus)
    } catch (error) {
      console.error('Error updating invoice status:', error)
      // Revert the optimistic update on error
      setInvoices(initialInvoices)
    }
  }

  const handleBulkDelete = async () => {
    try {
      setIsDeleting(true)
      // Optimistically remove invoices from UI
      setInvoices(prevInvoices => 
        prevInvoices.filter(invoice => !selectedInvoicesToDelete.includes(invoice.id))
      )
      await Promise.all(selectedInvoicesToDelete.map(invoiceId => onDelete(invoiceId)))
      setSelectedInvoicesToDelete([])
      onSelectionChange([])
    } catch (error) {
      console.error('Error deleting invoices:', error)
      // Revert the optimistic update on error
      setInvoices(initialInvoices)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSingleDelete = async (invoiceId: string) => {
    try {
      setDeletingInvoices(prev => new Set([...prev, invoiceId]))
      // Optimistically remove invoice from UI
      setInvoices(prevInvoices => prevInvoices.filter(invoice => invoice.id !== invoiceId))
      await onDelete(invoiceId)
      setInvoiceToDelete(null)
    } catch (error) {
      console.error('Error deleting invoice:', error)
      // Revert the optimistic update on error
      setInvoices(initialInvoices)
    } finally {
      setDeletingInvoices(prev => {
        const newSet = new Set(prev)
        newSet.delete(invoiceId)
        return newSet
      })
    }
  }

  const getStatusColor = (status: 'PAID' | 'DUE' | 'CANCELLED') => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500';
      case 'DUE':
        return 'bg-yellow-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: 'PAID' | 'DUE' | 'CANCELLED') => {
    switch (status) {
      case 'PAID':
        return 'Paid';
      case 'DUE':
        return 'Due';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    due: invoices.filter(i => i.status === 'DUE').length,
    cancelled: invoices.filter(i => i.status === 'CANCELLED').length,
    totalAmount: invoices.reduce((acc, invoice) => acc + invoice.totalAmount, 0)
  }

  const handleViewInvoice = (invoice: Invoice) => {
    window.open(`/dashboard/invoice/${invoice.id}`, '_blank')
  }

  const handleEditInvoice = (invoice: Invoice) => {
    router.push(`/dashboard/invoice/${invoice.id}/edit`)
  }

  if (isLoading) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Invoices</p>
                <h3 className="text-2xl font-bold tracking-tight">{stats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Paid Invoices</p>
                <h3 className="text-2xl font-bold tracking-tight">{stats.paid}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due</p>
                  <h3 className="text-xl font-bold tracking-tight">{stats.due}</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-xl">
                  <Trash className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                  <h3 className="text-xl font-bold tracking-tight">{stats.cancelled}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Amount</p>
                <h3 className="text-2xl font-bold tracking-tight">৳{stats.totalAmount.toFixed(2)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-col gap-4">
          <div>
            <CardTitle>Invoices Management</CardTitle>
            <CardDescription>
              Manage and track all invoices in the system
            </CardDescription>
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="relative w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by phone, name or invoice ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as 'PAID' | 'DUE' | 'CANCELLED' | 'ALL')}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="DUE">Due</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedInvoices.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={() => setSelectedInvoicesToDelete(selectedInvoices)}
                  className="flex items-center gap-2"
                  disabled={isDeleting}
                >
                  <Trash className="h-4 w-4" />
                  {isDeleting ? 'Deleting...' : `Delete Selected (${selectedInvoices.length})`}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="relative">
              <div className="overflow-x-auto">
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[50px] bg-background">
                          <Checkbox
                            checked={filteredInvoices.length > 0 && selectedInvoices.length === filteredInvoices.length}
                            onCheckedChange={(checked) => {
                              onSelectionChange(checked ? filteredInvoices.map(invoice => invoice.id) : [])
                            }}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead className="bg-background">Client</TableHead>
                        <TableHead className="bg-background">Order ID</TableHead>
                        <TableHead className="bg-background">Amount</TableHead>
                        <TableHead className="bg-background">Status</TableHead>
                        <TableHead className="bg-background">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableLoading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            </TableRow>
                          ))}
                        </>
                      ) : filteredInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-[400px]">
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <div className="p-4 bg-muted/50 rounded-full mb-4">
                                <Search className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <h3 className="text-lg font-semibold mb-2">
                                {searchQuery ? 'No matching invoices found' : 'No invoices available'}
                              </h3>
                              <p className="text-sm text-muted-foreground max-w-sm">
                                {searchQuery 
                                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                                  : 'There are currently no invoices in the selected status.'}
                              </p>
                              {searchQuery && (
                                <button
                                  onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('ALL');
                                  }}
                                  className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
                                >
                                  Clear all filters
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInvoices.map((invoice) => (
                          <TableRow 
                            key={invoice.id}
                            className={deletingInvoices.has(invoice.id) ? "opacity-50" : ""}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedInvoices.includes(invoice.id)}
                                onCheckedChange={() => handleCheckboxChange(invoice.id)}
                                aria-label={`Select invoice ${invoice.id}`}
                                disabled={deletingInvoices.has(invoice.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{invoice.order?.client?.name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{invoice.order?.client?.phone || '-'}</div>
                            </TableCell>
                            <TableCell className="font-medium">{invoice.orderId}</TableCell>
                            <TableCell>৳{invoice.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Select
                                value={invoice.status}
                                onValueChange={(value) => handleStatusUpdate(invoice.id, value as 'PAID' | 'DUE' | 'CANCELLED')}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(invoice.status)}`} />
                                    <SelectValue>
                                      {getStatusText(invoice.status)}
                                    </SelectValue>
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  {['PAID', 'DUE', 'CANCELLED'].map((status) => (
                                    <SelectItem 
                                      key={status} 
                                      value={status}
                                      className="flex items-center gap-2"
                                    >
                                      <div className={`w-2 h-2 rounded-full ${getStatusColor(status as 'PAID' | 'DUE' | 'CANCELLED')}`} />
                                      {getStatusText(status as 'PAID' | 'DUE' | 'CANCELLED')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    window.open(`/dashboard/invoice/${invoice.id}`, '_blank')
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleViewInvoice(invoice)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleEditInvoice(invoice)}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setInvoiceToDelete(invoice.id)}
                                      className="text-red-600"
                                    >
                                      <Trash className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusUpdate(
                                          invoice.id,
                                          invoice.status === 'PAID' ? 'DUE' : 'PAID'
                                        )
                                      }
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      {invoice.status === 'PAID' ? 'Mark as Due' : 'Mark as Paid'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusUpdate(
                                          invoice.id,
                                          'CANCELLED'
                                        )
                                      }
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Mark as Cancelled
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
        open={selectedInvoicesToDelete.length > 0 || !!invoiceToDelete} 
        onOpenChange={() => {
          setSelectedInvoicesToDelete([])
          setInvoiceToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {invoiceToDelete 
                ? "Delete Invoice"
                : `Delete Selected Invoices`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {invoiceToDelete 
                ? "Are you sure you want to delete this invoice? This action cannot be undone and will permanently remove the invoice from the system."
                : `Are you sure you want to delete ${selectedInvoicesToDelete.length} selected invoice(s)? This action cannot be undone and will permanently remove the invoices from the system.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (invoiceToDelete) {
                  handleSingleDelete(invoiceToDelete)
                } else {
                  handleBulkDelete()
                }
              }}
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

export default InvoiceDataTable