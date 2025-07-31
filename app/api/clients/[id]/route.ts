// app/api/clients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from "@/lib/db"

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
    const client = await prisma.client.findUnique({ where: { id } });
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

    const updatedClient = await prisma.client.update({
      where: { id },
      data: validatedData,
    });
    return NextResponse.json(updatedClient);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('phone')) {
        return NextResponse.json({ message: 'A client with this phone number already exists.' }, { status: 409 });
      }
      if (error.meta?.target?.includes('email')) {
        return NextResponse.json({ message: 'A client with this email already exists.' }, { status: 409 });
      }
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
    // First check if the client exists and get related data
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            samples: true,
            invoice: true,
            report: true,
            orderItems: true
          }
        },
        invoices: true,
        reports: true
      }
    });

    if (!client) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    // Delete all related records first
    await prisma.$transaction(async (tx) => {
      // Delete all test results from samples first
      for (const order of client.orders) {
        if (order.samples.length > 0) {
          for (const sample of order.samples) {
            await tx.testResult.deleteMany({
              where: { sampleId: sample.id }
            });
          }
        }
      }

      // Delete all order test parameters
      for (const order of client.orders) {
        for (const orderItem of order.orderItems) {
          await tx.orderTestParameter.deleteMany({
            where: { orderItemId: orderItem.id }
          });
        }
      }

      // Delete all samples from orders
      for (const order of client.orders) {
        if (order.samples.length > 0) {
          await tx.sample.deleteMany({
            where: { orderId: order.id }
          });
        }
      }

      // Delete all order items
      for (const order of client.orders) {
        await tx.orderItem.deleteMany({
          where: { orderId: order.id }
        });
      }

      // Delete all reports first (since they reference orders and invoices)
      if (client.reports.length > 0) {
        await tx.report.deleteMany({
          where: { clientId: id }
        });
      }

      // Delete all invoices (since they reference orders)
      if (client.invoices.length > 0) {
        await tx.invoice.deleteMany({
          where: { clientId: id }
        });
      }

      // Delete all orders
      if (client.orders.length > 0) {
        await tx.order.deleteMany({
          where: { clientId: id }
        });
      }

      // Finally delete the client
      await tx.client.delete({
        where: { id }
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Failed to delete client',
      error: error.message 
    }, { status: 500 });
  }
}