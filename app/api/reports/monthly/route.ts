import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year parameters are required' },
        { status: 400 }
      );
    }

    // Create date range for the specified month
    const monthIndex = parseInt(month) - 1; // JavaScript months are 0-indexed
    const yearNum = parseInt(year);
    const startDate = startOfMonth(new Date(yearNum, monthIndex));
    const endDate = endOfMonth(new Date(yearNum, monthIndex));

    // Fetch orders for the month
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        client: {
          select: {
            name: true,
            phone: true,
            clientType: true,
          },
        },
        samples: {
          select: {
            id: true,
            sampleType: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch invoices for the month
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        order: {
          include: {
            client: {
              select: {
                name: true,
                phone: true,
                clientType: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch active clients (clients with orders in the month)
    const clients = await prisma.client.findMany({
      where: {
        orders: {
          some: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      include: {
        orders: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        invoices: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    // Fetch samples for the month
    const samples = await prisma.sample.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        order: {
          include: {
            client: {
              select: {
                name: true,
                clientType: true,
              },
            },
          },
        },
        testResults: {
          select: {
            id: true,
            value: true,
            interpretation: true,
            testParamater: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate cumulative data (from beginning of year to current month)
    const yearStart = new Date(yearNum, 0, 1);
    
    const cumulativeOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: yearStart,
          lte: endDate,
        },
      },
    });

    const cumulativeInvoices = await prisma.invoice.count({
      where: {
        createdAt: {
          gte: yearStart,
          lte: endDate,
        },
      },
    });

    const cumulativeSamples = await prisma.sample.count({
      where: {
        createdAt: {
          gte: yearStart,
          lte: endDate,
        },
      },
    });

    // Prepare response data
    const responseData = {
      month,
      year,
      orders,
      invoices,
      clients,
      samples,
      cumulative: {
        orders: cumulativeOrders,
        invoices: cumulativeInvoices,
        samples: cumulativeSamples,
      },
      summary: {
        totalOrders: orders.length,
        totalRevenue: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        activeClients: clients.length,
        pendingInvoices: invoices.filter(inv => inv.status === 'DUE').length,
        completedSamples: samples.filter(sample => sample.status === 'ISSUED' || sample.status === 'REPORT_READY').length,
        pendingSamples: samples.filter(sample => sample.status === 'PENDING' || sample.status === 'IN_LAB' || sample.status === 'TESTING').length,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching monthly report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly report data' },
      { status: 500 }
    );
  }
}
