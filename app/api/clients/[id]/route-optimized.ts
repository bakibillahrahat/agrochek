import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from "@/lib/db";

const clientUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().optional(),
  clientType: z.enum(['FARMER', 'GOVT_ORG', 'PRIVATE']),
});

export async function GET(request: NextRequest, context: any) {
  const params = await context.params;
  const { id } = params;

  if (!id) {
    return NextResponse.json({ message: 'Missing Client ID' }, { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const includeStats = url.searchParams.get('includeStats') === 'true';
    const includeOrders = url.searchParams.get('includeOrders') === 'true';

    // Build select clause based on requirements
    const selectClause: any = {
      id: true,
      name: true,
      phone: true,
      address: true,
      clientType: true,
      createdAt: true,
      updatedAt: true
    };

    if (includeStats) {
      selectClause._count = {
        select: {
          orders: true,
          invoices: true,
          reports: true
        }
      };
    }

    if (includeOrders) {
      selectClause.orders = {
        select: {
          id: true,
          sarokNumber: true,
          orderDate: true,
          status: true,
          totalAmount: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // Limit to recent orders
      };
    }

    const client = await prisma.client.findUnique({ 
      where: { id },
      select: selectClause
    });

    if (!client) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ message: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const params = await context.params;
  const { id } = params;

  if (!id) {
    return NextResponse.json({ message: 'Missing Client ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validatedData = clientUpdateSchema.parse(body);

    // Check for duplicate phone number excluding current client
    const existingClient = await prisma.client.findFirst({
      where: {
        phone: validatedData.phone,
        NOT: { id }
      },
      select: { id: true }
    });

    if (existingClient) {
      return NextResponse.json({ 
        message: 'A client with this phone number already exists.' 
      }, { status: 409 });
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        clientType: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedClient);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: 'Validation Error', 
        errors: error.errors 
      }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }
    console.error('Error updating client:', error);
    return NextResponse.json({ message: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const params = await context.params;
  const { id } = params;

  if (!id) {
    return NextResponse.json({ message: 'Missing Client ID' }, { status: 400 });
  }

  try {
    // Check if client exists and has related data
    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            orders: true,
            invoices: true,
            reports: true
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    // Check if client has related records
    const totalRelatedRecords = client._count.orders + client._count.invoices + client._count.reports;
    
    if (totalRelatedRecords > 0) {
      return NextResponse.json({ 
        message: `Cannot delete client. Client has ${client._count.orders} orders, ${client._count.invoices} invoices, and ${client._count.reports} reports.`,
        relatedData: {
          orders: client._count.orders,
          invoices: client._count.invoices,
          reports: client._count.reports
        }
      }, { status: 409 });
    }

    // Safe to delete - no related records
    await prisma.client.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Client deleted successfully',
      deletedClient: {
        id: client.id,
        name: client.name
      }
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }
    console.error('Error deleting client:', error);
    return NextResponse.json({ message: 'Failed to delete client' }, { status: 500 });
  }
}
