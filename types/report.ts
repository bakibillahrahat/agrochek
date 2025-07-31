import { Sample } from "./Sample"
import { ClientType } from "@/lib/generated/prisma-client"

export interface Report {
  client: {
    id: string
    name: string
    phone: string
    address?: string
    clientType: ClientType
  }
  createdAt: string
  order: any
  invoiceId: string
  id: string
  reportType: string
  reportNumber: string
  issueDate: string
  status: string
  recommendations: string | null
  notes: string | null
  samples: Sample[]
} 