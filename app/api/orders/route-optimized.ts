import { NextResponse } from "next/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import prisma from "@/lib/db";
import { InvoiceStatus, OrderStatus, SampleStatus } from "@/lib/generated/prisma-client";
import { generateSampleId } from "@/lib/utils/sampleIdGenerator";
import { z } from "zod";
import { unstable_cache } from 'next/cache';

// Validation schemas
const orderItemSchema = z.object({
    agroTestId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    subtotal: z.number().positive(),
    testParameters: z.array(z.object({
        testParameterId: z.string()
    })).optional()
});

const sampleSchema = z.object({
    agroTestId: z.string(),
    collectionDate: z.string(),
    sampleType: z.enum(['SOIL', 'WATER', 'FERTILIZER']),
    collectionLocation: z.string(),
    cropType: z.string().optional(),
    bunot: z.string().optional(),
    manchitroUnit: z.number().optional(),
    vumiSrini: z.string().optional()
});

const orderSchema = z.object({
    sarokNumber: z.string().optional(),
    clientId: z.string(),
    operatorId: z.string(),
    totalAmount: z.number().positive(),
    paymentStatus: z.enum(['PAID', 'DUE']),
    orderItems: z.array(orderItemSchema),
    samples: z.array(sampleSchema)
});

// Cache orders list for 2 minutes
const getCachedOrders = unstable_cache(
    async () => {
        return await prisma.order.findMany({
            select: {
                id: true,
                sarokNumber: true,
                orderDate: true,
                status: true,
                totalAmount: true,
                createdAt: true,
                client: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        clientType: true
                    }
                },
                operator: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                invoice: {
                    select: {
                        id: true,
                        status: true,
                        totalAmount: true,
                        paidAmount: true
                    }
                },
                _count: {
                    select: {
                        samples: true,
                        orderItems: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },
    ['orders-list'],
    { 
        revalidate: 120, // 2 minutes
        tags: ['orders']
    }
);

export async function GET(request: Request) {
    try {
        // Add pagination and filtering
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const status = url.searchParams.get('status');
        const clientId = url.searchParams.get('clientId');
        const includeDetails = url.searchParams.get('includeDetails') === 'true';

        // Use cached version for simple list requests
        if (!status && !clientId && !includeDetails && page === 1 && limit === 20) {
            const orders = await getCachedOrders();
            return NextResponse.json(orders);
        }

        // Build where clause
        const whereClause: any = {};
        if (status) whereClause.status = status;
        if (clientId) whereClause.clientId = clientId;

        // Optimized query with conditional includes
        const selectClause = includeDetails ? {
            id: true,
            sarokNumber: true,
            orderDate: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            client: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    clientType: true,
                    address: true
                }
            },
            operator: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            invoice: {
                select: {
                    id: true,
                    status: true,
                    totalAmount: true,
                    paidAmount: true,
                    dueDate: true
                }
            },
            samples: {
                select: {
                    id: true,
                    sampleIdNumber: true,
                    sampleType: true,
                    status: true,
                    collectionDate: true
                }
            },
            orderItems: {
                select: {
                    id: true,
                    quantity: true,
                    unitPrice: true,
                    subtotal: true,
                    agroTest: {
                        select: {
                            id: true,
                            name: true,
                            sampleType: true
                        }
                    }
                }
            }
        } : {
            id: true,
            sarokNumber: true,
            orderDate: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            client: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    clientType: true
                }
            },
            operator: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            _count: {
                select: {
                    samples: true,
                    orderItems: true
                }
            }
        };

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: whereClause,
                select: selectClause,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.order.count({ where: whereClause })
        ]);

        return NextResponse.json({
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { 
                error: "Failed to fetch orders",
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = orderSchema.parse(body);

        // Batch validation queries for better performance
        const [
            existingSarok,
            clientExists,
            operatorExists,
            agroTestsExist,
            institute
        ] = await Promise.all([
            // Check sarok number uniqueness if provided
            validatedData.sarokNumber ? 
                prisma.order.findUnique({
                    where: { sarokNumber: validatedData.sarokNumber },
                    select: { id: true }
                }) : null,
            
            // Validate client exists and get client type
            prisma.client.findUnique({
                where: { id: validatedData.clientId },
                select: { id: true, clientType: true }
            }),
            
            // Validate operator exists
            prisma.user.findUnique({
                where: { id: validatedData.operatorId },
                select: { id: true }
            }),
            
            // Validate all agroTests exist in one query
            prisma.agrotest.findMany({
                where: { 
                    id: { 
                        in: [...new Set(validatedData.orderItems.map(item => item.agroTestId))] 
                    } 
                },
                select: { id: true }
            }),
            
            // Get institute for sample ID generation
            prisma.institute.findUnique({
                where: { id: 'singleton' },
                select: { address: true }
            })
        ]);

        // Validation checks
        if (existingSarok) {
            return NextResponse.json(
                { error: "Sarok number already exists" },
                { status: 400 }
            );
        }

        if (!clientExists) {
            return NextResponse.json(
                { error: `Client with ID ${validatedData.clientId} not found` },
                { status: 400 }
            );
        }

        if (!operatorExists) {
            return NextResponse.json(
                { error: `Operator with ID ${validatedData.operatorId} not found` },
                { status: 400 }
            );
        }

        const agroTestIds = new Set(agroTestsExist.map(test => test.id));
        const missingTests = validatedData.orderItems
            .map(item => item.agroTestId)
            .filter(id => !agroTestIds.has(id));
        
        if (missingTests.length > 0) {
            return NextResponse.json(
                { error: `Agrotest(s) not found: ${missingTests.join(', ')}` },
                { status: 400 }
            );
        }

        if (!institute) {
            return NextResponse.json(
                { error: 'Institute information not found' },
                { status: 500 }
            );
        }

        // Additional validation for GOVT_ORG soil samples
        if (clientExists.clientType === 'GOVT_ORG') {
            const invalidSoilSamples = validatedData.samples.filter(sample => 
                sample.sampleType === 'SOIL' && 
                (!sample.bunot || !sample.vumiSrini || !sample.manchitroUnit)
            );
            
            if (invalidSoilSamples.length > 0) {
                return NextResponse.json(
                    { error: "Bunot, Vumi Srini, and Manchitro Unit are required for soil samples from government organizations" },
                    { status: 400 }
                );
            }
        }

        // Optimized transaction with reduced queries
        const result = await prisma.$transaction(async (tx) => {
            // Create order with nested orderItems
            const order = await tx.order.create({
                data: {
                    sarokNumber: validatedData.sarokNumber,
                    clientId: validatedData.clientId,
                    operatorId: validatedData.operatorId,
                    totalAmount: validatedData.totalAmount,
                    status: OrderStatus.PENDING,
                    orderItems: {
                        create: validatedData.orderItems.map((item) => ({
                            agroTestId: item.agroTestId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            subtotal: item.subtotal,
                            orderTestParameters: {
                                create: item.testParameters?.map((param) => ({
                                    testParameterId: param.testParameterId
                                })) || []
                            }
                        }))
                    }
                },
                select: {
                    id: true,
                    orderItems: {
                        select: {
                            id: true,
                            agroTestId: true
                        }
                    }
                }
            });

            // Create invoice
            const invoice = await tx.invoice.create({
                data: {
                    orderId: order.id,
                    clientId: validatedData.clientId,
                    status: validatedData.paymentStatus === 'PAID' ? InvoiceStatus.PAID : InvoiceStatus.DUE,
                    totalAmount: validatedData.totalAmount,
                    paidAmount: validatedData.paymentStatus === 'PAID' ? validatedData.totalAmount : 0,
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                },
                select: { id: true }
            });

            // Update order with invoice ID
            await tx.order.update({
                where: { id: order.id },
                data: { invoiceId: invoice.id }
            });

            // Prepare and create samples in batch
            const sampleCreateData = validatedData.samples.map((sampleData, index) => {
                const orderItem = order.orderItems.find(item => item.agroTestId === sampleData.agroTestId);
                
                if (!orderItem) {
                    throw new Error(`Order item not found for agroTestId: ${sampleData.agroTestId}`);
                }

                const dbSampleData: any = {
                    orderId: order.id,
                    orderItemId: orderItem.id,
                    sampleIdNumber: generateSampleId(sampleData.sampleType, institute.address || 'Unknown') + `-${index + 1}`,
                    collectionDate: new Date(sampleData.collectionDate),
                    sampleType: sampleData.sampleType,
                    collectionLocation: sampleData.collectionLocation,
                    status: SampleStatus.PENDING
                };

                if (sampleData.cropType) dbSampleData.cropType = sampleData.cropType;
                if (sampleData.bunot) dbSampleData.bunot = sampleData.bunot;
                if (sampleData.manchitroUnit) dbSampleData.manchitroUnit = sampleData.manchitroUnit;
                if (sampleData.vumiSrini) dbSampleData.vumiSrini = sampleData.vumiSrini;

                return dbSampleData;
            });

            await tx.sample.createMany({
                data: sampleCreateData
            });

            return order.id;
        });

        // Fetch complete order data outside transaction
        const completeOrder = await prisma.order.findUnique({
            where: { id: result },
            select: {
                id: true,
                sarokNumber: true,
                orderDate: true,
                status: true,
                totalAmount: true,
                client: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        clientType: true
                    }
                },
                operator: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                invoice: {
                    select: {
                        id: true,
                        status: true,
                        totalAmount: true
                    }
                },
                samples: {
                    select: {
                        id: true,
                        sampleIdNumber: true,
                        sampleType: true,
                        status: true
                    }
                },
                orderItems: {
                    select: {
                        id: true,
                        quantity: true,
                        unitPrice: true,
                        subtotal: true,
                        agroTest: {
                            select: {
                                id: true,
                                name: true,
                                sampleType: true
                            }
                        }
                    }
                }
            }
        });

        // Invalidate cache
        // revalidateTag('orders'); // Uncomment when using production caching

        return NextResponse.json(completeOrder, { status: 201 });
    } catch (error) {
        console.error("Error creating order:", error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { 
                    error: "Validation Error", 
                    details: error.errors 
                },
                { status: 400 }
            );
        }
        
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                return NextResponse.json(
                    { 
                        error: "Invalid reference: One or more referenced records do not exist",
                        code: error.code
                    },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            { 
                error: "Failed to create order", 
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
