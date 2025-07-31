# Monthly Report Download Feature

This feature provides comprehensive monthly progress reports for the AgroCheck laboratory management system, similar to the technical progress reports used in agricultural laboratories.

## Features Added

### 1. Monthly Report Generator (`lib/utils/monthly-report-generator.ts`)
- Generates PDF reports with laboratory-style formatting
- Includes sample analysis statistics by source and type
- Provides cumulative data tracking
- Shows client distribution and revenue summaries

### 2. API Endpoint (`app/api/reports/monthly/route.ts`)
- Fetches monthly data for orders, invoices, clients, and samples
- Calculates cumulative statistics from year beginning
- Filters data by specified month and year
- Returns comprehensive summary statistics

### 3. UI Component (`components/dashboard/MonthlyReportDownload.tsx`)
- Month and year selection interface
- Quick download buttons for recent months
- Loading states and error handling
- Progress indicators

### 4. Dashboard Integration
- Added to main dashboard page
- Quick report download button in toolbar
- Full report download card in dashboard grid

## Usage

### Quick Download
Use the "Quick Report" button in the dashboard toolbar to download the current month's report instantly.

### Custom Download
1. Navigate to the Monthly Report Download card
2. Select desired month and year
3. Click "Download Report"
4. PDF will be generated and downloaded automatically

### Quick Actions
- "This Month" - Downloads current month report
- "Last Month" - Downloads previous month report
- "2 Months Ago" - Downloads report from 2 months back

## Report Structure

The generated PDF includes:

### Header Section
- Laboratory name and report period
- Generated date and time

### Sample Analysis Table
- Source categories (SRDE, Farmer, DAE, Private, Research, Others)
- Sample types (Soil, Fertilizer, Plant, Water)
- Monthly and cumulative statistics
- Pending sample counts

### Summary Section
- Total orders and revenue for the period
- Active client count
- Invoice status breakdown
- Client type distribution

### Footer
- Generation timestamp
- Laboratory management system branding

## Technical Details

### Dependencies
- `jspdf` - PDF generation
- `html2canvas` - HTML to canvas rendering (instead of jspdf-autotable)
- `date-fns` - Date manipulation
- React components for UI

### Why html2canvas?
We use `html2canvas` instead of `jspdf-autotable` because:
- **Better Styling Control**: Full CSS support for complex layouts
- **Consistent Rendering**: What you see in HTML is what you get in PDF
- **Easier Maintenance**: Standard HTML/CSS instead of PDF-specific table configurations
- **Responsive Design**: Can easily adapt layouts for different screen sizes
- **Rich Content**: Support for complex formatting, images, and custom styling

### API Response Format
```typescript
{
  month: string,
  year: string,
  orders: Order[],
  invoices: Invoice[],
  clients: Client[],
  samples: Sample[],
  cumulative: {
    orders: number,
    invoices: number,
    samples: number
  },
  summary: {
    totalOrders: number,
    totalRevenue: number,
    activeClients: number,
    pendingInvoices: number,
    completedSamples: number,
    pendingSamples: number
  }
}
```

### Sample Status Mapping
- **Completed**: `ISSUED`, `REPORT_READY`
- **Pending**: `PENDING`, `IN_LAB`, `TESTING`
- **Cancelled**: `CANCELLED`

### Client Type to Source Mapping
- `FARMER` → Farmer
- `GOVT_ORG` → DAE  
- `PRIVATE` → Private
- Others → Others

## Error Handling

- API errors are caught and displayed via toast notifications
- Missing data fields are handled gracefully with defaults
- PDF generation errors are logged and reported to user
- Network failures show appropriate error messages

## Future Enhancements

Potential improvements could include:
- Export to Excel format
- Email delivery of reports
- Scheduled automatic generation
- Custom report templates
- Multi-language support
- Advanced filtering options
