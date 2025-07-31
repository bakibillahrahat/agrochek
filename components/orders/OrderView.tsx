import React from 'react'
import { OrderStatus } from '@/lib/generated/prisma-client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Package, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  TestTube2,
  ClipboardList
} from 'lucide-react'

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
    agroTest: {
      id: string
      name: string
    }
    unitPrice: number
    subtotal: number
  }>
}

interface OrderViewProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
}

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return "bg-yellow-100 text-yellow-800"
    case OrderStatus.IN_PROGRESS:
      return "bg-blue-100 text-blue-800"
    case OrderStatus.COMPLETED:
      return "bg-green-100 text-green-800"
    case OrderStatus.CANCELLED:
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const OrderView = ({ order, isOpen, onClose }: OrderViewProps) => {
  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Order Details</DialogTitle>
            <Badge className={`text-sm px-3 py-1 ${getStatusColor(order.status)}`}>
              {order.status}
            </Badge>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6 p-4">
            {/* Order Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[200px]">Test Name</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Quantity</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-right">Rate per Test</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-right">Fee</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {order.orderItems.map((item) => (
                          <tr key={item.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle font-medium">{item.agroTest.name}</td>
                            <td className="p-4 align-middle">{item.quantity}</td>
                            <td className="p-4 align-middle text-right">৳{item.unitPrice.toFixed(2)}</td>
                            <td className="p-4 align-middle text-right">৳{item.subtotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">Subtotal</p>
                    <p className="font-medium">৳{order.totalAmount.toFixed(2)}</p>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold">Total</p>
                    <p className="text-lg font-bold">৳{order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default OrderView 