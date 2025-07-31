'use client'

import React from 'react'
import { Report } from '@/types/report'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import ReportHeader from '@/components/common/ReportHeader'
import { useInstitute } from '@/components/frontend-api/institute'
import ReportSignature from '@/components/common/ReportSignature'
import { toBanglaNumber, translateSampleType, translateTestElement, translateAnalysisType } from '@/lib/translations'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface SoilGovtReportViewProps {
  report: Report
}

const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return toBanglaNumber(date.toLocaleDateString('bn-BD'))
}

const SoilGovtReportView: React.FC<SoilGovtReportViewProps> = ({ report }) => {
  const { institute } = useInstitute();
  
  // Group samples by collection location and calculate averages for each location
  const getLocationAverages = () => {
    const locationGroups = report.samples.reduce((acc, sample) => {
      const location = sample.collectionLocation || 'Unknown Location';
      if (!acc[location]) {
        acc[location] = {
          samples: [],
          sampleIdNumbers: []
        };
      }
      acc[location].samples.push(sample);
      acc[location].sampleIdNumbers.push(sample.sampleIdNumber);
      return acc;
    }, {} as Record<string, {
      samples: typeof report.samples,
      sampleIdNumbers: string[]
    }>);

    // Calculate averages for each location
    return Object.entries(locationGroups).map(([location, data]) => {
      // Calculate average test parameter values for this location
      const testParameterAverages = new Map<string, {
        value: number,
        uplandInterpretation: string[],
        wetlandInterpretation: string[],
        count: number
      }>();

      data.samples.forEach(sample => {
        sample.testResults?.forEach(result => {
          const paramId = result.testParamater.id;
          if (!testParameterAverages.has(paramId)) {
            testParameterAverages.set(paramId, {
              value: 0,
              uplandInterpretation: [],
              wetlandInterpretation: [],
              count: 0
            });
          }
          
          const current = testParameterAverages.get(paramId)!;
          if (result.value !== null) {
            current.value += result.value;
            current.count += 1;
          }
          if (result.uplandInterpretation) {
            current.uplandInterpretation.push(result.uplandInterpretation);
          }
          if (result.wetlandInterpretation) {
            current.wetlandInterpretation.push(result.wetlandInterpretation);
          }
        });
      });

      // Calculate final averages for this location
      const finalAverages = new Map<string, {
        avgValue: number,
        mostCommonUpland: string,
        mostCommonWetland: string
      }>();

      testParameterAverages.forEach((data, paramId) => {
        const avgValue = data.count > 0 ? data.value / data.count : 0;
        
        // Get most common interpretation
        const getMostCommon = (arr: string[]) => {
          if (arr.length === 0) return '-';
          const frequency = arr.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          return Object.entries(frequency).reduce((a, b) => frequency[a[0]] > frequency[b[0]] ? a : b)[0];
        };

        finalAverages.set(paramId, {
          avgValue,
          mostCommonUpland: getMostCommon(data.uplandInterpretation),
          mostCommonWetland: getMostCommon(data.wetlandInterpretation)
        });
      });

      // Get most common vumiSrini value for this location
      const vumiSriniValues = data.samples.map(s => s.vumiSrini).filter((val): val is string => Boolean(val));
      const mostCommonVumiSrini = vumiSriniValues.length > 0 
        ? vumiSriniValues.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        : {};
      
      const commonVumiSrini = Object.keys(mostCommonVumiSrini).length > 0
        ? Object.entries(mostCommonVumiSrini).reduce((a, b) => mostCommonVumiSrini[a[0]] > mostCommonVumiSrini[b[0]] ? a : b)[0]
        : '-';

      return {
        location,
        sampleIdNumbers: data.sampleIdNumbers.join(', '),
        sampleCount: data.samples.length,
        vumiSrini: commonVumiSrini,
        testParameterAverages: finalAverages,
        firstSample: data.samples[0], // To get the orderItem structure
        samples: data.samples // Include all samples for individual display
      };
    });
  };

  const locationAverages = getLocationAverages();
  
  // Individual sample table pagination
  const samplesPerPage = 10; // Show 10 samples per page
  const totalSamples = report.samples.length;
  const totalSamplePages = Math.ceil(totalSamples / samplesPerPage);
  
  // Get samples for a specific page
  const getSamplesForPage = (pageIndex: number) => {
    const startIndex = pageIndex * samplesPerPage;
    const endIndex = startIndex + samplesPerPage;
    return report.samples.slice(startIndex, endIndex);
  };

  // Calculate pages based on number of locations (3 rows per location, adjust as needed)
  const locationsPerPage = 2; // Can fit 2 location groups per page (2 * 3 = 6 rows)
  const totalLocations = locationAverages.length;
  const totalLocationPages = Math.ceil(totalLocations / locationsPerPage);

  console.log('SoilGovtReportView - Location Averages:', {
    totalLocations,
    locationsPerPage,
    totalLocationPages,
    locations: locationAverages.map(l => l.location)
  });

  // Get location groups for a specific page
  const getLocationsForPage = (pageIndex: number) => {
    const startIndex = pageIndex * locationsPerPage;
    const endIndex = startIndex + locationsPerPage;
    return locationAverages.slice(startIndex, endIndex);
  };

  // Group samples by manchitroUnit and calculate averages for each map unit
  const getManchitroUnitAverages = () => {
    const manchitroGroups = report.samples.reduce((acc, sample) => {
      const manchitroUnit = sample.manchitroUnit?.toString() || 'অজানা';
      if (!acc[manchitroUnit]) {
        acc[manchitroUnit] = {
          samples: [],
          sampleIdNumbers: []
        };
      }
      acc[manchitroUnit].samples.push(sample);
      acc[manchitroUnit].sampleIdNumbers.push(sample.sampleIdNumber);
      return acc;
    }, {} as Record<string, {
      samples: typeof report.samples,
      sampleIdNumbers: string[]
    }>);

    // Calculate averages for each manchitro unit
    return Object.entries(manchitroGroups).map(([manchitroUnit, data]) => {
      // Calculate average test parameter values for this manchitro unit
      const testParameterAverages = new Map<string, {
        value: number,
        uplandInterpretation: string[],
        wetlandInterpretation: string[],
        count: number
      }>();

      data.samples.forEach(sample => {
        sample.testResults?.forEach(result => {
          const paramId = result.testParamater.id;
          if (!testParameterAverages.has(paramId)) {
            testParameterAverages.set(paramId, {
              value: 0,
              uplandInterpretation: [],
              wetlandInterpretation: [],
              count: 0
            });
          }
          
          const current = testParameterAverages.get(paramId)!;
          if (result.value !== null) {
            current.value += result.value;
            current.count += 1;
          }
          if (result.uplandInterpretation) {
            current.uplandInterpretation.push(result.uplandInterpretation);
          }
          if (result.wetlandInterpretation) {
            current.wetlandInterpretation.push(result.wetlandInterpretation);
          }
        });
      });

      // Calculate final averages for this manchitro unit
      const finalAverages = new Map<string, {
        avgValue: number,
        mostCommonUpland: string,
        mostCommonWetland: string
      }>();

      testParameterAverages.forEach((data, paramId) => {
        const avgValue = data.count > 0 ? data.value / data.count : 0;
        
        // Get most common interpretation
        const getMostCommon = (arr: string[]) => {
          if (arr.length === 0) return '-';
          const frequency = arr.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          return Object.entries(frequency).reduce((a, b) => frequency[a[0]] > frequency[b[0]] ? a : b)[0];
        };

        finalAverages.set(paramId, {
          avgValue,
          mostCommonUpland: getMostCommon(data.uplandInterpretation),
          mostCommonWetland: getMostCommon(data.wetlandInterpretation)
        });
      });

      // Get most common vumiSrini value for this manchitro unit
      const vumiSriniValues = data.samples.map(s => s.vumiSrini).filter((val): val is string => Boolean(val));
      const mostCommonVumiSrini = vumiSriniValues.length > 0 
        ? vumiSriniValues.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        : {};
      
      const commonVumiSrini = Object.keys(mostCommonVumiSrini).length > 0
        ? Object.entries(mostCommonVumiSrini).reduce((a, b) => mostCommonVumiSrini[a[0]] > mostCommonVumiSrini[b[0]] ? a : b)[0]
        : '-';

      return {
        manchitroUnit,
        sampleIdNumbers: data.sampleIdNumbers.join(', '),
        sampleCount: data.samples.length,
        vumiSrini: commonVumiSrini,
        testParameterAverages: finalAverages,
        firstSample: data.samples[0], // To get the orderItem structure
        locations: [...new Set(data.samples.map(s => s.collectionLocation || 'Unknown Location'))].join(', ') // Get unique locations for this manchitro unit
      };
    });
  };

  const manchitroUnitAverages = getManchitroUnitAverages();
  
  // Calculate pages for manchitro unit table
  const manchitroUnitsPerPage = 3; // Can fit 3 manchitro unit groups per page (3 * 2 = 6 rows)
  const totalManchitroUnits = manchitroUnitAverages.length;
  const totalManchitroPages = Math.ceil(totalManchitroUnits / manchitroUnitsPerPage);
  
  // Get manchitro units for a specific page
  const getManchitroUnitsForPage = (pageIndex: number) => {
    const startIndex = pageIndex * manchitroUnitsPerPage;
    const endIndex = startIndex + manchitroUnitsPerPage;
    return manchitroUnitAverages.slice(startIndex, endIndex);
  };
  
  // Total pages = individual sample pages + location pages + manchitro unit pages
  const totalAllPages = totalSamplePages + totalLocationPages + totalManchitroPages;
  
  return (
    <div className="soil-govt-report-container">
      {/* Individual Sample Details Pages */}
      {Array.from({ length: totalSamplePages }, (_, pageIndex) => (
        <Card 
          key={`sample-${pageIndex}`} 
          className='report-page w-[297mm] min-h-[210mm] mx-auto font-bangla bg-white shadow-lg pt-8 px-4 mb-4 border-0'
          style={{ 
            pageBreakAfter: 'always',
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact'
          }}
        >
          <p className="text-xs font-medium text-black">পৃষ্ঠা: {toBanglaNumber(pageIndex + 1)}/{toBanglaNumber(totalAllPages)}</p>

          <CardContent className='space-y-4 px-4 flex flex-col min-h-[calc(210mm-6rem)]'>
              <div className="mt-6">
                <h3 className="text-sm font-medium text-black mb-2 text-center">নমুনাওয়ারী বিশ্লেষণের ফলাফল</h3>
                <Table>
                  <TableHeader>
                    <TableRow className='border-l border-r border-t border-black'>
                      <TableHead className='border-r border-black text-center text-black text-xs'>মানচিত্র একক</TableHead>
                      <TableHead className='border-r border-black text-center text-black text-xs'>ক্রমিক নং</TableHead>
                      <TableHead className='border-r border-black text-center text-black text-xs'>মৃত্তিকা দল<br/>ও<br/>ভূমি শ্ৰেণী</TableHead>
                      <TableHead className='border-r border-black text-center text-black text-xs'>বুনট</TableHead>
                      {report.samples?.[0]?.orderItem?.orderTestParameters?.map((param) => (
                        <TableHead key={param.id} className='border-r border-black text-center text-black text-xs'>
                          {param.testParameter.name}<br/>({param.testParameter.unit})
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className='border-b border-r border-l border-black'>
                    {getSamplesForPage(pageIndex).map((sample, sampleIndex) => (
                      <TableRow key={sample.id} className='border-black'>
                        <TableCell className='border-r border-black text-center text-black text-xs'>
                          {sample.manchitroUnit ? toBanglaNumber(sample.manchitroUnit.toString()) : '-'}
                        </TableCell>
                        <TableCell className='border-r border-black text-center text-black text-xs'>
                          {toBanglaNumber((sampleIndex + 1).toString())}
                        </TableCell>
                        <TableCell className='border-r border-black text-center text-black text-xs'>
                          {sample.collectionLocation || '-'}
                          <br/>
                          {sample.vumiSrini}
                        </TableCell>
                        <TableCell className='border-r border-black text-center text-black text-xs'>
                          {sample.bunot || '-'}
                        </TableCell>
                        {sample.orderItem?.orderTestParameters?.map((param) => {
                          const testResult = sample.testResults?.find((result) => 
                            result.testParamater.id === param.testParameter.id
                          );
                          return (
                            <TableCell key={param.id} className='border-r border-black text-center text-black text-xs'>
                              {testResult?.value ? toBanglaNumber(testResult.value.toFixed(2)) : '-'}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Analysis Type Information - Show only on the last sample page */}
              {pageIndex === totalSamplePages - 1 && (
                <div className="mt-auto pt-8">
                  <div className="text-left">
                    <p className="text-xs font-medium text-black mb-2">* ওলসেন পদ্ধতিঃ পিএইচ {"=>"} ৬.৬</p>
                    <p className="text-xs font-medium text-black mb-2">** ব্র্রে পদ্ধতিঃ পিএইচ {"<="} ৬.৫</p>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      ))}
      
      {/* Location-based pages */}
      {Array.from({ length: totalLocationPages }, (_, pageIndex) => (
        <Card key={`location-${pageIndex}`} className='w-[297mm] min-h-[210mm] mx-auto font-bangla bg-white shadow-lg pt-16 px-4 mb-4'>
          <p className="text-xs font-medium text-black">পৃষ্ঠা: {toBanglaNumber(totalSamplePages + pageIndex + 1)}/{toBanglaNumber(totalAllPages)}</p>

          <CardContent className='space-y-4 px-4 flex flex-col min-h-[calc(210mm-6rem)]'>
              {/* Location-based Average Interpretation Table */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-black mb-2 text-center">মৃত্তিকা দলের উপরিস্তরের ভূমি শ্রেণীভিত্তিক গড় রাসায়নিক গুণাবলী</h3>
                <Table>
                <TableHeader>
                  <TableRow className='border-l border-r border-t border-black'>
                    <TableHead rowSpan={3} className='border-r border-black text-center text-black text-xs'>মৃত্তিকা দল</TableHead>
                    <TableHead rowSpan={3} className='border-r border-black text-center text-black text-xs'>ভুমিশ্রেণী</TableHead>
                    <TableHead rowSpan={3} className='border-r border-black text-center text-black text-xs'>চাষাবাদ<br/>পদ্ধতি</TableHead>
                    <TableHead className='border-r border-black text-center text-black text-xs' colSpan={report.samples?.[0]?.orderItem?.orderTestParameters?.length || 0}>বিশ্লেষিত ফলাফল ও উর্বরতা শ্রেনী</TableHead>
                  </TableRow>
                  <TableRow className='border-l border-black'>
                    {report.samples?.[0]?.orderItem?.orderTestParameters?.map((param) => (
                      <TableHead key={param.id} className='border-r border-black text-center text-black text-xs'>
                        {param.testParameter.name}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow className='border-l border-r border-b border-black'>
                    {report.samples?.[0]?.orderItem?.orderTestParameters?.map((param) => (
                      <TableHead key={param.id} className='border-r border-black text-center text-black text-xs'>
                        {param.testParameter.unit}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className='border-b border-r border-l border-black'>
                  {getLocationsForPage(pageIndex).map((locationData) => (
                    <React.Fragment key={locationData.location}>
                      {/* Main Row with Location Average Values */}
                      <TableRow className='border-black'>
                        <TableCell rowSpan={3} className='border-r border-black text-center text-black text-xs'>
                          {locationData.location}
                        </TableCell>
                        <TableCell rowSpan={3} className='border-r border-black text-center text-black text-xs'>
                          {locationData.vumiSrini}
                        </TableCell>
                        <TableCell className='border-r border-black text-black text-xs'>
                          গড় মান ({toBanglaNumber(locationData.sampleCount.toString())} নমুনা)
                        </TableCell>
                        {locationData.firstSample.orderItem?.orderTestParameters?.map((param) => {
                          const avgData = locationData.testParameterAverages.get(param.testParameter.id);
                          return (
                            <TableCell key={param.id} className='border-r border-black text-center text-black text-xs'>
                              {avgData?.avgValue ? toBanglaNumber(avgData.avgValue.toFixed(2)) : '-'}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {/* Upland Interpretation Row */}
                      <TableRow className='border-black'>
                        <TableCell className='border-r border-black text-black text-xs'>আপল্যান্ড</TableCell>
                        {locationData.firstSample.orderItem?.orderTestParameters?.map((param) => {
                          const avgData = locationData.testParameterAverages.get(param.testParameter.id);
                          return (
                            <TableCell key={param.id} className='border-r border-black text-center text-black text-xs'>
                              {avgData?.mostCommonUpland || '-'}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {/* Wetland Interpretation Row */}
                      <TableRow className='border-black'>
                        <TableCell className='border-r border-black text-black text-xs'>ওয়েটল্যান্ড</TableCell>
                        {locationData.firstSample.orderItem?.orderTestParameters?.map((param) => {
                          const avgData = locationData.testParameterAverages.get(param.testParameter.id);
                          return (
                            <TableCell key={param.id} className='border-r border-black text-center text-black text-xs'>
                              {avgData?.mostCommonWetland || '-'}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
              </div>
              
              {/* Analysis Type Information - Show only on the last location page */}
              {pageIndex === totalLocationPages - 1 && (
                <div className="mt-auto pt-8">
                  <div className="text-left">
                    <p className="text-xs font-medium text-black mb-2">* ওলসেন পদ্ধতিঃ পিএইচ {"=>"} ৬.৬</p>
                    <p className="text-xs font-medium text-black mb-2">** ব্র্রে পদ্ধতিঃ পিএইচ {"<="} ৬.৫</p>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      ))}
      
      {/* Manchitro Unit-based pages */}
      {Array.from({ length: totalManchitroPages }, (_, pageIndex) => (
        <Card key={`manchitro-${pageIndex}`} className='w-[297mm] min-h-[210mm] mx-auto font-bangla bg-white shadow-lg pt-16 px-4 mb-4'>
          <p className="text-xs font-medium text-black">পৃষ্ঠা: {toBanglaNumber(totalSamplePages + totalLocationPages + pageIndex + 1)}/{toBanglaNumber(totalAllPages)}</p>
          <CardContent className='space-y-4 px-4 flex flex-col min-h-[calc(210mm-6rem)]'>
              {/* Manchitro Ekok (Map Unit) Average Interpretation Table */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-black mb-2 text-center">মানচিত্র একক অনুযায়ী মৃত্তিকার উপরিস্তরের গড় রাসায়নিক গুণাবলী</h3>

                <Table>
                  <TableHeader>
                    <TableRow className='border-l border-r border-t border-black'>
                      <TableHead rowSpan={3} className='border-r border-black text-center text-black text-xs'>মানচিত্র একক</TableHead>
                      <TableHead rowSpan={3} className='border-r border-black text-center text-black text-xs'>মৃত্তিকা দল</TableHead>
                      <TableHead rowSpan={3} className='border-r border-black text-center text-black text-xs'>ভুমিশ্রেণী</TableHead>
                      <TableHead rowSpan={3} className='border-r border-black text-center text-black text-xs'>চাষাবাদ<br/>পদ্ধতি</TableHead>
                      <TableHead className='border-r border-black text-center text-black text-xs' colSpan={report.samples?.[0]?.orderItem?.orderTestParameters?.length || 0}>বিশ্লেষিত ফলাফল ও উর্বরতা শ্রেনী</TableHead>
                    </TableRow>
                    <TableRow className='border-l border-black'>
                      {report.samples?.[0]?.orderItem?.orderTestParameters?.map((param) => (
                        <TableHead key={param.id} className='border-r border-black text-center text-black text-xs'>
                          {param.testParameter.name}
                        </TableHead>
                      ))}
                    </TableRow>
                    <TableRow className='border-l border-r border-b border-black'>
                      {report.samples?.[0]?.orderItem?.orderTestParameters?.map((param) => (
                        <TableHead key={param.id} className='border-r border-black text-center text-black text-xs'>
                          {param.testParameter.unit}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className='border-b border-r border-l border-black'>
                    {getManchitroUnitsForPage(pageIndex).map((unitData) => (
                      <React.Fragment key={unitData.manchitroUnit}>
                        {/* Upland Interpretation Row */}
                        <TableRow className='border-black'>
                          <TableCell rowSpan={2} className='border-r border-black text-center text-black text-xs'>
                            {unitData.manchitroUnit}
                          </TableCell>
                          <TableCell rowSpan={2} className='border-r border-black text-center text-black text-xs'>
                            {unitData.locations}
                          </TableCell>
                          <TableCell rowSpan={2} className='border-r border-black text-center text-black text-xs'>
                            {unitData.vumiSrini}
                          </TableCell>
                          <TableCell className='border-r border-black text-black text-xs'>আপল্যান্ড</TableCell>
                          {unitData.firstSample.orderItem?.orderTestParameters?.map((param) => {
                            const avgData = unitData.testParameterAverages.get(param.testParameter.id);
                            return (
                              <TableCell key={param.id} className='border-r border-black text-center text-black text-xs'>
                                {avgData?.mostCommonUpland || '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                        {/* Wetland Interpretation Row */}
                        <TableRow className='border-black'>
                          <TableCell className='border-r border-black text-black text-xs'>ওয়েটল্যান্ড</TableCell>
                          {unitData.firstSample.orderItem?.orderTestParameters?.map((param) => {
                            const avgData = unitData.testParameterAverages.get(param.testParameter.id);
                            return (
                              <TableCell key={param.id} className='border-r border-black text-center text-black text-xs'>
                                {avgData?.mostCommonWetland || '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Analysis Type Information - Show only on the last manchitro page */}
              {pageIndex === totalManchitroPages - 1 && (
                <div className="mt-auto pt-8">
                  <div className="text-left">
                    <p className="text-xs font-medium text-black mb-2">* ওলসেন পদ্ধতিঃ পিএইচ {"=>"} ৬.৬</p>
                    <p className="text-xs font-medium text-black mb-2">** ব্র্রে পদ্ধতিঃ পিএইচ {"<="} ৬.৫</p>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      ))}
      
      <style jsx>{`
        .soil-govt-report-container {
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
  )
}

export default SoilGovtReportView