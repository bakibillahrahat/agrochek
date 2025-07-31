"use client"
import { OrderStatus, InvoiceStatus } from '@/lib/generated/prisma-client'
import React, { useEffect, useState } from 'react'
import OrderList from './OrderList'
import { toast } from 'sonner'

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

interface AgroTest {
  id: string
  name: string
  price: number
}

const OrderWrapper = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [availableAgroTests, setAvailableAgroTests] = useState<AgroTest[]>([])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/orders', {
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
        throw new Error(errorData.message || 'Failed to fetch orders')
      }

      const data = await response.json()
      setOrders(data)
      setRetryCount(0) // Reset retry count on success
    } catch (error) {
      console.error('Error fetching orders:', error)
      if (error instanceof Error && error.message.includes("Unable to connect to the database")) {
        toast.error("Database connection error. Please try again later.")
        // Implement retry logic
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
            fetchOrders()
          }, 5000) // Retry after 5 seconds
        }
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch orders')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAgroTests = async () => {
    try {
      const response = await fetch('/api/agrotest')
      if (!response.ok) {
        throw new Error('Failed to fetch agro tests')
      }
      const data = await response.json()
      setAvailableAgroTests(data)
    } catch (error) {
      console.error('Error fetching agro tests:', error)
      toast.error('Failed to fetch agro tests')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error === "Database connection error") {
          throw new Error("Unable to connect to the database. Please try again later.")
        }
        throw new Error(errorData.message || 'Failed to delete order')
      }

      toast.success('Order deleted successfully')
      fetchOrders()
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete order')
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error === "Database connection error") {
          throw new Error("Unable to connect to the database. Please try again later.")
        }
        throw new Error(errorData.message || 'Failed to update order status')
      }

      toast.success('Order status updated successfully')
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update order status')
    }
  }

  const handleUpdatePaymentStatus = async (orderId: string, newStatus: InvoiceStatus) => {
    try {
      const response = await fetch('/api/invoice', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (jsonError) {
          // If response is not valid JSON, create a generic error
          errorData = { error: "Server error", message: `HTTP ${response.status} - ${response.statusText}` }
        }
        
        if (errorData.error === "Database connection error") {
          throw new Error("Unable to connect to the database. Please try again later.")
        }
        throw new Error(errorData.message || 'Failed to update payment status')
      }

      toast.success('Payment status updated successfully')
      fetchOrders()
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update payment status')
    }
  }

  const handleAddTests = async (orderId: string, items: Array<{ agroTestId: string; quantity: number }>) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderId,
          orderItems: items.map(item => {
            const test = availableAgroTests.find(t => t.id === item.agroTestId)
            return {
              agroTestId: item.agroTestId,
              quantity: item.quantity,
              unitPrice: test?.price || 0,
              subtotal: (test?.price || 0) * item.quantity,
              testParameters: []
            }
          })
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error === "Database connection error") {
          throw new Error("Unable to connect to the database. Please try again later.")
        }
        throw new Error(errorData.message || 'Failed to add tests to order')
      }

      toast.success('Tests added to order successfully')
      fetchOrders()
    } catch (error) {
      console.error('Error adding tests to order:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add tests to order')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedOrders.length === 0) {
      toast.error("No orders selected");
      return;
    }

    try {
      // Delete orders in parallel
      await Promise.all(
        selectedOrders.map(orderId => 
          fetch(`/api/orders?id=${orderId}`, {
            method: 'DELETE',
          })
        )
      );

      toast.success(`${selectedOrders.length} orders deleted successfully`);
      setSelectedOrders([]); // Clear selection
      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error('Error deleting orders:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete orders');
    }
  };

  useEffect(() => {
    fetchOrders()
    fetchAgroTests()
  }, [retryCount]) // Add retryCount as a dependency

  return (
    <div className="w-full max-w-full overflow-hidden">
      <OrderList 
        initialOrders={orders.map(order => ({
          ...order,
          orderItems: order.orderItems.map(item => ({
            ...item,
            unitPrice: item.unitPrice || 0,
            subtotal: item.subtotal || 0
          }))
        }))}
        onDelete={handleDeleteOrder}
        onStatusUpdate={handleUpdateOrderStatus}
        onPaymentStatusUpdate={handleUpdatePaymentStatus}
        onAddTests={handleAddTests}
        isLoading={isLoading}
        selectedOrders={selectedOrders}
        onSelectionChange={setSelectedOrders}
        availableAgroTests={availableAgroTests}
      />
    </div>
  )
}

export default OrderWrapper