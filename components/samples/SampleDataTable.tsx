"use client"

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from 'date-fns';
import { SampleStatus, SampleType, SoilCategory } from '@/lib/generated/prisma-client';
import TestDataForm from './TestDataForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Filter, TestTube, AlertCircle, Search, ClipboardList, Clock, CheckCircle2, Beaker, Eye, Calendar, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { TestDetailsDialog } from "./TestDetailsDialog";
import { toast } from "sonner";
import { Sample } from '@/types/Sample';



const getStatusColor = (status: SampleStatus) => {
  switch (status) {
    case SampleStatus.PENDING:
      return 'bg-yellow-500';
    case SampleStatus.IN_LAB:
      return 'bg-blue-500';
    case SampleStatus.TESTING:
      return 'bg-purple-500';
    case SampleStatus.TEST_COMPLETED:
      return 'bg-green-500';
    case SampleStatus.REPORT_READY:
      return 'bg-indigo-500';
    case SampleStatus.ISSUED:
      return 'bg-emerald-500';
    case SampleStatus.CANCELLED:
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusText = (status: SampleStatus) => {
  switch (status) {
    case SampleStatus.PENDING:
      return 'Pending';
    case SampleStatus.IN_LAB:
      return 'In Lab';
    case SampleStatus.TESTING:
      return 'Testing';
    case SampleStatus.TEST_COMPLETED:
      return 'Test Completed';
    case SampleStatus.REPORT_READY:
      return 'Report Ready';
    case SampleStatus.ISSUED:
      return 'Issued';
    case SampleStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status;
  }
};

export default function SampleDataTable() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSamples, setSelectedSamples] = useState<Set<string>>(new Set());
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SampleStatus | 'ALL'>(SampleStatus.PENDING);
  const [typeFilter, setTypeFilter] = useState<SampleType | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<{
    parameters: Array<{
      id: string;
      name: string;
      unit: string | null;
      comparisonRules: {
        soilCategory: SoilCategory | null;
      }[];
    }>;
    results: Array<{
      id: string;
      name: string;
      value: number | null;
    }>;
    sampleType: SampleType;
  } | null>(null);

  const fetchSamples = async () => {
    try {
      setTableLoading(true);
      const response = await fetch('/api/samples');
      if (!response.ok) {
        throw new Error('Failed to fetch samples');
      }
      const data = await response.json();
      setSamples(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  const handleTestDataSubmit = async () => {
    await fetchSamples();
    setDialogOpen(false);
  };

  const toggleSample = (sampleId: string) => {
    setSelectedSamples(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sampleId)) {
        newSet.delete(sampleId);
      } else {
        newSet.add(sampleId);
      }
      return newSet;
    });
  };

  const toggleAllSamples = () => {
    const uniqueSampleIdsInRows = new Set(rows.map(row => row.sample.id));
    if (selectedSamples.size === uniqueSampleIdsInRows.size && uniqueSampleIdsInRows.size > 0) {
      setSelectedSamples(new Set());
    } else {
      setSelectedSamples(new Set(rows.map(row => row.sample.id)));
    }
  };

  const handleRowClick = (sample: Sample) => {
    setSelectedSample(sample);
    setDialogOpen(true);
  };

  const handleViewDetails = (e: React.MouseEvent, row: { sample: Sample; orderItem: any; testResults: any[] }) => {
    e.stopPropagation();
    setSelectedDetails({
      parameters: row.orderItem.orderTestParameters.map((otp: any) => ({
        id: otp.id,
        name: otp.testParameter.name,
        unit: otp.testParameter.unit,
        comparisonRules: otp.testParameter.comparisonRules
      })),
      results: row.testResults.map((result: any) => ({
        id: result.id,
        name: result.testParamater.name,
        value: result.value,
        wetlandValue: result.wetlandValue,
        uplandValue: result.uplandValue
      })),
      sampleType: row.sample.sampleType
    });
    setViewDetailsOpen(true);
  };

  const handleStatusChange = async (sampleId: string, newStatus: SampleStatus) => {
    try {
      const response = await fetch(`/api/samples/${sampleId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setSamples(prevSamples => 
        prevSamples.map(sample => 
          sample.id === sampleId 
            ? { ...sample, status: newStatus }
            : sample
        )
      );

      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Error updating status:', error);
    }
  };

  const filteredSamples = samples.filter(sample => {
    const matchesStatus = statusFilter === 'ALL' || sample.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || sample.sampleType === typeFilter;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      sample.order.client.phone.toLowerCase().includes(searchLower) ||
      sample.sampleIdNumber.toLowerCase().includes(searchLower) ||
      sample.order.client.name.toLowerCase().includes(searchLower);

    // Date filter logic
    const matchesDate = (() => {
      if (dateFilter === 'ALL') return true;
      
      const sampleDate = new Date(sample.collectionDate);
      const now = new Date();
      
      switch (dateFilter) {
        case 'TODAY':
          return sampleDate.toDateString() === now.toDateString();
        case 'YESTERDAY':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          return sampleDate.toDateString() === yesterday.toDateString();
        case 'LAST_7_DAYS':
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return sampleDate >= sevenDaysAgo;
        case 'LAST_30_DAYS':
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return sampleDate >= thirtyDaysAgo;
        case 'LAST_90_DAYS':
          const ninetyDaysAgo = new Date(now);
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          return sampleDate >= ninetyDaysAgo;
        default:
          return true;
      }
    })();

    return matchesStatus && matchesType && matchesSearch && matchesDate;
  });

  // Clear all filters function
  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setDateFilter('ALL');
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || typeFilter !== 'ALL' || dateFilter !== 'ALL';

  const rows = filteredSamples.map(sample => ({
    sample,
    orderItem: sample.orderItem,
    testResults: sample.testResults
  }));

  const stats = {
    total: samples.length,
    pending: samples.filter(s => s.status === SampleStatus.PENDING).length,
    completed: samples.filter(s => s.status === SampleStatus.TEST_COMPLETED).length,
    soil: samples.filter(s => s.sampleType === SampleType.SOIL).length,
    water: samples.filter(s => s.sampleType === SampleType.WATER).length,
    fertilizer: samples.filter(s => s.sampleType === SampleType.FERTILIZER).length,
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-red-500 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-12 w-[250px]" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-lg sm:rounded-xl">
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Total Samples</p>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">{stats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-lg sm:rounded-xl">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Pending Tests</p>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">{stats.pending}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg sm:rounded-xl">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Completed Tests</p>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">{stats.completed}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-blue-500/10 rounded-lg sm:rounded-xl">
                <Beaker className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Sample Types</p>
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-2">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-xs">
                    Soil: {stats.soil}
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-xs">
                    Water: {stats.water}
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-xs">
                    Fertilizer: {stats.fertilizer}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-6">
          <div>
            <CardTitle className="text-lg sm:text-xl">Samples in Progress</CardTitle>
            <CardDescription className="text-sm">
              Showing samples from orders that are currently being processed
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3 sm:gap-4">
            <div className="relative w-full sm:w-[280px] lg:w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search samples..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
            
            {/* Filters Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  {statusFilter !== 'ALL' && (
                    <Badge variant="secondary" className="text-xs">
                      Status: {getStatusText(statusFilter)}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setStatusFilter('ALL')}
                      />
                    </Badge>
                  )}
                  {typeFilter !== 'ALL' && (
                    <Badge variant="secondary" className="text-xs">
                      Type: {typeFilter}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setTypeFilter('ALL')}
                      />
                    </Badge>
                  )}
                  {dateFilter !== 'ALL' && (
                    <Badge variant="secondary" className="text-xs">
                      Date: {dateFilter.replace('_', ' ').toLowerCase()}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => setDateFilter('ALL')}
                      />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs h-6 px-2"
                  >
                    Clear all
                  </Button>
                </div>
              )}
              
              {/* Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Sample Type Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      <TestTube className="h-3 w-3 mr-1" />
                      Type
                      {typeFilter !== 'ALL' && (
                        <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" align="end">
                    <div className="p-3">
                      <h4 className="font-medium text-sm mb-2">Filter by Sample Type</h4>
                      <Select
                        value={typeFilter}
                        onValueChange={(value) => setTypeFilter(value as SampleType | 'ALL')}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Types</SelectItem>
                          {Object.values(SampleType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Date Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      <Calendar className="h-3 w-3 mr-1" />
                      Date
                      {dateFilter !== 'ALL' && (
                        <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" align="end">
                    <div className="p-3">
                      <h4 className="font-medium text-sm mb-2">Filter by Collection Date</h4>
                      <Select
                        value={dateFilter}
                        onValueChange={(value) => setDateFilter(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Dates</SelectItem>
                          <SelectItem value="TODAY">Today</SelectItem>
                          <SelectItem value="YESTERDAY">Yesterday</SelectItem>
                          <SelectItem value="LAST_7_DAYS">Last 7 Days</SelectItem>
                          <SelectItem value="LAST_30_DAYS">Last 30 Days</SelectItem>
                          <SelectItem value="LAST_90_DAYS">Last 90 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Status Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Status
                      {statusFilter !== 'ALL' && (
                        <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                          1
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0" align="end">
                    <div className="p-3">
                      <h4 className="font-medium text-sm mb-2">Filter by Status</h4>
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value as SampleStatus | 'ALL')}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Statuses</SelectItem>
                          {Object.values(SampleStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                                <span>{getStatusText(status)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className='-mt-10'>
          <div className="rounded-md border">
            <div className="relative">
              <div className="overflow-x-auto">
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[50px] bg-background">
                          <Checkbox
                            checked={selectedSamples.size > 0 && selectedSamples.size === rows.length}
                            onCheckedChange={toggleAllSamples}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead className="bg-background">Sample ID</TableHead>
                        <TableHead className="bg-background">Collection Date</TableHead>
                        <TableHead className="bg-background">Sample Type</TableHead>
                        <TableHead className="bg-background">Location</TableHead>
                        <TableHead className="bg-background">Crop Type</TableHead>
                        <TableHead className="bg-background">Status</TableHead>
                        <TableHead className="bg-background">Client</TableHead>
                        <TableHead className="bg-background">Agro Tests</TableHead>
                        <TableHead className="bg-background">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableLoading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24 mt-2" />
                              </TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            </TableRow>
                          ))}
                        </>
                      ) : rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="h-[400px]">
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <div className="p-4 bg-muted/50 rounded-full mb-4">
                                <Search className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <h3 className="text-lg font-semibold mb-2">
                                {searchQuery ? 'No matching samples found' : 'No samples available'}
                              </h3>
                              <p className="text-sm text-muted-foreground max-w-sm">
                                {searchQuery || hasActiveFilters
                                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                                  : 'There are currently no samples in the selected status or type.'}
                              </p>
                              {(searchQuery || hasActiveFilters) && (
                                <button
                                  onClick={clearAllFilters}
                                  className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
                                >
                                  Clear all filters
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row) => (
                          <TableRow
                            key={`${row.sample.id}-${row.orderItem.id}`}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleRowClick(row.sample)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedSamples.has(row.sample.id)}
                                onCheckedChange={() => toggleSample(row.sample.id)}
                                aria-label={`Select sample ${row.sample.sampleIdNumber}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{row.sample.sampleIdNumber}</TableCell>
                            <TableCell>{format(new Date(row.sample.collectionDate), 'PPP')}</TableCell>
                            <TableCell>{row.orderItem.agroTest.sampleType}</TableCell>
                            <TableCell>{row.sample.collectionLocation}</TableCell>
                            <TableCell>{row.sample.cropType}</TableCell>
                            <TableCell>
                              <Select
                                value={row.sample.status}
                                onValueChange={(value) => handleStatusChange(row.sample.id, value as SampleStatus)}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(row.sample.status)}`} />
                                    <SelectValue>
                                      {getStatusText(row.sample.status)}
                                    </SelectValue>
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(SampleStatus).map((status) => (
                                    <SelectItem 
                                      key={status} 
                                      value={status}
                                      className="flex items-center gap-2"
                                    >
                                      <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                                      {getStatusText(status)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{row.sample.order.client.name}</div>
                              <div className="text-sm text-muted-foreground">{row.sample.order.client.phone}</div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-green-500/10 text-green-500 border-green-500/20"
                              >
                                {row.orderItem.agroTest.name}
                              </Badge>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleViewDetails(e, row)}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                              >
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TestDetailsDialog
        open={viewDetailsOpen}
        onOpenChange={setViewDetailsOpen}
        details={selectedDetails}
      />

      {selectedSample && (
        <TestDataForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          sample={selectedSample!}
          onSuccess={handleTestDataSubmit}
        />
      )}
    </>
  );
}