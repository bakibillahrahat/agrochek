import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { SampleType } from "@/lib/generated/prisma-client"

export async function PATCH(
  req: NextRequest,
  // { params }: { params: { id: string } }
  context: any
) {
  try {
    const params = await context.params;
    const id = params.id;
    const { status } = await req.json()

    if (!prisma) {
      throw new Error('Database connection not initialized')
    }

    // Validate status
    if (!status || !['PAID', 'DUE', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value provided' },
        { status: 400 }
      )
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: {
        order: {
          include: {
            client: true,
            orderItems: {
              include: {
                agroTest: true,
                orderTestParameters: {
                  include: {
                    testParameter: {
                      include: {
                        pricing: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Error updating invoice:', error)

    // Handle database connection errors
    if (error instanceof Error && 
        (error.message.includes('Can\'t reach database server') || 
         error.message.includes('Database connection not initialized'))) {
      return NextResponse.json(
        {
          error: 'Database connection error',
          message: 'Unable to connect to the database. Please try again later.'
        },
        { status: 503 }
      )
    }

    // Handle Prisma errors
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'An error occurred while accessing the database.'
        },
        { status: 500 }
      )
    }

    if (error instanceof Error && error.message.includes('Record to update does not exist')) {
      return NextResponse.json(
        {
          error: 'Invoice not found',
          message: 'The invoice you are trying to update does not exist.'
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to update invoice',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  context: any
) {
  try {
    const params = await context.params;
    const {id} = params;

    if (!prisma) {
      throw new Error('Database connection not initialized')
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            client: true,
            samples: {
              select: {
                id: true,
                sampleType: true,
                sampleIdNumber: true
              }
            },
            orderItems: {
              include: {
                agroTest: true,
                orderTestParameters: {
                  include: {
                    testParameter: {
                      include: {
                        pricing: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)

    // Handle database connection errors
    if (error instanceof Error && 
        (error.message.includes('Can\'t reach database server') || 
         error.message.includes('Database connection not initialized'))) {
      return NextResponse.json(
        {
          error: 'Database connection error',
          message: 'Unable to connect to the database. Please try again later.'
        },
        { status: 503 }
      )
    }

    // Handle Prisma errors
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'An error occurred while accessing the database.'
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch invoice',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 