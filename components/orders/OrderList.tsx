'use client'

import React, { useState, useEffect } from 'react'
import { OrderStatus, InvoiceStatus } from '@/lib/generated/prisma-client'
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
import { Eye, MoreHorizontal, Pencil, Trash, ChevronDown, Plus, Search, Filter, Loader2, ClipboardList, Clock, CheckCircle2, Beaker, Calendar, CreditCard, CalendarIcon } from "lucide-react"
import { useRouter } from 'next/navigation'
import OrderView from './OrderView'
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AgroTest {
  id: string
  name: string
  price: number
}

interface Order {
  id: string
  clientId: string
  operatorId: string
  totalAmount: number
  status: OrderStatus
  createdAt: Date
  client: {
    name: string
    phone: string | null
  }
  samples: Array<{
    sampleIdNumber: string
    sampleType: string
  }>
  orderItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    subtotal: number
    agroTest: {
      id: string
      name: string
    }
  }>
  invoice: {
    id: string
    status: InvoiceStatus
    totalAmount: number
    paidAmount: number
  } | null
}

interface OrderListProps {
  initialOrders: Order[]
  onDelete: (orderId: string) => Promise<void>
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => Promise<void>
  onPaymentStatusUpdate: (orderId: string, newStatus: InvoiceStatus) => Promise<void>
  onAddTests: (orderId: string, items: Array<{ agroTestId: string; quantity: number }>) => Promise<void>
  isLoading: boolean
  selectedOrders: string[]
  onSelectionChange: (selectedIds: string[]) => void
  availableAgroTests: AgroTest[]
}

const getStatusBadgeVariant = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return "secondary";
    case OrderStatus.IN_PROGRESS:
      return "default";
    case OrderStatus.TESTING_COMPLETED:
      return "outline";
    case OrderStatus.REPORT_GENERATED:
      return "outline";
    case OrderStatus.COMPLETED:
      return "default";
    case OrderStatus.CANCELLED:
      return "destructive";
    default:
      return "secondary";
  }
};

