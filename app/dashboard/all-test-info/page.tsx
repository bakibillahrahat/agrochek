'use client'

import React, { useState, useEffect } from 'react'
import { AgroTest } from '@/app/types/agrotest'
import AgroTestTableWrapper from '@/components/agrotests/AgroTestTableWrapper'
import { toast } from 'sonner'
import { Skeleton } from "@/components/ui/skeleton"

const AllTestInfoPage = () => {
  const [agrotests, setAgrotests] = useState<AgroTest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAgroTests = async () => {
    try {
      const response = await fetch('/api/agrotest', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = typeof data === 'object' && data !== null && 'message' in data 
          ? data.message 
          : 'Failed to fetch agro tests'
        throw new Error(errorMessage)
      }
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format')
      }
      
      setAgrotests(data)
    } catch (error) {
      console.error('Error fetching agro tests:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch agro tests')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgroTests()
  }, [])

  return (
    <div className='p-4'>
      {isLoading ? (
        <div className="rounded-md border">
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <AgroTestTableWrapper data={agrotests} />
      )}
    </div>
  )
}

export default AllTestInfoPage