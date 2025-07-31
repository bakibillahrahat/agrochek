import { NextResponse } from "next/server"
import  prisma  from "@/lib/db"

export async function GET() {
    try {
        const invoices = await prisma?.invoice.findMany({
            include: {
                order: {
                    include: {
                        client: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(invoices)
    } catch (error) {
        console.error('Error fetching invoices:', error)

        if (error instanceof Error && error.message === 'Database connection error') {
            return NextResponse.json(
                {
                    error: 'Database connection error',
                    message: 'Unable to connect to the database. Please try again later.'
                },
                { status: 503 }
            )
        }

        return NextResponse.json(
            {
                error: 'Failed to fetch invoices',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { orderId, status } = body

        if (!orderId || !status) {
            return NextResponse.json(
                { error: 'Missing required fields: orderId and status are required' },
                { status: 400 }
            )
        }

        // First find the order to get the invoice ID
        const order = await prisma?.order.findUnique({
            where: { id: orderId },
            include: { invoice: true }
        })

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        if (!order.invoice) {
            return NextResponse.json(
                { error: 'No invoice found for this order' },
                { status: 404 }
            )
        }

        // Update the invoice status
        const updatedInvoice = await prisma?.invoice.update({
            where: { id: order.invoice.id },
            data: { status },
            include: {
                order: {
                    include: {
                        client: true
                    }
                }
            }
        })

        return NextResponse.json(updatedInvoice)
    } catch (error) {
        console.error('Error updating invoice status:', error)

        if (error instanceof Error && error.message === 'Database connection error') {
            return NextResponse.json(
                {
                    error: 'Database connection error',
                    message: 'Unable to connect to the database. Please try again later.'
                },
                { status: 503 }
            )
        }

        return NextResponse.json(
            {
                error: 'Failed to update invoice status',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}