import { SampleType, ClientType } from "@/lib/generated/prisma-client"

export interface Invoice {
    id: string
    orderId: string
    totalAmount: number
    status: 'PAID' | 'DUE' | 'CANCELLED'
    createdAt: string | Date
    order?: {
      sarokNumber: string
      client?: {
        name: string
        phone: string
        address: string
        clientType: ClientType
      }
      samples?: {
        id: string
        sampleType: SampleType
        sampleIdNumber: string
      }[]
      orderItems?: {
        id: string
        agroTest: {
          id: string
          name: string
        }
        quantity: number
        unitPrice: number
        subtotal: number
        orderTestParameters: {
          testParameter: {
            id: string
            name: string
            pricing: {
              id: string
              clientType: string
              price: number
            }[]
          }
        }[]
      }[]
    }
  }