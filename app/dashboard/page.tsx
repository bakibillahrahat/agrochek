"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Area, AreaChart } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Users, DollarSign, ShoppingCart, Activity, Calendar, Filter, Receipt, FileText, UserCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import MonthlyReportDownload from "@/components/dashboard/MonthlyReportDownload";
import { useRouter } from "next/navigation";

interface Order {
  id: string;
  client: {
    name: string;
    phone: string;
  };
  totalAmount: number;
  status: string;
  createdAt: string;
  sarokNumber: string;
}

interface Invoice {
  id: string;
  orderId: string;
  totalAmount: number;
  status: 'PAID' | 'DUE' | 'CANCELLED';
  createdAt: string;
  order: {
    client: {
      name: string;
      phone: string;
    };
  };
}

interface Client {
  id: string;
  name: string;
  phone: string;
  clientType: 'FARMER' | 'GOVT_ORG' | 'PRIVATE';
  orders: Order[];
  invoices: Invoice[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 shadow-2xl rounded-xl border border-slate-600 backdrop-blur-sm">
        <p className="font-bold text-white text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-300 text-sm">
              {entry.name}: <span className="text-white font-semibold">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dateRange, setDateRange] = useState<{from: Date, to: Date} | null>(null);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, invoicesRes, clientsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/invoice'),
        fetch('/api/clients?include=invoices')
      ]);

      if (!ordersRes.ok || !invoicesRes.ok || !clientsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [ordersData, invoicesData, clientsData] = await Promise.all([
        ordersRes.json(),
        invoicesRes.json(),
        clientsRes.json()
      ]);

      setOrders(ordersData);
      setInvoices(invoicesData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data based on time range and date range
  const getDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'day':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'week':
        return { from: startOfWeek(now), to: endOfWeek(now) };
      case 'month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'year':
        return { from: startOfYear(now), to: endOfYear(now) };
      default:
        return { from: startOfWeek(now), to: endOfWeek(now) };
    }
  };

  const filterData = () => {
    const currentDateRange = dateRange || getDateRange(timeRange);
    
    // Filter orders
    const filteredOrdersData = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= currentDateRange.from && orderDate <= currentDateRange.to;
    });

    // Filter invoices
    const filteredInvoicesData = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt);
      return invoiceDate >= currentDateRange.from && invoiceDate <= currentDateRange.to;
    });

    // Filter clients based on their orders in the date range
    const filteredClientsData = clients.filter(client => {
      return client.orders?.some(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= currentDateRange.from && orderDate <= currentDateRange.to;
      });
    });

    setFilteredOrders(filteredOrdersData);
    setFilteredInvoices(filteredInvoicesData);
    setFilteredClients(filteredClientsData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (orders.length > 0 || invoices.length > 0 || clients.length > 0) {
      filterData();
    }
  }, [timeRange, dateRange, orders, invoices, clients]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    setDateRange(null); // Reset custom date range when time range changes
  };

  const handleDateRangeChange = (range: {from: Date, to: Date} | null) => {
    setDateRange(range);
  };

  const MotionCard = motion(Card);

  // Calculate statistics using filtered data
  const stats = {
    totalOrders: filteredOrders.length,
    totalRevenue: filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    activeClients: filteredClients.length,
    pendingInvoices: filteredInvoices.filter(inv => inv.status === 'DUE').length
  };

  // Calculate revenue trend data using filtered data
  const revenueData = filteredInvoices.reduce((acc: any[], invoice) => {
    const date = new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existingDay = acc.find(item => item.name === date);
    
    if (existingDay) {
      existingDay.value += invoice.totalAmount;
    } else {
      acc.push({ name: date, value: invoice.totalAmount });
    }
    
    return acc;
  }, []).sort((a, b) => new Date(a.name + ', 2024').getTime() - new Date(b.name + ', 2024').getTime());

  // Calculate order distribution data using filtered data - converted to line chart format
  const orderStatusData = filteredOrders.reduce((acc: any[], order) => {
    const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existingDay = acc.find(item => item.name === date);
    
    if (existingDay) {
      existingDay[order.status] = (existingDay[order.status] || 0) + 1;
      existingDay.total = (existingDay.total || 0) + 1;
    } else {
      acc.push({ 
        name: date, 
        [order.status]: 1,
        total: 1,
        COMPLETED: order.status === 'COMPLETED' ? 1 : 0,
        PENDING: order.status === 'PENDING' ? 1 : 0,
        PROCESSING: order.status === 'PROCESSING' ? 1 : 0,
        CANCELLED: order.status === 'CANCELLED' ? 1 : 0
      });
    }
    
    return acc;
  }, []).sort((a, b) => new Date(a.name + ', 2024').getTime() - new Date(b.name + ', 2024').getTime());

  // Calculate client growth data for line chart
  const clientGrowthData = filteredClients.reduce((acc: any[], client) => {
    if (client.orders && client.orders.length > 0) {
      const firstOrderDate = new Date(client.orders[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existingDay = acc.find(item => item.name === firstOrderDate);
      
      if (existingDay) {
        existingDay.newClients = (existingDay.newClients || 0) + 1;
        existingDay[client.clientType] = (existingDay[client.clientType] || 0) + 1;
      } else {
        acc.push({ 
          name: firstOrderDate, 
          newClients: 1,
          FARMER: client.clientType === 'FARMER' ? 1 : 0,
          GOVT_ORG: client.clientType === 'GOVT_ORG' ? 1 : 0,
          PRIVATE: client.clientType === 'PRIVATE' ? 1 : 0
        });
      }
    }
    return acc;
  }, []).sort((a, b) => new Date(a.name + ', 2024').getTime() - new Date(b.name + ', 2024').getTime());

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <DatePickerWithRange onDateChange={handleDateRangeChange} />
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {(dateRange || timeRange !== 'week') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setTimeRange('week');
                setDateRange(null);
              }}
              className="text-sm"
            >
              Reset Filters
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              const now = new Date();
              const month = (now.getMonth() + 1).toString();
              const year = now.getFullYear().toString();
              
              try {
                const { downloadMonthlyReport } = await import('@/lib/utils/monthly-report-generator');
                const result = await downloadMonthlyReport(month, year);
                if (result.success) {
                  toast.success('Monthly report downloaded successfully!');
                } else {
                  toast.error('Failed to download monthly report');
                }
              } catch (error) {
                toast.error('Failed to download monthly report');
              }
            }}
            className="hidden sm:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Quick Report
          </Button>
          <Button onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      </div>

      {/* Filter Status Indicator */}
      {(dateRange || timeRange !== 'week') && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Active Filters: 
                {dateRange 
                  ? ` Custom Range (${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()})`
                  : ` ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`
                }
              </span>
            </div>
            <span className="text-xs text-blue-600">
              Showing {filteredOrders.length} orders, {filteredInvoices.length} invoices, {filteredClients.length} clients
            </span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Orders", value: stats.totalOrders.toString(), change: "+12.5%", icon: ShoppingCart },
          { title: "Total Revenue", value: `৳${stats.totalRevenue.toFixed(2)}`, change: "+20.1%", icon: DollarSign },
          { title: "Active Clients", value: stats.activeClients.toString(), change: "+8.1%", icon: Users },
          { title: "Pending Invoices", value: stats.pendingInvoices.toString(), change: "-5.2%", icon: Receipt },
        ].map((stat, index) => (
          <MotionCard
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-[120px]" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.change} from last {timeRange}
                  </p>
                </>
              )}
            </CardContent>
          </MotionCard>
        ))}
      </div>

      {/* Monthly Report Download Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MonthlyReportDownload className="lg:col-span-1" />
        
        {/* Quick Actions Card */}
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/dashboard/clients')}
              >
                <Users className="h-5 w-5" />
                <span className="text-xs">Add Client</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/dashboard/orders/new')}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="text-xs">New Order</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/dashboard/invoice')}
              >
                <Receipt className="h-5 w-5" />
                <span className="text-xs">See Invoice</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/dashboard/all-test-info')}
              >
                <Activity className="h-5 w-5" />
                <span className="text-xs">Test Info</span>
              </Button>
            </div>
          </CardContent>
        </MotionCard>
      </div>

      {/* Recent Orders */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.slice(0, 5).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.sarokNumber || order.id}</TableCell>
                    <TableCell>
                      <div>{order.client.name}</div>
                      <div className="text-sm text-muted-foreground">{order.client.phone}</div>
                    </TableCell>
                    <TableCell>৳{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        order.status === "COMPLETED" ? "default" :
                        order.status === "PENDING" ? "secondary" : "destructive"
                      }>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </MotionCard>

      {/* Recent Invoices */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.slice(0, 5).map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>
                      <div>{invoice.order.client.name}</div>
                      <div className="text-sm text-muted-foreground">{invoice.order.client.phone}</div>
                    </TableCell>
                    <TableCell>৳{invoice.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        invoice.status === "PAID" ? "default" :
                        invoice.status === "DUE" ? "secondary" : "destructive"
                      }>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </MotionCard>

      {/* Client Information */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <CardHeader>
          <CardTitle>Top Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.slice(0, 5).map((client) => {
                  const totalSpent = client.invoices?.reduce((sum, inv) => sum + inv.totalAmount, 0) || 0;
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {client.clientType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.orders?.length || 0}</TableCell>
                      <TableCell>৳{totalSpent.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </MotionCard>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <MotionCard 
          className="col-span-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 border-0 shadow-xl"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Analytics Overview
            </CardTitle>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[180px] bg-white/70 backdrop-blur-sm border-blue-200">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">💰 Revenue</SelectItem>
                <SelectItem value="orders">📦 Orders</SelectItem>
                <SelectItem value="clients">👥 Clients</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-[350px] w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={selectedMetric === 'revenue' ? revenueData : selectedMetric === 'orders' ? orderStatusData : clientGrowthData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '20px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  />
                  {selectedMetric === 'revenue' && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ r: 6, fill: "#3B82F6", strokeWidth: 2, stroke: "#ffffff" }}
                        activeDot={{ r: 8, fill: "#1D4ED8", stroke: "#ffffff", strokeWidth: 3 }}
                        name="Revenue (৳)"
                      />
                    </>
                  )}
                  {selectedMetric === 'orders' && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#3B82F6"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ r: 6, fill: "#3B82F6", strokeWidth: 2, stroke: "#ffffff" }}
                        activeDot={{ r: 8, fill: "#1D4ED8", stroke: "#ffffff", strokeWidth: 3 }}
                        name="Total Orders"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="COMPLETED" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#10B981", strokeWidth: 2, stroke: "#ffffff" }}
                        activeDot={{ r: 7, fill: "#059669", stroke: "#ffffff", strokeWidth: 3 }}
                        name="✅ Completed"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="PENDING" 
                        stroke="#F59E0B" 
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#F59E0B", strokeWidth: 2, stroke: "#ffffff" }}
                        activeDot={{ r: 7, fill: "#D97706", stroke: "#ffffff", strokeWidth: 3 }}
                        name="⏳ Pending"
                      />
                    </>
                  )}
                  {selectedMetric === 'clients' && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="newClients"
                        stroke="#8B5CF6"
                        fillOpacity={1}
                        fill="url(#colorClients)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="newClients" 
                        stroke="#8B5CF6" 
                        strokeWidth={3}
                        dot={{ r: 6, fill: "#8B5CF6", strokeWidth: 2, stroke: "#ffffff" }}
                        activeDot={{ r: 8, fill: "#7C3AED", stroke: "#ffffff", strokeWidth: 3 }}
                        name="👥 New Clients"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="FARMER" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#10B981", strokeWidth: 2, stroke: "#ffffff" }}
                        activeDot={{ r: 7, fill: "#059669", stroke: "#ffffff", strokeWidth: 3 }}
                        name="🌾 Farmers"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="PRIVATE" 
                        stroke="#EF4444" 
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#EF4444", strokeWidth: 2, stroke: "#ffffff" }}
                        activeDot={{ r: 7, fill: "#DC2626", stroke: "#ffffff", strokeWidth: 3 }}
                        name="🏢 Private"
                      />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </MotionCard>

        <MotionCard 
          className="col-span-3 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900 dark:to-teal-900 border-0 shadow-xl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              📈 Status Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px] w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={orderStatusData}>
                  <defs>
                    <linearGradient id="gradientCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="gradientPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="gradientProcessing" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="gradientCancelled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '15px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="COMPLETED"
                    stackId="1"
                    stroke="#10B981"
                    fill="url(#gradientCompleted)"
                  />
                  <Area
                    type="monotone"
                    dataKey="PENDING"
                    stackId="1"
                    stroke="#F59E0B"
                    fill="url(#gradientPending)"
                  />
                  <Area
                    type="monotone"
                    dataKey="PROCESSING"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="url(#gradientProcessing)"
                  />
                  <Area
                    type="monotone"
                    dataKey="CANCELLED"
                    stackId="1"
                    stroke="#EF4444"
                    fill="url(#gradientCancelled)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="COMPLETED" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#10B981", strokeWidth: 2, stroke: "#ffffff" }}
                    activeDot={{ r: 8, fill: "#059669", stroke: "#ffffff", strokeWidth: 3 }}
                    name="✅ Completed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="PENDING" 
                    stroke="#F59E0B" 
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#F59E0B", strokeWidth: 2, stroke: "#ffffff" }}
                    activeDot={{ r: 8, fill: "#D97706", stroke: "#ffffff", strokeWidth: 3 }}
                    name="⏳ Pending"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="PROCESSING" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#3B82F6", strokeWidth: 2, stroke: "#ffffff" }}
                    activeDot={{ r: 8, fill: "#1D4ED8", stroke: "#ffffff", strokeWidth: 3 }}
                    name="⚡ Processing"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="CANCELLED" 
                    stroke="#EF4444" 
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#EF4444", strokeWidth: 2, stroke: "#ffffff" }}
                    activeDot={{ r: 8, fill: "#DC2626", stroke: "#ffffff", strokeWidth: 3 }}
                    name="❌ Cancelled"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </MotionCard>
      </div>
    </div>
  );
}
