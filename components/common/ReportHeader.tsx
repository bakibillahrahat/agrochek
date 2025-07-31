'use client'

import React from 'react'

interface ReportHeaderProps {
  instituteName?: string;
  instituteAddress?: string;
}

const ReportHeader = ({ instituteName, instituteAddress }: ReportHeaderProps) => {
  return (
    <div>
        <h2 className="text-md font-medium text-black">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</h2>
          <p className="text-md font-medium text-black">কৃষি মন্ত্রণালয়</p>
          <p className="text-md font-medium text-black">মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট</p>
          {instituteName && instituteAddress && (
            <p className="text-md font-medium text-black">{instituteName},{instituteAddress}।</p>
          )}
          <p className="text-md font-medium text-black">http://srdilabjessore.gov.bd</p>
    </div>
  )
}

export default ReportHeader