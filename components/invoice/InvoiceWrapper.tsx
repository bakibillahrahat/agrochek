"use client"
import React, { useEffect, useState } from 'react'
import InvoiceDataTable from './InvoiceDataTable'
import { toast } from 'sonner'

interface Invoice {
  id: string
  orderId: string
  totalAmount: number
  status: 'PAID' | 'DUE' | 'CANCELLED'
  createdAt: Date
  order: {
    client: {
      name: string
      phone: string
    }
  }
}

const InvoiceWrapper = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])

  const fetchInvoices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/invoice', {
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
        throw new Error(errorData.message || 'Failed to fetch invoices')
      }

      const data = await response.json()
      setInvoices(data)
      setRetryCount(0) // Reset retry count on success
    } catch (error) {
      console.error('Error fetching invoices:', error)
      if (error instanceof Error && error.message.includes("Unable to connect to the database")) {
        toast.error("Database connection error. Please try again later.")
        // Implement retry logic
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
            fetchInvoices()
          }, 5000) // Retry after 5 seconds
        }
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to fetch invoices')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoice?id=${invoiceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error === "Database connection error") {
          throw new Error("Unable to connect to the database. Please try again later.")
        }
        throw new Error(errorData.message || 'Failed to delete invoice')
      }

      toast.success('Invoice deleted successfully')
      fetchInvoices()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete invoice')
    }
  }

  const handleUpdateInvoiceStatus = async (id: string, status: 'PAID' | 'DUE' | 'CANCELLED') => {
    try {
      const response = await fetch(`/api/invoice/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to update invoice status'
        try {
          const errorData = await response.json()
          if (errorData.error === "Database connection error") {
            errorMessage = "Unable to connect to the database. Please try again later."
          } else if (errorData.error === "Invoice not found") {
            errorMessage = "Invoice not found. It may have been deleted."
          } else if (errorData.error === "Invalid status") {
            errorMessage = "Invalid status value provided."
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          // If response is not JSON, use the status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const updatedInvoice = await response.json()
      setInvoices((prev) =>
        prev.map((invoice) =>
          invoice.id === id ? { ...invoice, ...updatedInvoice } : invoice
        )
      )
      toast.success('Invoice status updated successfully')
    } catch (error) {
      console.error('Error updating invoice status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update invoice status')
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [retryCount]) // Add retryCount as a dependency

  return (
    <InvoiceDataTable 
      initialInvoices={invoices}
      onDelete={handleDeleteInvoice}
      onStatusUpdate={handleUpdateInvoiceStatus}
      isLoading={isLoading}
      selectedInvoices={selectedInvoices}
      onSelectionChange={setSelectedInvoices}
    />
  )
}

export default InvoiceWrapper 