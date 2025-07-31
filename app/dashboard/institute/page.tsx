"use client"

import { InstituteDisplay } from '@/components/settings/instituteDisplay'
import React from 'react'

const page = () => {
  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10'>
      <InstituteDisplay />
    </div>
  )
}

export default page