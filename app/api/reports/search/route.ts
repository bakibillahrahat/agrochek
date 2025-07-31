import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma client

interface ReportSearchResult {
  id: string;
  reportIdNumber: string;
  clientName?: string;
  createdAt: string; 
}

// Define a type for the expected shape of reports from Prisma query
interface PrismaReport {
  id: string;
  reportNumber: string; // CORRECTED: Was reportIdNumber, now reportNumber to match schema
  createdAt: Date;
  client: {
    name: string | null;
  } | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientPhoneNumber = searchParams.get('clientPhoneNumber');

  if (!clientPhoneNumber) {
    return NextResponse.json({ message: 'Client phone number is required' }, { status: 400 });
  }

  try {
    const reports: PrismaReport[] = await prisma.report.findMany({
      where: {
        client: { 
          phone: clientPhoneNumber, // Uses 'phone' from Client model
        },
      },
      select: {
        id: true,
        reportNumber: true, // Selects 'reportNumber' from Report model
        createdAt: true,
        client: {
          select: {
            name: true, 
          },
        },
      },
      orderBy: {
        createdAt: 'desc', 
      }
    });

    // Transform the data to match the ReportSearchResult interface
    const formattedReports: ReportSearchResult[] = reports.map((report: PrismaReport) => ({
      id: report.id,
      reportIdNumber: report.reportNumber, // Maps from report.reportNumber
      clientName: report.client?.name || undefined, 
      createdAt: report.createdAt.toISOString(), 
    }));

    if (formattedReports.length === 0) {
      return NextResponse.json([], { status: 200 }); 
    }

    return NextResponse.json(formattedReports, { status: 200 });

  } catch (error) {
    console.error('Error fetching reports by client phone number:', error);
    return NextResponse.json({ message: 'Failed to fetch reports.', error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Internal Server Error' }, { status: 500 });
  }
}
