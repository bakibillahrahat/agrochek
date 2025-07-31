import { NextResponse } from "next/server";
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientRustPanicError } from "@prisma/client/runtime/library";
import prisma from "@/lib/db";
import { InvoiceStatus, OrderStatus, SampleStatus } from "@/lib/generated/prisma-client";
import { generateSampleId } from "@/lib/utils/sampleIdGenerator";

// Get All Orders
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
        include: {
          client: true,
          samples: true,
          invoice: true,
          orderItems: {
            include: {
              agroTest: {
                include: {
                  testParameter: true
                }
              },
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
      });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    
    if (error instanceof Error && error.message === "Database connection error") {
      return NextResponse.json(
        { 
          error: "Database connection error",
          message: "Unable to connect to the database. Please try again later."
        },
        { status: 503 }
      );
    }
    
    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json(
        { 
          error: "Database error",
          code: error.code,
          message: error.message 
        },
        { status: 500 }
      );
    }
    
    if (error instanceof PrismaClientUnknownRequestError) {
      return NextResponse.json(
        { 
          error: "Unknown database error",
          message: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to fetch orders",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST new order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sarokNumber,
      clientId,
      operatorId,
      totalAmount,
      paymentStatus,
      orderItems,
      samples,
    } = body;

    // Validate required fields
    if (!clientId || !operatorId || !totalAmount || !paymentStatus || !orderItems || !samples) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate paymentStatus value
    if (!['PAID', 'DUE'].includes(paymentStatus)) {
      return NextResponse.json(
        { error: "Invalid payment status. Must be either 'PAID' or 'DUE'" },
        { status: 400 }
      );
    }

    // Validate sarokNumber if provided
    if (sarokNumber) {
      // Check if sarokNumber already exists
      const existingOrder = await prisma.order.findUnique({
        where: { sarokNumber }
      });

      if (existingOrder) {
        return NextResponse.json(
          { error: "Sarok number already exists" },
          { status: 400 }
        );
      }
    }

    // Validate orderItems and samples are arrays
    if (!Array.isArray(orderItems) || !Array.isArray(samples)) {
      return NextResponse.json(
        { error: "orderItems and samples must be arrays" },
        { status: 400 }
      );
    }

    // Validate orderItems has required fields
    for (const item of orderItems) {
      if (!item.agroTestId || !item.quantity || !item.unitPrice || !item.subtotal) {
        return NextResponse.json(
          { error: "Invalid order item structure" },
          { status: 400 }
        );
      }
    }

    // Validate samples has required fields
    for (const sample of samples) {
      if (!sample.agroTestId || !sample.collectionDate || !sample.sampleType || !sample.collectionLocation) {
        return NextResponse.json(
          { error: "Invalid sample structure - missing required fields" },
          { status: 400 }
        );
      }

      // Validate cropType is required for non-fertilizer samples
      if (sample.sampleType !== "FERTILIZER" && (!sample.cropType || sample.cropType.trim() === "")) {
        return NextResponse.json(
          { error: "Crop type is required for soil and water samples" },
          { status: 400 }
        );
      }
    }

    // Verify that all agroTests exist before creating the order (batch query)
    const agroTestIds = [...new Set(orderItems.map((item: any) => item.agroTestId))];
    const existingAgroTests = await prisma.agrotest.findMany({
      where: { id: { in: agroTestIds } },
      select: { id: true }
    });
    
    const foundAgroTestIds = new Set(existingAgroTests.map(test => test.id));
    for (const agroTestId of agroTestIds) {
      if (!foundAgroTestIds.has(agroTestId)) {
        return NextResponse.json(
          { error: `Agrotest with ID ${agroTestId} not found` },
          { status: 400 }
        );
      }
    }

    // Verify that the client and operator exist (parallel query)
    const [client, operator] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      prisma.user.findUnique({ where: { id: operatorId } })
    ]);
    
    if (!client) {
      return NextResponse.json(
        { error: `Client with ID ${clientId} not found` },
        { status: 400 }
      );
    }
    
    if (!operator) {
      return NextResponse.json(
        { error: `Operator with ID ${operatorId} not found` },
        { status: 400 }
      );
    }

    // Additional validation for SOIL samples with GOVT_ORG client type
    if (client.clientType === 'GOVT_ORG') {
      for (const sample of samples) {
        if (sample.sampleType === 'SOIL') {
          if (!sample.bunot || sample.bunot.trim() === '') {
            return NextResponse.json(
              { error: "Bunot is required for soil samples from government organizations" },
              { status: 400 }
            );
          }
          
          if (sample.manchitroUnit === undefined || sample.manchitroUnit === null || sample.manchitroUnit <= 0) {
            return NextResponse.json(
              { error: "Manchitro Unit must be a positive number for soil samples from government organizations" },
              { status: 400 }
            );
          }
          
          if (!sample.vumiSrini || sample.vumiSrini.trim() === '') {
            return NextResponse.json(
              { error: "Vumi Srini is required for soil samples from government organizations" },
              { status: 400 }
            );
          }
        }
      }
    }

    // Get institute information for sample ID generation (parallel with order creation)
    const institute = await prisma.institute.findUnique({
      where: { id: 'singleton' }
    });

    if (!institute) {
      throw new Error('Institute information not found');
    }

    // Use a transaction to create order, invoice, and samples atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          sarokNumber,
          clientId,
          operatorId,
          totalAmount,
          status: OrderStatus.PENDING,
          orderItems: {
            create: orderItems.map((item: any) => ({
              agroTest: {
                connect: { id: item.agroTestId }
              },
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              orderTestParameters: {
                create: item.testParameters?.map((param: any) => ({
                  testParameter: {
                    connect: { id: param.testParameterId }
                  }
                })) || []
              }
            }))
          }
        },
        include: {
          orderItems: {
            include: {
              agroTest: true,
              orderTestParameters: {
                include: {
                  testParameter: true,
                },
              },
            },
          },
        },
      });

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          order: {
            connect: { id: order.id }
          },
          client: {
            connect: { id: clientId }
          },
          status: paymentStatus === 'PAID' ? InvoiceStatus.PAID : InvoiceStatus.DUE,
          totalAmount: totalAmount,
          paidAmount: paymentStatus === 'PAID' ? totalAmount : 0,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        }
      });

      // Update order with invoice ID
      await tx.order.update({
        where: { id: order.id },
        data: { invoiceId: invoice.id }
      });

      // Prepare sample data for batch creation
      const sampleCreateData = samples.map((sampleData: any, index: number) => {
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

        // Add cropType if it exists
        if (sampleData.cropType) {
          dbSampleData.cropType = sampleData.cropType;
        }

        // Add additional fields for SOIL samples with GOVT_ORG client type
        if (sampleData.sampleType === 'SOIL' && client.clientType === 'GOVT_ORG') {
          dbSampleData.bunot = sampleData.bunot;
          dbSampleData.manchitroUnit = sampleData.manchitroUnit;
          dbSampleData.vumiSrini = sampleData.vumiSrini;
        }

        return dbSampleData;
      });

      // Batch create all samples
      await tx.sample.createMany({
        data: sampleCreateData
      });

      // Return the order ID for final query
      return order.id;
    });

    // Fetch the complete order with all relations (outside transaction for better performance)
    const completeOrder = await prisma.order.findUnique({
      where: { id: result },
      include: {
        client: true,
        operator: true,
        invoice: true,
        samples: {
          include: {
            testResults: {
              include: {
                testParamater: true
              }
            }
          }
        },
        orderItems: {
          include: {
            agroTest: true,
            orderTestParameters: {
              include: {
                testParameter: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(completeOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    
    if (error instanceof PrismaClientKnownRequestError) {
      console.error("Prisma Error Code:", error.code);
      console.error("Prisma Error Message:", error.message);
      console.error("Prisma Error Meta:", error.meta);
      
      if (error.code === 'P2003') {
        return NextResponse.json(
          { 
            error: "Invalid reference: One or more referenced records do not exist",
            details: error.meta,
            code: error.code
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { 
          error: "Database error", 
          code: error.code, 
          message: error.message,
          meta: error.meta 
        },
        { status: 500 }
      );
    }

    if (error instanceof PrismaClientUnknownRequestError) {
      console.error("Unknown Prisma Error:", error.message);
      return NextResponse.json(
        { 
          error: "Unknown database error",
          message: error.message 
        },
        { status: 500 }
      );
    }

    if (error instanceof PrismaClientRustPanicError) {
      console.error("Prisma Rust Panic Error:", error.message);
      return NextResponse.json(
        { 
          error: "Database panic error",
          message: error.message 
        },
        { status: 500 }
      );
    }

    // Handle validation errors
    if (error instanceof Error && error.message.includes("Invalid")) {
      return NextResponse.json(
        { 
          error: "Validation error",
          message: error.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to create order", 
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE order
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // First, get the order with all its relations to ensure they exist
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        samples: {
          include: {
            testResults: true
          }
        },
        orderItems: {
          include: {
            orderTestParameters: true
          }
        },
        invoice: true,
        report: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Delete all related entities in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete test results for all samples
      if (order.samples.length > 0) {
        await tx.testResult.deleteMany({
          where: {
            sampleId: {
              in: order.samples.map(sample => sample.id)
            }
          }
        });
      }

      // Delete samples
      await tx.sample.deleteMany({
        where: { orderId: id }
      });

      // Delete order test parameters for all order items
      if (order.orderItems.length > 0) {
        await tx.orderTestParameter.deleteMany({
          where: {
            orderItemId: {
              in: order.orderItems.map(item => item.id)
            }
          }
        });
      }

      // Delete order items
      await tx.orderItem.deleteMany({
        where: { orderId: id }
      });

      // Delete invoice if it exists
      if (order.invoice) {
        await tx.invoice.delete({
          where: { id: order.invoice.id }
        });
      }

      // Delete report if it exists
      if (order.report) {
        await tx.report.delete({
          where: { id: order.report.id }
        });
      }

      // Finally, delete the order
      return await tx.order.delete({
        where: { id }
      });
    });

    return NextResponse.json(
      { message: "Order and all related data deleted successfully", result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting order:", error);
    
    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json(
        { 
          error: "Database error",
          code: error.code,
          message: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to delete order",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// PUT update order
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        operator: true,
        samples: {
          include: {
            testResults: {
              include: {
                testParamater: true
              }
            }
          }
        },
        orderItems: {
          include: {
            agroTest: true,
            orderTestParameters: {
              include: {
                testParameter: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    
    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json(
        { 
          error: "Database error",
          code: error.code,
          message: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to update order",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
