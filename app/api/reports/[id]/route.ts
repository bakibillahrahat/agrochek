import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { ReportStatus } from '@/lib/generated/prisma-client'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(
  request: Request,
  context: any
) {
  try {
    const params = await context.params;
    const id = params.id;

    const report = await prisma.report.findUnique({
      where: {
        id: id
      },
      include: {
        samples: {
          include: {
            orderItem: {
              include: {
                agroTest: true,
                orderTestParameters: {
                  include: {
                    testParameter: {
                      include: {
                        comparisonRules: true
                      }
                    }
                  }
                }
              }
            },
            testResults: {
              include: {
                testParamater: {
                  include: {
                    comparisonRules: true
                  }
                }
              }
            }
          }
        },
        client: true,
        order: true
      }
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Transform the data to match the expected structure
    const transformedReport = {
      ...report,
      samples: report.samples.map(sample => ({
        ...sample,
        orderItem: {
          ...sample.orderItem,
          orderTestParameters: sample.orderItem.orderTestParameters.map(param => ({
            ...param,
            testResults: sample.testResults.find(
              result => result.testParamater.id === param.testParameter.id
            )
          }))
        }
      }))
    }

    return NextResponse.json(transformedReport)
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: any
) {
  try {
    const { status } = await request.json()
    const params = await context.params;
    const id = params.id;
    // Validate status
    if (!Object.values(ReportStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    const updatedReport = await prisma.report.update({
      where: {
        id: id
      },
      data: {
        status
      }
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    )
  }
}


export async function DELETE(
  request: Request,
  context: any
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const params = await context.params;
  const { id: reportId } = params;

  if (!reportId) {
    return NextResponse.json({ message: 'Report ID is required' }, { status: 400 });
  }

  // Placeholder for authorizatio

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update Orders linked to this report
      await tx.order.updateMany({
        where: { reportId: reportId },
        data: { reportId: null },
      });

      // 2. Update Invoices linked to this report
      await tx.invoice.updateMany({
        where: { reportId: reportId },
        data: { reportId: null },
      });
      
      // 3. Update Samples linked to this report
      await tx.sample.updateMany({
        where: { reportId: reportId },
        data: { reportId: null },
      });

      // 4. Delete the report
      const deletedReport = await tx.report.delete({
        where: { id: reportId },
      });

      // Prisma throws an error if the record to delete is not found (P2025)
      // So, an explicit check for !deletedReport might be redundant if Prisma handles it.
    });

    return NextResponse.json({ message: 'Report deleted successfully' }, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2025') { // P2025 is Prisma's code for "Record to delete does not exist."
      return NextResponse.json({ message: 'Report not found' }, { status: 404 });
    }
    console.error('Error deleting report:', error);
    return NextResponse.json({ message: 'Error deleting report', error: error.message }, { status: 500 });
  }
}

