import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Calendar, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadMonthlyReport } from '@/lib/utils/monthly-report-generator';

interface MonthlyReportDownloadProps {
  className?: string;
}

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const YEARS = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: year.toString() };
});

export default function MonthlyReportDownload({ className }: MonthlyReportDownloadProps) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!selectedMonth) {
      toast.error('Please select a month');
      return;
    }

    setIsDownloading(true);
    try {
      const result = await downloadMonthlyReport(selectedMonth, selectedYear);
      
      if (result.success) {
        toast.success(`Monthly report for ${MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear} downloaded successfully!`);
      } else {
        toast.error(result.error || 'Failed to generate monthly report');
      }
    } catch (error) {
      console.error('Error downloading monthly report:', error);
      toast.error('Failed to download monthly report. Please check your network connection.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleQuickDownload = async (monthsBack: number = 0) => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
    const month = (targetDate.getMonth() + 1).toString();
    const year = targetDate.getFullYear().toString();

    setIsDownloading(true);
    try {
      const result = await downloadMonthlyReport(month, year);
      
      if (result.success) {
        const monthName = MONTHS.find(m => m.value === month)?.label;
        toast.success(`Monthly report for ${monthName} ${year} downloaded successfully!`);
      } else {
        toast.error(result.error || 'Failed to generate monthly report');
      }
    } catch (error) {
      console.error('Error downloading monthly report:', error);
      toast.error('Failed to download monthly report. Please check your network connection.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Monthly Progress Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleDownload} 
            disabled={isDownloading || !selectedMonth}
            className="flex-1"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download Report
          </Button>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-3">Quick Download:</p>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickDownload(0)}
              disabled={isDownloading}
            >
              <Calendar className="h-3 w-3 mr-1" />
              This Month
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickDownload(1)}
              disabled={isDownloading}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Last Month
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickDownload(2)}
              disabled={isDownloading}
            >
              <Calendar className="h-3 w-3 mr-1" />
              2 Months Ago
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Reports include laboratory sample analysis data</p>
          <p>• Generated in PDF format with summary statistics</p>
          <p>• Compatible with laboratory standards and requirements</p>
        </div>
      </CardContent>
    </Card>
  );
}