const getPaymentStatusColor = (invoice: Order['invoice']) => {
  if (!invoice) return 'bg-gray-500'
  
  switch (invoice.status) {
    case 'PAID':
      return 'bg-green-500';
    case 'DUE':
      return 'bg-orange-500';
    case 'CANCELLED':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getPaymentStatusText = (invoice: Order['invoice']) => {
  if (!invoice) return 'No Invoice'
  
  switch (invoice.status) {
    case 'PAID':
      return 'Paid';
    case 'DUE':
      return 'Due';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return invoice.status;
  }
};

const getPaymentStatusBadgeVariant = (invoice: Order['invoice']) => {
  if (!invoice) return "outline"
  
  switch (invoice.status) {
    case 'PAID':
      return "default";
    case 'DUE':
      return "secondary";
    case 'CANCELLED':
      return "destructive";
    default:
      return "outline";
  }
};

const OrderList = ({ 
  initialOrders, 
  onDelete, 
  onStatusUpdate,
  onPaymentStatusUpdate,
  onAddTests,
  isLoading,
  selectedOrders,
  onSelectionChange,
  availableAgroTests = []
}: OrderListProps) => {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [paymentFilter, setPaymentFilter] = useState<InvoiceStatus | 'ALL' | 'NO_INVOICE'>('ALL')
  const [dateFilter, setDateFilter] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })
  const [selectedOrdersToDelete, setSelectedOrdersToDelete] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState<string | null>(null)
  const [deletingOrders, setDeletingOrders] = useState<Set<string>>(new Set())
  const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null)
  const [tableLoading, setTableLoading] = useState(false)

  // Update orders when initialOrders changes
  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  // Filter orders based on search query and status filter
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter
    
    const matchesPayment = paymentFilter === 'ALL' || 
      (paymentFilter === 'NO_INVOICE' && !order.invoice) ||
      (paymentFilter !== 'NO_INVOICE' && order.invoice?.status === paymentFilter)
    
    const matchesDate = (!dateFilter.from && !dateFilter.to) ||
      (dateFilter.from && !dateFilter.to && new Date(order.createdAt) >= dateFilter.from) ||
      (!dateFilter.from && dateFilter.to && new Date(order.createdAt) <= dateFilter.to) ||
      (dateFilter.from && dateFilter.to && 
        new Date(order.createdAt) >= dateFilter.from && 
        new Date(order.createdAt) <= dateFilter.to)
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDate
  })

  const handleCheckboxChange = (orderId: string) => {
    onSelectionChange(
      selectedOrders.includes(orderId)
        ? selectedOrders.filter(id => id !== orderId)
        : [...selectedOrders, orderId]
    )
  }

  const handleView = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (order) {
      // Navigate to invoice page if invoice exists, otherwise navigate to order page
      if (order.invoice?.id) {
        router.push(`/dashboard/invoice/${order.invoice.id}`)
      } else {
        // If no invoice exists, navigate to create invoice page or order details
        router.push(`/dashboard/orders/${orderId}`)
      }
    }
  }

  const handleEdit = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setOrderToUpdate(order)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingStatus(orderId)
      
      // Show optimistic update with visual feedback
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      )
      
      await onStatusUpdate(orderId, newStatus)
      
      // Add success feedback
      const statusText = getStatusText(newStatus)
      toast.success(`Order status updated to ${statusText}`)
    } catch (error) {
      console.error('Error updating order status:', error)
      // Revert the optimistic update on error
      setOrders(initialOrders)
      toast.error('Failed to update order status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handlePaymentStatusUpdate = async (orderId: string, newStatus: InvoiceStatus) => {
    try {
      setUpdatingPaymentStatus(orderId)
      
      // Show optimistic update with visual feedback
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId && order.invoice
            ? { ...order, invoice: { ...order.invoice, status: newStatus } }
            : order
        )
      )
      
      await onPaymentStatusUpdate(orderId, newStatus)
      
      // Add success feedback
      const statusText = newStatus === 'PAID' ? 'Paid' : 
                        newStatus === 'DUE' ? 'Due' : 
                        newStatus === 'CANCELLED' ? 'Cancelled' : newStatus
      toast.success(`Payment status updated to ${statusText}`)
    } catch (error) {
      console.error('Error updating payment status:', error)
      // Revert the optimistic update on error
      setOrders(initialOrders)
      toast.error('Failed to update payment status')
    } finally {
      setUpdatingPaymentStatus(null)
    }
  }

  const handleUpdate = async (orderId: string, data: { 
    status: OrderStatus
    newItems?: Array<{ agroTestId: string; quantity: number }>
  }) => {
    try {
      // Update status if changed
      if (data.status) {
        await onStatusUpdate(orderId, data.status)
        // Optimistically update the UI
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: data.status }
              : order
          )
        )
      }

      // Add new tests if any
      if (data.newItems && data.newItems.length > 0) {
        await onAddTests(orderId, data.newItems)
        // Refresh the orders list to show new items
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating order:', error)
      // Revert the optimistic update on error
      setOrders(initialOrders)
    }
  }

  const handleBulkDelete = async () => {
    try {
      setIsDeleting(true)
      // Optimistically remove orders from UI
      setOrders(prevOrders => 
        prevOrders.filter(order => !selectedOrdersToDelete.includes(order.id))
      )
      await Promise.all(selectedOrdersToDelete.map(orderId => onDelete(orderId)))
      setSelectedOrdersToDelete([])
      onSelectionChange([])
    } catch (error) {
      console.error('Error deleting orders:', error)
      // Revert the optimistic update on error
      setOrders(initialOrders)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSingleDelete = async (orderId: string) => {
    try {
      setDeletingOrders(prev => new Set([...prev, orderId]))
      // Optimistically remove order from UI
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId))
      await onDelete(orderId)
      setOrderToDelete(null)
    } catch (error) {
      console.error('Error deleting order:', error)
      // Revert the optimistic update on error
      setOrders(initialOrders)
    } finally {
      setDeletingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-500';
      case OrderStatus.IN_PROGRESS:
        return 'bg-blue-500';
      case OrderStatus.TESTING_COMPLETED:
        return 'bg-purple-500';
      case OrderStatus.REPORT_GENERATED:
        return 'bg-indigo-500';
      case OrderStatus.COMPLETED:
        return 'bg-green-500';
      case OrderStatus.CANCELLED:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Pending';
      case OrderStatus.IN_PROGRESS:
        return 'In Progress';
      case OrderStatus.TESTING_COMPLETED:
        return 'Testing Completed';
      case OrderStatus.REPORT_GENERATED:
        return 'Report Generated';
      case OrderStatus.COMPLETED:
        return 'Completed';
      case OrderStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatOrderItems = (orderItems: Order['orderItems']) => {
    if (orderItems.length === 0) return 'No tests';
    if (orderItems.length === 1) {
      const item = orderItems[0];
      return `${item.agroTest.name} (${item.quantity})`;
    }
    const firstItem = orderItems[0];
    const additionalCount = orderItems.length - 1;
    return `${firstItem.agroTest.name} (${firstItem.quantity}) +${additionalCount}`;
  }

  const formatOrderItemsTooltip = (orderItems: Order['orderItems']) => {
    if (orderItems.length === 0) return 'No test items in this order';
    return orderItems.map(item => `• ${item.agroTest.name} (${item.quantity} sample${item.quantity > 1 ? 's' : ''})`).join('\n');
  }

  const formatOrderItemsMobile = (orderItems: Order['orderItems']) => {
    if (orderItems.length === 0) return 'No tests';
    if (orderItems.length === 1) {
      const item = orderItems[0];
      return `${item.agroTest.name} (${item.quantity})`;
    }
    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    return `${orderItems.length} tests (${totalItems} samples)`;
  }

  const formatSampleIds = (samples: Order['samples']) => {
    return samples.map(sample => sample.sampleIdNumber).join(', ');
  }

  const formatNumberOfSamples = (samples: Order['samples']) => {
    return samples.length;
  }

  const formatSampleDetails = (samples: Order['samples']) => {
    const sampleTypes = new Map<string, number>();
    samples.forEach(sample => {
      const count = sampleTypes.get(sample.sampleType) || 0;
      sampleTypes.set(sample.sampleType, count + 1);
    });
    
    return Array.from(sampleTypes.entries())
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
  }

  const getPaymentStatusText = (status: InvoiceStatus | 'NO_INVOICE') => {
    switch (status) {
      case 'PAID':
        return 'Paid';
      case 'DUE':
        return 'Due';
      case 'CANCELLED':
        return 'Cancelled';
      case 'NO_INVOICE':
        return 'No Invoice';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: InvoiceStatus | 'NO_INVOICE') => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500';
      case 'DUE':
        return 'bg-orange-500';
      case 'CANCELLED':
        return 'bg-red-500';
      case 'NO_INVOICE':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPaymentFilter('ALL');
    setDateFilter({ from: undefined, to: undefined });
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || paymentFilter !== 'ALL' || dateFilter.from || dateFilter.to;

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
    inProgress: orders.filter(o => o.status === OrderStatus.IN_PROGRESS).length,
    completed: orders.filter(o => o.status === OrderStatus.COMPLETED).length,
    cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
    totalSamples: orders.reduce((acc, order) => acc + order.samples.length, 0),
    totalAmount: orders.reduce((acc, order) => acc + order.totalAmount, 0),
    paidOrders: orders.filter(o => o.invoice?.status === 'PAID').length,
    unpaidOrders: orders.filter(o => o.invoice?.status === 'DUE').length,
    totalPaidAmount: orders.reduce((acc, order) => acc + (order.invoice?.status === 'PAID' ? order.totalAmount : 0), 0)
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Orders</p>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{stats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Paid Orders</p>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{stats.paidOrders}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                  Amount: ৳{stats.totalPaidAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-orange-500/10 rounded-xl flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Unpaid Orders</p>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{stats.unpaidOrders}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                  Amount Due: ৳{(stats.totalAmount - stats.totalPaidAmount).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl flex-shrink-0">
                <Beaker className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Samples</p>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{stats.totalSamples}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                  Total Amount: ৳{stats.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-col gap-2 p-4 sm:p-4 pb-2 sm:pb-2">
          <div>
            <CardTitle className="text-lg sm:text-xl">Orders Management</CardTitle>
            <CardDescription className="text-sm">
              Manage and track all orders in the system
            </CardDescription>
          </div>
          
          {/* Mobile Layout */}
          <div className="block lg:hidden space-y-4">
            {/* Search, Filters and Actions Row */}
            <div className="space-y-3">
              {/* Top Row: Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                />
              </div>
              
              {/* Second Row: Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as OrderStatus | 'ALL')}
                >
                  <SelectTrigger className="w-[140px] h-9 border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {statusFilter !== 'ALL' && (
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(statusFilter as OrderStatus)}`} />
                        )}
                        <span className="text-sm truncate">
                          {statusFilter === 'ALL' ? 'All Status' : getStatusText(statusFilter as OrderStatus)}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {Object.values(OrderStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                          <span>{getStatusText(status)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Payment Filter */}
                <Select
                  value={paymentFilter}
                  onValueChange={(value) => setPaymentFilter(value as InvoiceStatus | 'ALL' | 'NO_INVOICE')}
                >
                  <SelectTrigger className="w-[130px] h-9 border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {paymentFilter !== 'ALL' && (
                          <div className={`w-2 h-2 rounded-full ${getPaymentStatusColor(paymentFilter)}`} />
                        )}
                        <span className="text-sm truncate">
                          {paymentFilter === 'ALL' ? 'All Pay' : getPaymentStatusText(paymentFilter)}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Payments</SelectItem>
                    <SelectItem value="PAID">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPaymentStatusColor('PAID')}`} />
                        <span>Paid</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="DUE">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPaymentStatusColor('DUE')}`} />
                        <span>Due</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CANCELLED">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPaymentStatusColor('CANCELLED')}`} />
                        <span>Cancelled</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="NO_INVOICE">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPaymentStatusColor('NO_INVOICE')}`} />
                        <span>No Invoice</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Date Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 px-3 justify-start text-left font-normal border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors",
                        (!dateFilter.from && !dateFilter.to) && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="text-sm">
                        {dateFilter.from ? (
                          dateFilter.to ? (
                            "Date Range"
                          ) : (
                            format(dateFilter.from, "MMM dd")
                          )
                        ) : (
                          "Date"
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateFilter.from}
                      selected={{
                        from: dateFilter.from,
                        to: dateFilter.to,
                      }}
                      onSelect={(range) => {
                        setDateFilter({
                          from: range?.from,
                          to: range?.to,
                        });
                      }}
                      numberOfMonths={1}
                    />
                    <div className="p-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDateFilter({ from: undefined, to: undefined })}
                        className="w-full"
                      >
                        Clear Date
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Clear Filters & Delete Actions */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    {selectedOrders.length > 0 ? (
                      <Button 
                        variant="destructive" 
                        onClick={() => setSelectedOrdersToDelete(selectedOrders)}
                        className="flex items-center gap-2 h-9"
                        disabled={isDeleting}
                        size="sm"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete ({selectedOrders.length})</span>
                        <span className="sm:hidden">({selectedOrders.length})</span>
                      </Button>
                    ) : (
                      <div className="w-[100px] h-9"></div>
                    )}
                  </div>
                  
                  {/* New Order Button - Right aligned within this container */}
                  <div className="ml-auto">
                    <Button 
                      onClick={() => router.push('/dashboard/orders/new')} 
                      className="flex items-center gap-2 h-9 px-4"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">New Order</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop Layout */}
          <div className="hidden lg:block">
            {/* Single Row: Search (Left), Filters (Middle), Actions (Right) */}
            <div className="flex items-center justify-between gap-4">
              {/* Search Input - Left */}
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders by client, phone, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                />
              </div>
              
              {/* Filters - Middle */}
              <div className="flex items-center gap-3">
                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as OrderStatus | 'ALL')}
                >
                  <SelectTrigger className="w-[140px] h-10 border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {statusFilter !== 'ALL' && (
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(statusFilter as OrderStatus)}`} />
                        )}
                        <span className="text-sm">
                          {statusFilter === 'ALL' ? 'All Status' : getStatusText(statusFilter as OrderStatus)}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {Object.values(OrderStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                          <span>{getStatusText(status)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Payment Filter */}
                <Select
                  value={paymentFilter}
                  onValueChange={(value) => setPaymentFilter(value as InvoiceStatus | 'ALL' | 'NO_INVOICE')}
                >
                  <SelectTrigger className="w-[130px] h-10 border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {paymentFilter !== 'ALL' && (
                          <div className={`w-2 h-2 rounded-full ${getPaymentStatusColor(paymentFilter)}`} />
                        )}
                        <span className="text-sm">
                          {paymentFilter === 'ALL' ? 'All Payment' : getPaymentStatusText(paymentFilter)}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Payments</SelectItem>
                    <SelectItem value="PAID">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPaymentStatusColor('PAID')}`} />
                        <span>Paid</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="DUE">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPaymentStatusColor('DUE')}`} />
                        <span>Due</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CANCELLED">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPaymentStatusColor('CANCELLED')}`} />
                        <span>Cancelled</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="NO_INVOICE">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPaymentStatusColor('NO_INVOICE')}`} />
                        <span>No Invoice</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[160px] h-10 justify-start text-left font-normal border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors",
                        (!dateFilter.from && !dateFilter.to) && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="text-sm truncate">
                        {dateFilter.from ? (
                          dateFilter.to ? (
                            `${format(dateFilter.from, "MMM dd")} - ${format(dateFilter.to, "MMM dd")}`
                          ) : (
                            format(dateFilter.from, "MMM dd, yyyy")
                          )
                        ) : (
                          "Select date range"
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateFilter.from}
                      selected={{
                        from: dateFilter.from,
                        to: dateFilter.to,
                      }}
                      onSelect={(range) => {
                        setDateFilter({
                          from: range?.from,
                          to: range?.to,
                        });
                      }}
                      numberOfMonths={2}
                    />
                    <div className="p-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDateFilter({ from: undefined, to: undefined })}
                        className="w-full"
                      >
                        Clear Date Filter
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Delete Selected - Fixed Position */}
                <div className="flex items-center gap-2">
                  {selectedOrders.length > 0 ? (
                    <Button 
                      variant="destructive" 
                      onClick={() => setSelectedOrdersToDelete(selectedOrders)}
                      className="flex items-center gap-2"
                      disabled={isDeleting}
                    >
                      <Trash className="h-4 w-4" />
                      Delete ({selectedOrders.length})
                    </Button>
                  ) : (
                    <div className="w-[120px] h-10"></div>
                  )}
                </div>
              </div>
              
              {/* New Order Button - Right */}
              <Button 
                onClick={() => router.push('/dashboard/orders/new')} 
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Order
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-4 pt-0 sm:pt-2 -mt-6">
          <div className="rounded-md border overflow-hidden">
            <div className="relative">
              <div className="overflow-x-auto">
                <div className="max-h-[600px] overflow-y-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader className="sticky top-0 bg-background z-10 border-b">
                      <TableRow>
                        <TableHead className="w-[50px] bg-background sticky left-0 z-20 border-r">
                          <Checkbox
                            checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                            onCheckedChange={(checked) => {
                              onSelectionChange(checked ? filteredOrders.map(order => order.id) : [])
                            }}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead className="bg-background min-w-[120px]">Client</TableHead>
                        <TableHead className="bg-background w-[140px] max-w-[140px] hidden sm:table-cell">Tests</TableHead>
                        <TableHead className="bg-background min-w-[130px] hidden md:table-cell">Sample Details</TableHead>
                        <TableHead className="bg-background min-w-[100px]">Total Amount</TableHead>
                        <TableHead className="bg-background min-w-[110px] hidden lg:table-cell">Payment Status</TableHead>
                        <TableHead className="bg-background min-w-[140px]">Status</TableHead>
                        <TableHead className="bg-background min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableLoading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                              <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <div className="bg-muted/30 px-2 py-1.5 rounded-md border border-border/40">
                                  <Skeleton className="h-6 w-full" />
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell"><Skeleton className="h-8 w-28" /></TableCell>
                              <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                              <TableCell className="hidden lg:table-cell"><Skeleton className="h-8 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                            </TableRow>
                          ))}
                        </>
                      ) : filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-[400px]">
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                              <div className="p-4 bg-muted/50 rounded-full mb-4">
                                <ClipboardList className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <h3 className="text-lg font-semibold mb-2">
                                {searchQuery || hasActiveFilters ? 'No matching orders found' : 'No orders available'}
                              </h3>
                              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                                {searchQuery || hasActiveFilters
                                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                                 : 'There are currently no orders in the selected status. Create your first order to get started.'}
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2">
                                {(searchQuery || hasActiveFilters) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearAllFilters}
                                  >
                                    Clear all filters
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => router.push('/dashboard/orders/new')}
                                  className="flex items-center gap-2"
                                >
                                  <Plus className="h-4 w-4" />
                                  Create Order
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => (
                          <TableRow 
                            key={order.id}
                            className={cn(
                              "hover:bg-muted/50",
                              deletingOrders.has(order.id) && "opacity-50"
                            )}
                          >
                            <TableCell className="sticky left-0 z-10 bg-background border-r">
                              <Checkbox
                                checked={selectedOrders.includes(order.id)}
                                onCheckedChange={() => handleCheckboxChange(order.id)}
                                aria-label={`Select order ${order.id}`}
                                disabled={deletingOrders.has(order.id)}
                              />
                            </TableCell>
                            <TableCell className="min-w-[120px]">
                              <div className="space-y-1">
                                <div className="font-medium text-sm">{order.client.name}</div>
                                <div className="text-xs text-muted-foreground">{order.client.phone || '-'}</div>
                                {/* Mobile: Show additional info */}
                                <div className="sm:hidden space-y-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-sm border border-border/40 inline-block cursor-help">
                                          <div className="flex items-center gap-1">
                                            <div className="flex items-center gap-1">
                                              <Beaker className="h-3 w-3" />
                                              {order.orderItems.length > 1 && (
                                                <span className="bg-primary/10 text-primary text-[9px] font-medium px-1 py-0.5 rounded-full">
                                                  {order.orderItems.length}
                                                </span>
                                              )}
                                            </div>
                                            <span className="truncate max-w-[120px]">
                                              {formatOrderItemsMobile(order.orderItems)}
                                            </span>
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[280px] whitespace-pre-line">
                                        <div className="font-medium mb-1">Order Items:</div>
                                        {formatOrderItemsTooltip(order.orderItems)}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <div className="lg:hidden">
                                    {order.invoice ? (
                                      <Select
                                        value={order.invoice.status}
                                        onValueChange={(value) => handlePaymentStatusUpdate(order.id, value as InvoiceStatus)}
                                        disabled={updatingPaymentStatus === order.id}
                                      >
                                        <SelectTrigger 
                                          className="w-[80px] h-7 border-0 bg-transparent hover:bg-muted/50 text-xs"
                                          aria-label={`Change payment status for order ${order.id}`}
                                        >
                                          <SelectValue>
                                            {updatingPaymentStatus === order.id ? (
                                              <div className="flex items-center gap-1">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span className="text-xs">Updating...</span>
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-1">
                                                <div 
                                                  className={`w-1.5 h-1.5 rounded-full ${
                                                    order.invoice.status === 'PAID' ? 'bg-green-500' : 
                                                    order.invoice.status === 'DUE' ? 'bg-orange-500' : 
                                                    order.invoice.status === 'CANCELLED' ? 'bg-red-500' : 'bg-gray-500'
                                                  } flex-shrink-0`}
                                                />
                                                <span className="text-xs font-medium truncate">
                                                  {order.invoice.status === 'PAID' ? 'Paid' : 
                                                   order.invoice.status === 'DUE' ? 'Due' : 
                                                   order.invoice.status === 'CANCELLED' ? 'Cancelled' : order.invoice.status}
                                                </span>
                                              </div>
                                            )}
                                          </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="min-w-[120px]">
                                          {Object.values(InvoiceStatus).map((status) => (
                                            <SelectItem 
                                              key={status} 
                                              value={status}
                                              className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
                                            >
                                              <div className="flex items-center gap-2 w-full">
                                                <div 
                                                  className={`w-2 h-2 rounded-full ${
                                                    status === 'PAID' ? 'bg-green-500' : 
                                                    status === 'DUE' ? 'bg-orange-500' : 
                                                    status === 'CANCELLED' ? 'bg-red-500' : 'bg-gray-500'
                                                  }`}
                                                />
                                                <span className="flex-1">
                                                  {status === 'PAID' ? 'Paid' : 
                                                   status === 'DUE' ? 'Due' : 
                                                   status === 'CANCELLED' ? 'Cancelled' : status}
                                                </span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Badge 
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        No Invoice
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="w-[140px] max-w-[140px] hidden sm:table-cell">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div 
                                      className="bg-muted/30 px-2 py-1.5 rounded-md border border-border/40 cursor-help hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                                      tabIndex={0}
                                      role="button"
                                      aria-label={`Order items: ${formatOrderItems(order.orderItems)}. Click for details.`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <Beaker className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                                          {order.orderItems.length > 1 && (
                                            <span 
                                              className="bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                              aria-label={`${order.orderItems.length} different tests`}
                                            >
                                              {order.orderItems.length}
                                            </span>
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs font-medium truncate" title={formatOrderItems(order.orderItems)}>
                                            {formatOrderItems(order.orderItems)}
                                          </div>
                                          {order.orderItems.length > 1 && (
                                            <div className="text-[10px] text-muted-foreground">
                                              {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} total samples
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[300px] whitespace-pre-line">
                                    <div className="font-medium mb-2">Order Items:</div>
                                    {formatOrderItemsTooltip(order.orderItems)}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className="min-w-[130px] hidden md:table-cell">
                              <div className="text-sm truncate max-w-[110px]" title={formatSampleDetails(order.samples)}>
                                {formatSampleDetails(order.samples)}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[100px]">
                              <div className="font-medium text-sm">৳{order.totalAmount.toFixed(2)}</div>
                            </TableCell>
                            <TableCell className="min-w-[110px] hidden lg:table-cell">
                              <div className="flex items-center">
                                {order.invoice ? (
                                  <Select
                                    value={order.invoice.status}
                                    onValueChange={(value) => handlePaymentStatusUpdate(order.id, value as InvoiceStatus)}
                                    disabled={updatingPaymentStatus === order.id}
                                  >
                                    <SelectTrigger 
                                      className="w-[100px] h-9 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 data-[state=open]:bg-muted/50 transition-colors duration-200"
                                      aria-label={`Change payment status for order ${order.id}`}
                                    >
                                      <SelectValue>
                                        {updatingPaymentStatus === order.id ? (
                                          <div className="flex items-center gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            <span className="text-xs">Updating...</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <div 
                                              className={`w-2 h-2 rounded-full ${
                                                order.invoice.status === 'PAID' ? 'bg-green-500' : 
                                                order.invoice.status === 'DUE' ? 'bg-orange-500' : 
                                                order.invoice.status === 'CANCELLED' ? 'bg-red-500' : 'bg-gray-500'
                                              } animate-pulse-slow flex-shrink-0`}
                                              aria-hidden="true"
                                            />
                                            <span className="text-sm font-medium truncate max-w-[60px]">
                                              {order.invoice.status === 'PAID' ? 'Paid' : 
                                               order.invoice.status === 'DUE' ? 'Due' : 
                                               order.invoice.status === 'CANCELLED' ? 'Cancelled' : order.invoice.status}
                                            </span>
                                          </div>
                                        )}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="min-w-[140px]">
                                      {Object.values(InvoiceStatus).map((status) => (
                                        <SelectItem 
                                          key={status} 
                                          value={status}
                                          className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
                                        >
                                          <div className="flex items-center gap-2 w-full">
                                            <div 
                                              className={`w-2 h-2 rounded-full ${
                                                status === 'PAID' ? 'bg-green-500' : 
                                                status === 'DUE' ? 'bg-orange-500' : 
                                                status === 'CANCELLED' ? 'bg-red-500' : 'bg-gray-500'
                                              }`}
                                              aria-hidden="true"
                                            />
                                            <span className="flex-1">
                                              {status === 'PAID' ? 'Paid' : 
                                               status === 'DUE' ? 'Due' : 
                                               status === 'CANCELLED' ? 'Cancelled' : status}
                                            </span>
                                            {status === order.invoice?.status && (
                                              <CheckCircle2 className="h-3 w-3 text-primary ml-auto" />
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge 
                                    variant="outline"
                                    className="flex items-center gap-1 text-xs"
                                  >
                                    <div 
                                      className="w-2 h-2 rounded-full bg-gray-500"
                                      aria-hidden="true"
                                    />
                                    <span className="font-medium">No Invoice</span>
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[140px]">
                              <div className="flex items-center">
                                <Select
                                  value={order.status}
                                  onValueChange={(value) => handleStatusUpdate(order.id, value as OrderStatus)}
                                  disabled={updatingStatus === order.id}
                                >
                                  <SelectTrigger 
                                    className="w-[120px] sm:w-[130px] h-9 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 data-[state=open]:bg-muted/50 transition-colors duration-200"
                                    aria-label={`Change status for order ${order.id}`}
                                  >
                                    <SelectValue>
                                      {updatingStatus === order.id ? (
                                        <div className="flex items-center gap-1">
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          <span className="text-xs">Updating...</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <div 
                                            className={`w-2 h-2 rounded-full ${getStatusColor(order.status)} animate-pulse-slow flex-shrink-0`}
                                            aria-hidden="true"
                                          />
                                          <span className="text-sm font-medium truncate max-w-[80px]">
                                            {getStatusText(order.status)}
                                          </span>
                                        </div>
                                      )}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent className="min-w-[180px]">
                                    {Object.values(OrderStatus).map((status) => (
                                      <SelectItem 
                                        key={status} 
                                        value={status}
                                        className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
                                      >
                                        <div className="flex items-center gap-2 w-full">
                                          <div 
                                            className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}
                                            aria-hidden="true"
                                          />
                                          <span className="flex-1">{getStatusText(status)}</span>
                                          {status === order.status && (
                                            <CheckCircle2 className="h-3 w-3 text-primary ml-auto" />
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[120px]">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleView(order.id)}
                                  className="h-8 px-2 text-xs"
                                  title={order.invoice?.id ? "View Invoice" : "View Order Details"}
                                >
                                  <Eye className="h-3 w-3 sm:mr-1" />
                                  <span className="hidden sm:inline">
                                    {order.invoice?.id ? "Invoice" : "Details"}
                                  </span>
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => setOrderToDelete(order.id)}
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
        open={selectedOrdersToDelete.length > 0 || !!orderToDelete} 
        onOpenChange={() => {
          setSelectedOrdersToDelete([])
          setOrderToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {orderToDelete 
                ? "Delete Order"
                : `Delete Selected Orders`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {orderToDelete 
                ? "Are you sure you want to delete this order? This action cannot be undone and will permanently remove the order from the system."
                : `Are you sure you want to delete ${selectedOrdersToDelete.length} selected order(s)? This action cannot be undone and will permanently remove the orders from the system.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (orderToDelete) {
                  handleSingleDelete(orderToDelete)
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

      <OrderView 
        order={viewOrder}
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
      />

    </>
  )
}

export default OrderList