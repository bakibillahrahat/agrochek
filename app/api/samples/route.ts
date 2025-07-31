import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { OrderStatus, SampleType, SampleStatus, ReportStatus, SoilCategory } from '@/lib/generated/prisma-client'
import { compareTestResults } from '@/lib/utils/testComparison'

interface ComparisonResult {
  parameterName: string;
  unit: string | null;
  value: number | null;
  interpretation: string | null;
  status: 'NORMAL' | 'ABNORMAL' | 'UNKNOWN';
}

interface TestParameter {
  id: string;
  name: string;
  unit: string | null;
  comparisonRules: {
    soilCategory: SoilCategory | null;
  }[];
}

export async function GET() {
  try {
    const samples = await prisma.sample.findMany({
      where: {
        order: {
          status: {
            not: OrderStatus.PENDING
          }
        }
      },
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
        order: {
          include: {
            client: true
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the results to include soil category specific values
    const transformedSamples = samples.map(sample => ({
      ...sample,
      testResults: sample.testResults.map(result => {
        const comparisonRule = result.testParamater.comparisonRules[0]
        return {
          id: result.id,
          testParameterId: result.testParameterId,
          value: result.value,
          testParamater: {
            id: result.testParamater.id,
            name: result.testParamater.name,
            unit: result.testParamater.unit,
            soilCategory: comparisonRule?.soilCategory || null
          }
        }
      })
    }))

    return NextResponse.json(transformedSamples)
  } catch (error) {
    console.error('Error fetching samples:', error)
    
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
        error: 'Failed to fetch samples',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
