'use client'

import { useParams } from 'next/navigation'
import { InvoiceView } from '@/components/invoice/InvoiceView'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function InvoicePage() {
  const params = useParams()
  const router = useRouter()

  return (
    <div>
      <Button
          onClick={() => router.push('/dashboard/orders')}
          className="flex items-center gap-2 m-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Button>
        <InvoiceView id={params.id as string} />
      </div>
  )
} 