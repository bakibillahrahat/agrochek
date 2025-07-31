import { NextResponse } from 'next/server'
import prisma from "@/lib/db"

// Define the type for the request body
type InstituteUpdateData = {
  name?: string;
  address?: string;
  issuedby?: string;
  phone?: string;
  prapok?: string;
}

export async function GET() {
  try {
    const instituteInfo = await prisma.institute.findUnique({
      where: { id: 'singleton' }
    })

    if (!instituteInfo) {
      return NextResponse.json(
        { error: 'Institute not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(instituteInfo)
  } catch (error) {
    console.error('Error fetching institute:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as InstituteUpdateData;
    const { name, address, issuedby, prapok, phone } = body;

    // Validate that at least one field is provided
    if (!name && !address && !issuedby && !prapok && !phone) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // Check if institute exists before updating
    const existingInstitute = await prisma.institute.findUnique({
      where: { id: 'singleton' }
    });

    if (!existingInstitute) {
      return NextResponse.json(
        { error: 'Institute not found' },
        { status: 404 }
      );
    }

    const institute = await prisma.institute.update({
      where: { id: 'singleton' },
      data: {
        name,
        address,
        issuedby,
        prapok,
        phone,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(institute);
  } catch (error) {
    console.error('Error updating institute:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Record to update does not exist')) {
        return NextResponse.json(
          { error: 'Institute not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}