'use client'

import React from 'react'
import { Report } from '@/types/report'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import ReportHeader from '@/components/common/ReportHeader'
import { useInstitute } from '@/components/frontend-api/institute'
import ReportSignature from '@/components/common/ReportSignature'
import { numberToBangla, toBanglaNumber, translateSampleType, translateTestElement, translateUnit } from '@/lib/translations'
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/ui/table'

interface FertilizerReportViewProps {
  report: Report
}

const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return toBanglaNumber(date.toLocaleDateString('bn-BD'))
}

const FertilizerReportView: React.FC<FertilizerReportViewProps> = ({ report }) => {
  const { institute } = useInstitute()
  
  const ITEMS_PER_PAGE = 5; // 5 samples per page for optimal layout
  const totalPages = Math.ceil(report.samples.length / ITEMS_PER_PAGE)

  const renderPage = (pageNumber: number) => {
    const pageStartIndex = (pageNumber - 1) * ITEMS_PER_PAGE
    const pageEndIndex = pageStartIndex + ITEMS_PER_PAGE
    const pageSamples = report.samples.slice(pageStartIndex, pageEndIndex)

    return (
      <Card 
        key={pageNumber} 
        className="report-page w-[297mm] min-h-[210mm] mx-auto font-bangla bg-white shadow-lg pt-8 px-4 mb-4 border-0"
        style={{ 
          pageBreakAfter: 'always',
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact'
        }}
      >
        <div className="absolute top-2 right-4">
          <p className="text-xs font-bold text-black">
            পৃষ্ঠা: {toBanglaNumber(pageNumber)}/{toBanglaNumber(totalPages)}
          </p>
        </div>
        
        <CardHeader className="text-center px-8 pb-4">
          <ReportHeader instituteName={institute?.name} instituteAddress={institute?.address} />
          <div className="flex justify-between mt-4">
            <div className="space-y-1 w-full">
              <p className='text-sm font-medium my-2 text-black'>
                {report.client?.name} {report?.client?.address} কর্তৃক প্রেরিত {translateSampleType(report.samples?.[0]?.sampleType || '')} নমুনার রাসায়নিক বিশ্লেষণী ফি এর বিল
              </p>
              <div className="flex flex-col gap-2 items-start mt-2">
                <p className="text-xs font-medium text-black">
                  সূত্রঃ স্মারক নং- {report.reportNumber}; তারিখঃ {formatDate(report.issueDate)} খ্রি: !
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-4">
          <div className="overflow-visible">
            <Table className="border-collapse border-black">
              <TableHeader>
                <TableRow className='border border-black'>
                  <TableHead className="w-[50px] border-r border-black text-black text-xs font-bold p-2">
                    ক্রমিক<br/>নং
                  </TableHead>
                  <TableHead className='w-[100px] border-r border-black text-center text-black text-xs font-bold p-2'>
                    নমুনার<br/>আইডি নং
                  </TableHead>
                  <TableHead className='w-[120px] border-r border-black text-center text-black text-xs font-bold p-2'>
                    সারের নাম
                  </TableHead>
                  <TableHead className='w-[200px] border-r border-black text-center text-black text-xs font-bold p-2'>
                    পরীক্ষায় প্রাপ্ত ফলাফল
                  </TableHead>
                  <TableHead className="w-[200px] text-center border-r border-black text-black text-xs font-bold p-2">
                    সরকারি বিনির্দেশ
                  </TableHead>
                  <TableHead className="w-[200px] text-center border-black text-black text-xs font-bold p-2">
                    মন্তব্য
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='border-b border-r border-l border-black'>
                {pageSamples.map((sample, idx) => (
                  <TableRow key={sample.id} className="border-black">
                    <TableCell className='border-r border-black text-black text-xs p-2 vertical-align-top'>
                      {toBanglaNumber(pageStartIndex + idx + 1)}
                    </TableCell>
                    <TableCell className='border-r border-black text-center text-black text-xs p-2 vertical-align-top'>
                      {translateSampleType(sample?.sampleIdNumber)}
                    </TableCell>
                    <TableCell className='border-r border-black text-center text-black text-xs p-2 vertical-align-top'>
                      {translateTestElement(sample.orderItem?.agroTest?.name)}
                    </TableCell>
                    <TableCell className='border-r border-black text-center text-black text-xs p-2 vertical-align-top'>
                      {sample.orderItem?.orderTestParameters?.map((param: any) => (
                        <div key={param.id} className='text-left mb-1'>
                          মোট {param.testParameter.name}, ওজন ভিত্তিক: {numberToBangla(param.testResults?.value) || 0}{param.testParameter.unit}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className='border-r border-black text-center text-black text-xs p-2 vertical-align-top'>
                      {sample.orderItem?.orderTestParameters?.map((param: any) => (
                        <div key={param.id} className='text-left mb-1'>
                          {param.testParameter.comparisonRules?.map((rule: any, ruleIdx: any) => {
                            return (
                              <div key={ruleIdx} className="mb-1">
                                {rule.type?.trim() === 'BETWEEN' ? (
                                  `মোট ${param.testParameter.name}, ওজন ভিত্তিক: ${numberToBangla(rule.min)} - ${numberToBangla(rule.max)} ${translateUnit(param.testParameter.unit)} মধ্যে`
                                ) : rule.type?.trim() === 'GREATER_THAN' ? (
                                  `মোট ${param.testParameter.name}, ওজন ভিত্তিক(সর্বোচ্চ): > ${numberToBangla(rule.min)} ${translateUnit(param.testParameter.unit)}`
                                ) : rule.type?.trim() === 'LESS_THAN' ? (
                                  `মোট ${param.testParameter.name}, ওজন ভিত্তিক(সর্বনিম্ন): < ${numberToBangla(rule.max)} ${translateUnit(param.testParameter.unit)}`
                                ) : (
                                  `মোট ${param.testParameter.name}, ওজন ভিত্তিক(সর্বনিম্ন): ${numberToBangla(rule.min)} ${translateUnit(param.testParameter.unit)}`
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className='border-r border-black text-center text-black text-xs p-2 vertical-align-top'>
                      {(() => {
                        // Check if all test results have interpretation "ভেজালমুক্ত"
                        const allInterpretationsClean = sample.orderItem?.orderTestParameters?.every((param: any) => {
                          return param.testResults?.interpretation === 'ভেজালমুক্ত';
                        });
                        
                        // Show "-" if all interpretations are "ভেজালমুক্ত"
                        return allInterpretationsClean ? '-' : (
                          <div className="text-left">
                            <div className="mb-1">সার (ব্যবস্থাপনা) আইন ২০০৬</div>
                            <div>ধারা-১৭(২)(ঘ) মোতাবেক নমুনা<br/>একটি {translateTestElement(sample.orderItem?.agroTest?.name)} ভেজাল সার।</div>
                          </div>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Add analysis type information on the last page bottom-left */}
          {pageNumber === totalPages ? (
            <div className="flex justify-between items-end mt-8">
              <div className="text-xs text-black">
                <p className="font-bold mb-2">বিশ্লেষণ পদ্ধতি:</p>
                {(() => {
                  // Group test parameters by analysis type
                  const analysisTypeGroups: { [key: string]: string[] } = {};
                  
                  report.samples.forEach(sample => {
                    sample.orderItem?.orderTestParameters?.forEach((param: any) => {
                      const analysisType = param.testParameter?.analysisType;
                      const paramName = param.testParameter?.name;
                      
                      if (analysisType && paramName) {
                        if (!analysisTypeGroups[analysisType]) {
                          analysisTypeGroups[analysisType] = [];
                        }
                        if (!analysisTypeGroups[analysisType].includes(paramName)) {
                          analysisTypeGroups[analysisType].push(paramName);
                        }
                      }
                    });
                  });
                  
                  return Object.entries(analysisTypeGroups).map(([analysisType, paramNames], index) => (
                    <p key={index} className="text-xs mb-1">
                      {paramNames.join(', ')}: {analysisType.charAt(0).toUpperCase() + analysisType.slice(1).toLowerCase().replace(/_/g, ' ')}
                    </p>
                  ));
                })()}
              </div>
              <div className="flex flex-col gap-[1.5px] items-end">
                <ReportSignature issuedBy={institute?.issuedby} phone={institute?.phone} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-[1.5px] items-end mt-6">
              <ReportSignature issuedBy={institute?.issuedby} phone={institute?.phone} />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="fertilizer-report-container">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => renderPage(pageNumber))}
      
      <style jsx>{`
        .fertilizer-report-container {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        
        .vertical-align-top {
          vertical-align: top;
        }
        
        @media print {
          .report-page {
            margin: 0;
            box-shadow: none;
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  )
}

export default FertilizerReportView