'use client'

import React from 'react'
import { Report } from '@/types/report'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import ReportHeader from '@/components/common/ReportHeader'
import { useInstitute } from '@/components/frontend-api/institute'
import ReportSignature from '@/components/common/ReportSignature'
import { toBanglaNumber, translateSampleType, translateTestElement, translateAnalysisType } from '@/lib/translations'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface WaterReportViewProps {
  report: Report
}

const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return toBanglaNumber(date.toLocaleDateString('bn-BD'))
}

const WaterReportView: React.FC<WaterReportViewProps> = ({ report }) => {
  const { institute } = useInstitute();
  
  // Calculate samples per page based on whether they have interpretations
  const SAMPLES_PER_PAGE = 3; // 3 samples per page (each sample can have 1-2 rows)
  const totalSamples = report.samples?.length || 0;
  const totalPages = Math.ceil(totalSamples / SAMPLES_PER_PAGE);

  // Get samples for a specific page
  const getSamplesForPage = (pageNumber: number) => {
    const startIndex = (pageNumber - 1) * SAMPLES_PER_PAGE;
    const endIndex = startIndex + SAMPLES_PER_PAGE;
    return report.samples?.slice(startIndex, endIndex) || [];
  };

  const hasInterpretations = (sample: any) => {
    return sample.orderItem?.orderTestParameters?.some((param: any) => {
      const testResult = sample.testResults?.find((tr: any) => tr.testParamater.id === param.testParameter.id);
      return testResult?.interpretation;
    });
  };

  const renderPage = (pageNumber: number) => {
    const pageSamples = getSamplesForPage(pageNumber);

    return (
      <Card 
        key={pageNumber} 
        className='report-page w-[297mm] min-h-[210mm] mx-auto font-bangla bg-white shadow-lg pt-8 px-4 mb-4 border-0'
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
        
        <CardHeader className='text-center px-8 pb-4'>
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
        
        <CardContent className='space-y-4 px-4'>
          <div className="overflow-visible">
            <Table className="border-collapse border-black">
              <TableHeader>
                <TableRow className='border-l border-r border-t border-black'>
                  <TableHead rowSpan={3} className='border-r border-black text-black text-xs font-bold p-2 vertical-align-middle'>
                    আইডি নম্বর
                  </TableHead>
                  <TableHead rowSpan={3} className='border-r border-black text-center text-black text-xs font-bold p-2 vertical-align-middle'>
                    প্রেরণকারী প্রদত্ত<br/> সনাক্তকরণ <br/>নম্বর/নাম
                  </TableHead>
                  <TableHead 
                    className='border-r border-black text-center text-black text-xs font-bold p-2' 
                    colSpan={report.samples?.[0]?.orderItem?.orderTestParameters?.length || 0}
                  >
                    বিশ্লেষিত ফলাফল
                  </TableHead>
                </TableRow>
                <TableRow className='border-l border-black'>
                  {report.samples?.[0]?.orderItem?.orderTestParameters?.map((param) => (
                    <TableHead key={param.id} className='border-r border-black text-center text-black text-xs font-bold p-2'>
                      {param.testParameter.name}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow className='border-l border-r border-b border-black'>
                  {report.samples?.[0]?.orderItem?.orderTestParameters?.map((param) => (
                    <TableHead key={param.id} className='border-r border-black text-center text-black text-xs font-bold p-2'>
                      {param.testParameter.unit}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className='border-b border-r border-l border-black'>
                {pageSamples.map((sample) => {
                  const showInterpretations = hasInterpretations(sample);
                  return (
                    <React.Fragment key={sample.id}>
                      <TableRow className='border-black'>
                        <TableCell 
                          rowSpan={showInterpretations ? 2 : 1} 
                          className='border-r border-black text-black text-xs p-2 vertical-align-top'
                        >
                          {sample.sampleIdNumber}
                        </TableCell>
                        <TableCell 
                          rowSpan={showInterpretations ? 2 : 1} 
                          className='border-r border-black text-black text-xs p-2 vertical-align-top'
                        >
                          {report.client?.name}
                        </TableCell>
                        {sample.orderItem?.orderTestParameters?.map((param) => {
                          const testResult = sample.testResults?.find(tr => tr.testParamater.id === param.testParameter.id);
                          return (
                            <TableCell key={param.id} className='border-r border-black text-center text-black text-xs p-2'>
                              {testResult?.value || '-'}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {showInterpretations && (
                        <TableRow className='border-black'>
                          {sample.orderItem?.orderTestParameters?.map((param) => {
                            const testResult = sample.testResults?.find(tr => tr.testParamater.id === param.testParameter.id);
                            return (
                              <TableCell key={param.id} className='border-r border-black text-center text-black text-xs p-2'>
                                {testResult?.interpretation || '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {/* Analysis Type Information - Show only on the last page */}
          {pageNumber === totalPages && (
            <div className="flex justify-between items-end mt-6">
              <div className="text-left">
                <p className="text-xs font-bold text-black mb-2">বিশ্লেষণ প্রকার:</p>
                {(() => {
                  // Group test parameters by analysis type
                  const parametersByAnalysisType = new Map<string, Set<string>>();
                  report.samples.forEach(sample => {
                    sample.orderItem?.orderTestParameters?.forEach(param => {
                      const analysisType = param.testParameter.analysisType || 'ROUTINE';
                      const paramName = param.testParameter.name;
                      
                      if (!parametersByAnalysisType.has(analysisType)) {
                        parametersByAnalysisType.set(analysisType, new Set<string>());
                      }
                      parametersByAnalysisType.get(analysisType)!.add(paramName);
                    });
                  });
                  
                  // Convert to array and display grouped by analysis type
                  return Array.from(parametersByAnalysisType.entries()).map(([analysisType, paramNames], index) => (
                    <p key={index} className="text-xs text-black mb-1">
                      {Array.from(paramNames).map(name => translateTestElement(name)).join(', ')}: {translateAnalysisType(analysisType)}
                    </p>
                  ));
                })()}
              </div>
              <div className="flex flex-col gap-[1.5px] items-end">
                <ReportSignature issuedBy={institute?.issuedby} phone={institute?.phone} />
              </div>
            </div>
          )}
          
          {/* Regular signature placement for non-last pages */}
          {pageNumber !== totalPages && (
            <div className="flex flex-col gap-[1.5px] items-end mt-6">
              <ReportSignature issuedBy={institute?.issuedby} phone={institute?.phone} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="water-report-container">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => renderPage(pageNumber))}
      
      <style jsx>{`
        .water-report-container {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        
        .vertical-align-middle {
          vertical-align: middle;
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
  );
};

export default WaterReportView