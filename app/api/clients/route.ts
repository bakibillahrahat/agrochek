import prisma  from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const clientSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    address: z.string().optional(),
    clientType: z.enum(['FARMER', 'GOVT_ORG', 'PRIVATE']),
});

export async function GET() {
    try{
        const clients = await prisma.client.findMany({
            include: {
                invoices: true,
                orders: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(clients)
    }catch(error){
        console.error('Error fetching clients:', error);
        return NextResponse.json({
            message: 'Failed to fetch clients'
        }, { status: 500});
    }
}

export async function POST(request: Request) {
    try {
      const body = await request.json();
      const validatedData = clientSchema.parse(body);
  
      const newClient = await prisma.client.create({
        data: validatedData,
      });
      return NextResponse.json(newClient, { status: 201 });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Validation Error', errors: error.errors }, { status: 400 });
      }
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('phone')) {
          return NextResponse.json({ message: 'A client with this phone number already exists.' }, { status: 409 });
        }
        if (error.meta?.target?.includes('email')) {
          return NextResponse.json({ message: 'A client with this email already exists.' }, { status: 409 });
        }
      }
      console.error('Error creating client:', error);
      return NextResponse.json({ message: 'Failed to create client' }, { status: 500 });
    }
  }