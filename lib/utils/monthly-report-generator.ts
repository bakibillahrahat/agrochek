import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface MonthlyReportData {
  month: string;
  year: string;
  orders: any[];
  invoices: any[];
  clients: any[];
  samples: any[];
}

interface SampleSourceData {
  source: string;
  sampleType: string;
  received: number;
  cumulative: number;
  analyzed: number;
  pending: number;
}

export const generateMonthlyProgressReport = async (data: MonthlyReportData) => {
  // Create HTML content for the report
  const htmlContent = createReportHTML(data);
  
  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '1200px'; // Fixed width for consistent rendering
  document.body.appendChild(container);

  try {
    // Generate canvas from HTML
    const canvas = await html2canvas(container, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 1200,
      height: container.scrollHeight
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    
    // Calculate dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;
    
    // Center the image
    const x = (pdfWidth - scaledWidth) / 2;
    const y = (pdfHeight - scaledHeight) / 2;
    
    pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
    
    return pdf;
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};

const createReportHTML = (data: MonthlyReportData): string => {
  const sampleStats = calculateSampleStatistics(data);
  const monthName = getMonthName(data.month);
  
  return `
    <div style="
      font-family: Arial, sans-serif;
      padding: 40px;
      background: white;
      color: black;
      width: 1120px;
      margin: 0 auto;
    ">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px;">
        <h1 style="
          font-size: 24px;
          font-weight: bold;
          margin: 0;
          margin-bottom: 10px;
        ">Monthly Technical Progress Report of AgroCheck Laboratory (${monthName} ${data.year})</h1>
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
        ">
          <div style="font-size: 14px;">
            <strong>No. of samples received</strong>
          </div>
          <div style="font-size: 14px;">
            <strong>No. of samples analyzed</strong>
          </div>
          <div style="font-size: 14px;">
            <strong>Pending</strong>
          </div>
        </div>
      </div>

      <!-- Main Table -->
      <table style="
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
        font-size: 12px;
      ">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold;">Source of samples with lab. No.</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Sample Type</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Present month</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Cumulative</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Number of Sample</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Cumulative no. of Sample</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Pending Samples</th>
          </tr>
        </thead>
        <tbody>
          ${generateTableRows(sampleStats)}
        </tbody>
      </table>

      <!-- Summary Section -->
      <div style="display: flex; justify-content: space-between; margin-top: 40px;">
        <div style="flex: 1; padding-right: 20px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Monthly Summary</h3>
          <div style="font-size: 12px; line-height: 1.6;">
            <p><strong>Total Orders:</strong> ${data.orders.length}</p>
            <p><strong>Total Revenue:</strong> ৳${data.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)}</p>
            <p><strong>Active Clients:</strong> ${data.clients.length}</p>
            <p><strong>Pending Invoices:</strong> ${data.invoices.filter(inv => inv.status === 'DUE').length}</p>
          </div>
        </div>
        
        <div style="flex: 1; padding-left: 20px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Client Distribution</h3>
          <div style="font-size: 12px; line-height: 1.6;">
            ${generateClientDistribution(data.clients)}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="
        margin-top: 50px;
        padding-top: 20px;
        border-top: 1px solid #ccc;
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #666;
      ">
        <span>Generated on: ${new Date().toLocaleString()}</span>
        <span>AgroCheck Laboratory Management System</span>
      </div>
    </div>
  `;
};

const getMonthName = (month: string): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[parseInt(month) - 1] || month;
};

const generateTableRows = (sampleStats: any): string => {
  let rows = '';
  
  Object.entries(sampleStats).forEach(([source, types]: [string, any]) => {
    // Add source header row with bold styling
    rows += `
      <tr style="background-color: #f8f9fa;">
        <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">${source}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
      </tr>
    `;
    
    // Add sample type rows
    Object.entries(types).forEach(([sampleType, stats]: [string, any]) => {
      if (stats.received > 0 || stats.analyzed > 0 || stats.pending > 0) {
        rows += `
          <tr>
            <td style="border: 1px solid #000; padding: 8px; padding-left: 20px;">${sampleType}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">Quality Control</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${stats.received || '-'}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${stats.received || '-'}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${stats.analyzed || '-'}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${stats.analyzed || '-'}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${stats.pending || '-'}</td>
          </tr>
        `;
      }
    });
  });
  
  return rows;
};

const generateClientDistribution = (clients: any[]): string => {
  const clientTypes = clients.reduce((acc: any, client) => {
    const type = client.clientType || 'UNKNOWN';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  let distribution = '';
  Object.entries(clientTypes).forEach(([type, count]) => {
    const displayType = type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    distribution += `<p><strong>${displayType}:</strong> ${count}</p>`;
  });

  return distribution || '<p>No client data available</p>';
};
  // Group samples by source and type
  const sampleGroups: { [key: string]: any } = {};
  
  // Sample sources based on the image and client types
  const sources = [
    { name: 'SRDE', category: 'Government' },
    { name: 'Farmer', category: 'Private' },
    { name: 'DAE', category: 'Government' },
    { name: 'Private', category: 'Private' },
    { name: 'Research', category: 'Research' },
    { name: 'Others', category: 'Others' }
  ];

  // Initialize sample groups
  sources.forEach(source => {
    sampleGroups[source.name] = {
      Soil: { received: 0, analyzed: 0, pending: 0 },
      Fertilizer: { received: 0, analyzed: 0, pending: 0 },
      Plant: { received: 0, analyzed: 0, pending: 0 },
      Water: { received: 0, analyzed: 0, pending: 0 }
    };
  });

const calculateSampleStatistics = (data: MonthlyReportData) => {
  // Group samples by source and type
  const sampleGroups: { [key: string]: any } = {};
  
  // Sample sources based on the image and client types
  const sources = [
    { name: 'SRDE', category: 'Government' },
    { name: 'Farmer', category: 'Private' },
    { name: 'DAE', category: 'Government' },
    { name: 'Private', category: 'Private' },
    { name: 'Research', category: 'Research' },
    { name: 'Others', category: 'Others' }
  ];

  // Initialize sample groups
  sources.forEach(source => {
    sampleGroups[source.name] = {
      Soil: { received: 0, analyzed: 0, pending: 0 },
      Fertilizer: { received: 0, analyzed: 0, pending: 0 },
      Plant: { received: 0, analyzed: 0, pending: 0 },
      Water: { received: 0, analyzed: 0, pending: 0 }
    };
  });

  // Map client types to sources
  const clientTypeToSource: { [key: string]: string } = {
    'FARMER': 'Farmer',
    'GOVT_ORG': 'DAE',
    'PRIVATE': 'Private'
  };

  // Process actual sample data if available
  data.samples?.forEach((sample: any) => {
    // Determine source from client type if available
    let source = 'Others';
    if (sample.order?.client?.clientType) {
      source = clientTypeToSource[sample.order.client.clientType] || 'Others';
    }
    
    const type = sample.sampleType || 'Soil';
    
    if (sampleGroups[source] && sampleGroups[source][type]) {
      sampleGroups[source][type].received++;
      
      // Check if sample is completed (issued or report ready)
      if (sample.status === 'ISSUED' || sample.status === 'REPORT_READY') {
        sampleGroups[source][type].analyzed++;
      } else if (sample.status === 'PENDING' || sample.status === 'IN_LAB' || sample.status === 'TESTING') {
        sampleGroups[source][type].pending++;
      }
    }
  });

  return sampleGroups;
};

export const downloadMonthlyReport = async (month: string, year: string) => {
  try {
    // Fetch data for the specific month
    const response = await fetch(`/api/reports/monthly?month=${month}&year=${year}`);
    if (!response.ok) {
      throw new Error('Failed to fetch monthly data');
    }
    
    const data = await response.json();
    
    // Generate PDF
    const pdf = await generateMonthlyProgressReport({
      month,
      year,
      orders: data.orders || [],
      invoices: data.invoices || [],
      clients: data.clients || [],
      samples: data.samples || []
    });
    
    // Download the PDF
    pdf.save(`monthly-report-${month}-${year}.pdf`);
    
    return { success: true };
  } catch (error) {
    console.error('Error generating monthly report:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
