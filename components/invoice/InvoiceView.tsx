'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pricing, SampleType, ClientType } from '@/lib/generated/prisma-client'
import { numberToBanglaWords, translateSampleType, translateTestElement } from '@/lib/translations'
import { Invoice } from '@/types/invoice'
import ReportHeader from '@/components/common/ReportHeader'
import ReportSignature from '@/components/common/ReportSignature'
import { useInstitute } from '../frontend-api/institute'


interface Client {
  id: string
  name: string
  phone: string
  address: string
  clientType: ClientType
}
interface OrderItem {
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
}

interface Order {
  id: string
  client: Client
  items: OrderItem[]
  samples?: {
    id: string
    sampleType: SampleType
    sampleIdNumber: string
  }[]
}




const toBanglaNumber = (num: number | string): string =>
  String(num).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)])

interface InvoiceViewProps {
  id: string
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ id }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const { institute } = useInstitute()

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoice/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch invoice')
        }
        const data = await response.json()
        setInvoice(data)
      } catch (error) {
        console.error('Error fetching invoice:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [id])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!invoice) {
    return <div className="flex items-center justify-center min-h-screen">Invoice not found</div>
  }

  const formatDate = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return toBanglaNumber(date.toLocaleDateString('bn-BD'))
  }

  const calculateItemTotal = (quantity: number, price: number): string => {
    return toBanglaNumber((quantity * price).toFixed(2))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500'
      case 'DUE':
        return 'bg-yellow-500'
      case 'CANCELLED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PAID':
        return 'পরিশোধিত'
      case 'DUE':
        return 'বাকি'
      case 'CANCELLED':
        return 'বাতিল'
      default:
        return status
    }
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen ">
      <Card className="w-[210mm] min-h-[297mm] mx-auto font-bangla bg-white shadow-lg pt-24 px-6">
        <CardHeader className="text-center px-8">
          <ReportHeader instituteName={institute?.name} instituteAddress={institute?.address} />
          <p className='text-md font-medium my-2 text-black'>{invoice.order?.client?.name} {invoice.order?.client?.address} কর্তৃক প্রেরিত {translateSampleType(invoice.order?.samples?.[0]?.sampleType || '')} নমুনার রাসায়নিক বিশ্লেষণী ফি এর বিল</p>
          <p className='text-md font-medium text-black'>( নমুনা আইডি নং- {invoice.order?.samples?.[0]?.sampleIdNumber} - {invoice.order?.samples?.[invoice.order.samples.length - 1]?.sampleIdNumber})</p>
        </CardHeader>
        
        <CardContent className="space-y-6 px-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium text-black">সূত্রঃ স্মারক নং-  {invoice.order?.sarokNumber || ''} ; তারিখঃ {invoice.createdAt ? formatDate(invoice.createdAt) : ''} খ্রি.।</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className='border border-black'>
                <TableHead className="w-[80px] border-r border-black text-black">ক্রমিক<br/>নং</TableHead>
                <TableHead className='border-r border-black text-center text-black'>নমুনার নাম</TableHead>
                <TableHead className='border-r border-black text-center text-black'>নমুনার<br/> সংখ্যা</TableHead>
                <TableHead className='border-r border-black text-center text-black'>বিশ্লেষিত উপাদানের নাম ও সংখ্যা</TableHead>
                <TableHead className="text-center border-r border-black text-black">বিশ্লেষণী <br/>ফি এর হার<br/>(টাকা)</TableHead>
                <TableHead className="text-center border-black text-black">মোট বিশ্লেষণী ফি <br/>(টাকা)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className='border-b border-r border-l border-black'>
              {(invoice.order?.orderItems || []).map((item: OrderItem, idx: number) => (
                item.orderTestParameters.map((param, paramIdx) => (
                  <TableRow key={`${item.id}-${paramIdx}`} className="border-black">
                    {paramIdx === 0 && (
                      <>
                        <TableCell className='border-r border-black text-black' rowSpan={item.orderTestParameters.length}>
                          {toBanglaNumber(idx + 1)}
                        </TableCell>
                        <TableCell className='border-r border-black text-center text-black' rowSpan={item.orderTestParameters.length}>
                          {translateTestElement(item.agroTest.name)}
                        </TableCell>
                        <TableCell className='border-r border-black text-center text-black' rowSpan={item.orderTestParameters.length}>
                          {toBanglaNumber(item.quantity)}
                        </TableCell>
                      </>
                    )}
                    <TableCell className='border-r border-black text-black'>মোট {translateTestElement(param.testParameter.name)} - {toBanglaNumber(item.quantity)}
                    </TableCell>
                    <TableCell className='border-r border-black text-center text-black'>
                      {param.testParameter.pricing && param.testParameter.pricing.length > 0 ? (
                        (() => {
                          const clientType = invoice.order?.client?.clientType;
                          if (!clientType) {
                            return `${toBanglaNumber(0)} /-`;
                          }
                          const relevantPricing = param.testParameter.pricing.find(
                            price => price.clientType === clientType
                          );
                          return relevantPricing ? 
                            `${toBanglaNumber(relevantPricing.price)} /-` : 
                            `${toBanglaNumber(0)} /-`;
                        })()
                      ) : (
                        toBanglaNumber(0) + ' /-'
                      )}
                    </TableCell>
                    <TableCell className='border-r border-black text-right text-black'>
                      {(() => {
                        const clientType = invoice.order?.client?.clientType;
                        if (!clientType) {
                          return `${toBanglaNumber(item.quantity)} x ${toBanglaNumber(0)} = ${toBanglaNumber(0)} /-`;
                        }
                        const relevantPricing = param.testParameter.pricing.find(
                          price => price.clientType === clientType
                        );
                        const paramPrice = relevantPricing ? relevantPricing.price : 0;
                        const paramTotal = item.quantity * paramPrice;
                        return `${toBanglaNumber(item.quantity)} x ${toBanglaNumber(paramPrice)} = ${toBanglaNumber(paramTotal)} /-`;
                      })()}
                    </TableCell>
                  </TableRow>
                ))
              ))}
              <TableRow className="border-black">
                <TableCell colSpan={2} className='border-r border-black text-center text-black'>মোট</TableCell>
                <TableCell className='border-r border-black text-center text-black'>{toBanglaNumber(invoice.order?.orderItems?.reduce((acc, item) => acc + item.quantity, 0) || 0)}</TableCell>
                <TableCell colSpan={5} className='text-right border-black text-black'>টাকা &nbsp; = {toBanglaNumber(invoice.totalAmount.toFixed(2))} /- </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div>
            <p className="text-black">মোট নমুনা: {numberToBanglaWords(invoice.order?.samples?.length || 0)} টি ।  মোট বিশ্লেষণ ফি (কথায়): {numberToBanglaWords(invoice.totalAmount)} টাকা মাত্র।</p>
          </div>

          <div className="flex flex-col gap-[1.5px] items-end mt-10">
            <ReportSignature issuedBy={institute?.issuedby} phone={institute?.phone} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}