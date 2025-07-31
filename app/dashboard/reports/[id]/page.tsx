import ReportView from '@/components/reeports/ReportView'
import React from 'react'

interface PageProps {
  context: any
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page(context: any) {
  const params = await context.params;
  const id  = params.id
  
  return (
    <div className='p-4'>
      <ReportView reportId={id} />
    </div>
  )
}