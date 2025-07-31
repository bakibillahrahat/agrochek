'use client'

import React, { useEffect, useState, useRef } from 'react'
import FertilizerReportView from './view/FertilizerReportView'
import SoilReportView from './view/SoilReportView'
import SoilGovtReportView from './view/SoilGovtReportView'
import WaterReportView from './view/WaterReportView'
import { Report } from '@/types/report'
import ReportCover from './ReportCover'
import { InvoiceView } from '../invoice/InvoiceView'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './pdf-styles.css'

interface ReportViewProps {
  reportId: string
  
}

const ReportView: React.FC<ReportViewProps> = ({ reportId }) => {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reportCoverRef = useRef<HTMLDivElement>(null)
  const reportViewRef = useRef<HTMLDivElement>(null)
  const invoiceViewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/${reportId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch report')
        }
        const data = await response.json()
        setReport(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [reportId])

  if (loading) {
    return <div>Loading report...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!report) {
    return <div>No report found</div>
  }

  // Group samples by type
  const samplesByType = report.samples.reduce((acc, sample) => {
    const type = sample.sampleType
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(sample)
    return acc
  }, {} as Record<string, typeof report.samples>)

  const renderReportView = () => {
    return Object.entries(samplesByType).map(([type, samples]) => {
      const reportWithFilteredSamples: Report = {
        ...report,
        samples: samples as any[]
      }

      switch (type) {
        case 'SOIL':
          // Check if client is GOVT_ORG and render appropriate soil report view
          if (report.client?.clientType === 'GOVT_ORG') {
            return (
              <div key={type} data-report-type={type} className="report-section">
                <SoilGovtReportView report={reportWithFilteredSamples} />
              </div>
            )
          } else {
            return (
              <div key={type} data-report-type={type} className="report-section">
                <SoilReportView report={reportWithFilteredSamples} />
              </div>
            )
          }
        case 'WATER':
          return (
            <div key={type} data-report-type={type} className="report-section">
              <WaterReportView report={reportWithFilteredSamples} />
            </div>
          )
        case 'FERTILIZER':
          return (
            <div key={type} data-report-type={type} className="report-section">
              <FertilizerReportView report={reportWithFilteredSamples} />
            </div>
          )
        default:
          return <div key={type}>Invalid report type: {type}</div>
      }
    })
  }

  // Calculate total pages for each report type
  const calculateTotalPages = () => {
    let totalPages = 0;
    Object.entries(samplesByType).forEach(([type, samples]) => {
      switch (type) {
        case 'SOIL':
          // Check if it's government report
          if (report.client?.clientType === 'GOVT_ORG') {
            // For SoilGovtReportView: individual sample pages + location pages + manchitro pages
            const samplesPerPage = 10;
            const locationsPerPage = 2;
            const manchitroUnitsPerPage = 3;
            
            const totalSamplePages = Math.ceil(samples.length / samplesPerPage);
            
            // Group by location to calculate location pages
            const locationGroups = samples.reduce((acc, sample) => {
              const location = sample.collectionLocation || 'Unknown Location';
              if (!acc[location]) acc[location] = [];
              acc[location].push(sample);
              return acc;
            }, {} as Record<string, typeof samples>);
            const totalLocationPages = Math.ceil(Object.keys(locationGroups).length / locationsPerPage);
            
            // Group by manchitro unit to calculate manchitro pages  
            const manchitroGroups = samples.reduce((acc, sample) => {
              const manchitroUnit = sample.manchitroUnit?.toString() || 'অজানা';
              if (!acc[manchitroUnit]) acc[manchitroUnit] = [];
              acc[manchitroUnit].push(sample);
              return acc;
            }, {} as Record<string, typeof samples>);
            const totalManchitroPages = Math.ceil(Object.keys(manchitroGroups).length / manchitroUnitsPerPage);
            
            totalPages += totalSamplePages + totalLocationPages + totalManchitroPages;
          } else {
            totalPages += Math.ceil((samples.length * 3) / 8); // Regular soil report: 3 rows per sample, 8 rows per page
          }
          break;
        case 'WATER':
          totalPages += Math.ceil((samples.length * 2) / 8); // 2 rows per sample, 8 rows per page
          break;
        case 'FERTILIZER':
          totalPages += Math.ceil(samples.length / 5); // 5 items per page
          break;
      }
    });
    return totalPages;
  };

  // Calculate detailed page breakdown for government soil reports
  const calculateDetailedPages = () => {
    const soilSamples = samplesByType['SOIL'] || [];
    const isGovtOrg = report.client?.clientType === 'GOVT_ORG';
    
    if (soilSamples.length === 0 || !isGovtOrg) {
      return null;
    }

    const samplesPerPage = 10;
    const locationsPerPage = 2;
    const manchitroUnitsPerPage = 3;
    
    const totalSamplePages = Math.ceil(soilSamples.length / samplesPerPage);
    
    // Group by location to calculate location pages
    const locationGroups = soilSamples.reduce((acc, sample) => {
      const location = sample.collectionLocation || 'Unknown Location';
      if (!acc[location]) acc[location] = [];
      acc[location].push(sample);
      return acc;
    }, {} as Record<string, typeof soilSamples>);
    const totalLocationPages = Math.ceil(Object.keys(locationGroups).length / locationsPerPage);
    
    // Group by manchitro unit to calculate manchitro pages  
    const manchitroGroups = soilSamples.reduce((acc, sample) => {
      const manchitroUnit = sample.manchitroUnit?.toString() || 'অজানা';
      if (!acc[manchitroUnit]) acc[manchitroUnit] = [];
      acc[manchitroUnit].push(sample);
      return acc;
    }, {} as Record<string, typeof soilSamples>);
    const totalManchitroPages = Math.ceil(Object.keys(manchitroGroups).length / manchitroUnitsPerPage);
    
    return {
      samplePages: totalSamplePages,
      locationPages: totalLocationPages,
      manchitroPages: totalManchitroPages
    };
  };

  // Check if we should include invoice (not for GOVT_ORG soil reports)
  const shouldIncludeInvoice = () => {
    const hasSoilSamples = samplesByType['SOIL']?.length > 0;
    const isGovtOrg = report.client?.clientType === 'GOVT_ORG';
    return !(hasSoilSamples && isGovtOrg);
  };

  const generatePdf = async () => {
    const includeInvoice = shouldIncludeInvoice();
    if (!reportCoverRef.current || !reportViewRef.current || (includeInvoice && !invoiceViewRef.current)) {
      console.error("PDF generation failed: One or more refs are not available.");
      return;
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let isFirstPage = true;

      // Helper function to add a delay for rendering
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Optimized function to capture and add content to PDF
      const addContentToPDF = async (element: HTMLElement, orientation: 'p' | 'l') => {
        await delay(100); // Small delay for rendering
        
        const canvas = await html2canvas(element, {
          scale: 2, // Higher scale for better quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: element.scrollWidth,
          height: element.scrollHeight,
          removeContainer: true,
          onclone: (clonedDoc) => {
            // Remove any elements that should be ignored
            const ignoreElements = clonedDoc.querySelectorAll('[data-html2canvas-ignore]');
            ignoreElements.forEach(el => el.remove());
            
            // Ensure print styles are applied
            const printStyles = clonedDoc.createElement('style');
            printStyles.textContent = `
              * { -webkit-print-color-adjust: exact !important; }
              .page-break { page-break-before: always; }
              @media print { body { margin: 0; } }
            `;
            clonedDoc.head.appendChild(printStyles);
          }
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgProps = pdf.getImageProperties(imgData);
        
        // Set page dimensions based on orientation
        const pageWidth = orientation === 'p' ? 210 : 297;
        const pageHeight = orientation === 'p' ? 297 : 210;
        
        // Calculate dimensions to fit the page
        const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
        const scaledWidth = imgProps.width * ratio;
        const scaledHeight = imgProps.height * ratio;
        
        // Center the content on the page
        const x = (pageWidth - scaledWidth) / 2;
        const y = (pageHeight - scaledHeight) / 2;
        
        if (!isFirstPage) {
          pdf.addPage('a4', orientation);
        } else {
          // Set orientation for first page
          if (orientation === 'l') {
            pdf.deletePage(1);
            pdf.addPage('a4', 'l');
          }
        }
        
        pdf.addImage(imgData, 'PNG', Math.max(0, x), Math.max(0, y), scaledWidth, scaledHeight);
        isFirstPage = false;
      };

      // Process each page individually for better PDF structure
      console.log('Starting PDF generation...');

      // Section 1: Report Cover (Portrait A4)
      console.log('Adding report cover...');
      await addContentToPDF(reportCoverRef.current, 'p');
      
      // Section 2: Report Views (Landscape A4 pages)
      console.log('Processing report views...');
      const reportSections = reportViewRef.current.children;
      
      for (let i = 0; i < reportSections.length; i++) {
        const section = reportSections[i] as HTMLElement;
        if (section.classList.contains('report-section')) {
          console.log(`Adding report section ${i + 1}...`);
          
          // Check if this section has multiple pages (multiple Card components)
          const pages = section.querySelectorAll('.report-page, .w-\\[297mm\\]');
          
          if (pages.length > 0) {
            // Process each page separately
            for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
              const page = pages[pageIndex] as HTMLElement;
              console.log(`Adding page ${pageIndex + 1} of section ${i + 1}...`);
              await addContentToPDF(page, 'l');
            }
          } else {
            // Process the entire section as one unit
            await addContentToPDF(section, 'l');
          }
        }
      }

      // Section 3: Invoice View (Portrait A4) - only for non-GOVT_ORG soil reports
      if (includeInvoice && invoiceViewRef.current) {
        console.log('Adding invoice view...');
        await addContentToPDF(invoiceViewRef.current, 'p');
      }

      // Save PDF
      console.log('Saving PDF...');
      pdf.save(`report-${reportId}.pdf`);
      console.log('PDF generation completed successfully!');

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  }

  return (
    <div className="flex flex-col items-center bg-gray-100 p-8 space-y-8">
      <div className="flex gap-4 self-start">
        <button 
          onClick={generatePdf} 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
        >
          Download PDF
        </button>
        <div className="text-sm text-gray-600 flex items-center">
          Total Pages: {calculateTotalPages() + 1 + (shouldIncludeInvoice() ? 1 : 0)} {/* +1 for cover, +1 for invoice if included */}
        </div>
      </div>
      
      {/* Report Cover */}
      <div ref={reportCoverRef} className="pdf-page bg-white shadow-lg overflow-hidden">
        <ReportCover
          senderAddress={report.client.address || ''}
          senderName={report.client.name}
          issueDate={report.createdAt}
          sarokNo={report?.order?.sarokNumber || ''}
          totalSample={report.samples.length}
          sampleTypes={report.samples.map(sample => sample.sampleType)}
          numberOfPages={calculateTotalPages()}
          clientType={report.client?.clientType}
          detailedPages={calculateDetailedPages()}
        />
      </div>
      
      {/* Report Views */}
      <div ref={reportViewRef} className="pdf-content bg-white shadow-lg overflow-hidden">
        {renderReportView()}
      </div>
      
      {/* Invoice View - only for non-GOVT_ORG soil reports */}
      {shouldIncludeInvoice() && (
        <div ref={invoiceViewRef} className="pdf-page bg-white shadow-lg overflow-hidden">
          <InvoiceView id={report.invoiceId || ''} />
        </div>
      )}
    </div>
  )
}

export default ReportView