import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SampleStatus } from '@/lib/generated/prisma-client';

export async function PATCH(
  request: Request,
  context: any
) {
  try {
    const { status } = await request.json();
    const params = await context.params;
    const { id } = params;

    // Validate status
    if (!Object.values(SampleStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const updatedSample = await prisma.sample.update({
      where: { id: params.id },
      data: { status },
      include: {
        orderItem: {
          include: {
            agroTest: true,
            orderTestParameters: {
              include: {
                testParameter: {
                  include: {
                    agroTest: true
                  }
                }
              }
            }
          }
        },
        order: {
          select: {
            client: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        },
        testResults: {
          include: {
            testParamater: {
              include: {
                agroTest: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedSample);
  } catch (error) {
    console.error('Error updating sample status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
} 