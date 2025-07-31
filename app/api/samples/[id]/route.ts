import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { SampleStatus, ComparisonType, SampleType, SoilCategory, ReportStatus, OrderStatus } from '@/lib/generated/prisma-client'

function getInterpretation(
  value: number | null,
  rules: any[],
  sampleType: SampleType,
  soilCategory?: SoilCategory | null
): string | null {
  console.log('getInterpretation called with:', { value, sampleType, rulesCount: rules?.length });
  
  if (!rules || rules.length === 0 || value === null) {
    console.log('Early return: no rules or null value');
    return null;
  }
  
  // Filter rules based on sample type and soil category
  const applicableRules = rules.filter(rule => {
    // For soil samples, check soil category
    if (sampleType === 'SOIL') {
      // If rule has no soil category specified, it applies to all categories
      if (!rule.soilCategory) return true;
      // If soil category is BOTH, use the rule
      if (soilCategory === 'BOTH') return true;
      // Otherwise, match the specific soil category
      return rule.soilCategory === soilCategory;
    }
    // For water and fertilizer samples, use rules without soil category
    return !rule.soilCategory;
  });

  if (applicableRules.length === 0) {
    console.log('No applicable rules found');
    return null;
  }

  console.log('Applicable rules:', applicableRules.length);

  // Special logic for fertilizer samples
  if (sampleType === 'FERTILIZER') {
    console.log('Processing FERTILIZER sample with special logic');
    // Check if any rule is satisfied
    for (const rule of applicableRules) {
      console.log('Checking rule:', rule);
      let isInRange = false;
      
      switch (rule.type) {
        case ComparisonType.BETWEEN:
          if (rule.min !== null && rule.max !== null) {
            isInRange = value >= rule.min && value <= rule.max;
          }
          break;
        case ComparisonType.GREATER_THAN:
          if (rule.min !== null) {
            isInRange = value > rule.min;
          }
          break;
        case ComparisonType.LESS_THAN:
          if (rule.max !== null) {
            isInRange = value < rule.max;
          }
          break;
        default:
          continue;
      }
      
      if (rule.interpretation) {
        console.log('Rule has interpretation:', rule.interpretation);
        console.log('Is value in range?', isInRange);
        if (isInRange) {
          // Rule is satisfied, return the rule's interpretation
          console.log('Rule satisfied, returning:', rule.interpretation);
          return rule.interpretation;
        }
      }
    }
    
    // If no rule is satisfied, return the alternate interpretation of the first rule
    if (applicableRules.length > 0 && applicableRules[0].interpretation) {
      const firstRuleInterpretation = applicableRules[0].interpretation;
      console.log('No rule satisfied, using alternate of first rule:', firstRuleInterpretation);
      if (firstRuleInterpretation === 'ভেজালমুক্ত') {
        console.log('Returning alternate: ভেজাল');
        return 'ভেজাল';
      } else if (firstRuleInterpretation === 'ভেজাল') {
        console.log('Returning alternate: ভেজালমুক্ত');
        return 'ভেজালমুক্ত';
      }
      // If interpretation is neither, return the rule interpretation as fallback
      console.log('Returning fallback:', firstRuleInterpretation);
      return firstRuleInterpretation;
    }
    
    console.log('No fertilizer interpretation found, returning null');
    return null;
  }

  // Original logic for soil and water samples
  for (const rule of applicableRules) {
    let isInRange = false;
    
    switch (rule.type) {
      case ComparisonType.BETWEEN:
        if (rule.min !== null && rule.max !== null) {
          isInRange = value >= rule.min && value <= rule.max;
        }
        break;
      case ComparisonType.GREATER_THAN:
        if (rule.min !== null) {
          isInRange = value > rule.min;
        }
        break;
      case ComparisonType.LESS_THAN:
        if (rule.max !== null) {
          isInRange = value < rule.max;
        }
        break;
      default:
        continue;
    }
    
    if (isInRange && rule.interpretation) {
      return rule.interpretation;
    }
  }
  
  return null;
}

async function checkAndCreateReport(orderId: string, tx: any) {
  try {
    console.log('Starting checkAndCreateReport for order:', orderId);
    
    // Get the order with all its samples within the same transaction
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        samples: true,
        client: true,
        operator: true,
        invoice: true,
        report: true
      }
    });

    if (!order) {
      console.error('Order not found:', orderId);
      throw new Error('Order not found');
    }

    // Check if all samples are completed
    const allSamplesCompleted = order.samples.every(
      (sample: { status: SampleStatus }) => sample.status === SampleStatus.TEST_COMPLETED
    );

    console.log('Sample status check:', {
      totalSamples: order.samples.length,
      completedSamples: order.samples.filter((s: { status: SampleStatus }) => s.status === SampleStatus.TEST_COMPLETED).length,
      allCompleted: allSamplesCompleted
    });

    if (!allSamplesCompleted) {
      console.log('Not all samples are completed yet');
      return null;
    }

    // Generate a unique report number
    const reportNumber = `REP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let report;

    if (order.report) {
      // Update existing report
      report = await tx.report.update({
        where: { id: order.report.id },
        data: {
          updatedAt: new Date(),
          status: ReportStatus.DRAFT
        }
      });
      console.log('Updated existing report:', report.id);
    } else {
      // Create new report
      report = await tx.report.create({
        data: {
          reportNumber,
          order: { connect: { id: orderId } },
          client: { connect: { id: order.clientId } },
          invoice: { connect: { id: order.invoiceId } },
          generator: { connect: { id: order.operatorId } },
          status: ReportStatus.DRAFT
        }
      });
      console.log('Created new report:', report.id);
    }

    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: { 
        status: OrderStatus.REPORT_GENERATED,
        report: { connect: { id: report.id } }
      }
    });

    // Update all samples to REPORT_READY status one by one
    for (const sample of order.samples) {
      // First, disconnect any existing report connection
      await tx.sample.update({
        where: { id: sample.id },
        data: {
          report: { disconnect: true }
        }
      });

      // Then connect to the new report
      await tx.sample.update({
        where: { id: sample.id },
        data: {
          status: SampleStatus.REPORT_READY,
          report: { connect: { id: report.id } }
        }
      });
    }

    console.log('Report created/updated successfully:', report.id);
    return report;

  } catch (error) {
    console.error('Error in checkAndCreateReport:', error);
    throw error;
  }
}

export async function PUT(
  request: Request,
  context: any
) {
  try {
    console.log('PUT request received for sample update');
    const body = await request.json()
    const { testResults } = body
    const params = await context.params;
    const id = params.id;

    console.log('Sample ID:', id);
    console.log('Test Results:', testResults);

    if (!testResults || !Array.isArray(testResults)) {
      console.log('Invalid test results data');
      return NextResponse.json(
        { error: 'Invalid request data', message: 'Test results array is required' },
        { status: 400 }
      )
    }

    // Get the sample with its associated order item
    const sample = await prisma.sample.findUnique({
      where: { id },
      include: {
        orderItem: {
          include: {
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
        }
      }
    })

    if (!sample) {
      return NextResponse.json(
        { error: 'Sample not found', message: 'The specified sample does not exist' },
        { status: 404 }
      )
    }

    if (!sample.orderItem) {
      return NextResponse.json(
        { error: 'Invalid sample', message: 'Sample is not associated with any order item' },
        { status: 400 }
      )
    }

    // Get the test parameters for this order item
    const orderedParameters = sample.orderItem.orderTestParameters.map(otp => otp.testParameter)

    // Update test results
    const updatedResults = await prisma.$transaction(
      async (tx) => {
        const results = []

        for (const result of testResults) {
          const { testParameterId, value } = result
          console.log('Processing test result:', { testParameterId, value });

          if (!testParameterId) {
            throw new Error('Test parameter ID is required')
          }

          // Find the test parameter
          const testParameter = orderedParameters.find(p => p.id === testParameterId)
          if (!testParameter) {
            throw new Error(`Test parameter ${testParameterId} was not ordered for this sample`)
          }

          console.log('Found test parameter:', testParameter.name);
          console.log('Sample type:', sample.sampleType);
          console.log('Comparison rules:', testParameter.comparisonRules);

          // Find existing test result
          const existingResult = await tx.testResult.findFirst({
            where: {
              sampleId: id,
              testParameterId
            },
            select: { id: true }
          })

          console.log('Existing result:', existingResult);

          // Parse the value
          const parsedValue = parseFloat(value)
          if (isNaN(parsedValue)) {
            throw new Error(`Invalid value for test parameter ${testParameter.name}`)
          }

          console.log('Parsed value:', parsedValue);

          // Generate interpretations based on sample type
          let valueData = {}
          
          if (sample.sampleType === 'SOIL') {
            // For soil samples, check each soil category
            const bothRules = testParameter.comparisonRules.filter(rule => rule.soilCategory === 'BOTH')
            const uplandRules = testParameter.comparisonRules.filter(rule => rule.soilCategory === 'UPLAND')
            const wetlandRules = testParameter.comparisonRules.filter(rule => rule.soilCategory === 'WETLAND')

            // Get interpretation for BOTH category if rules exist
            const bothInterpretation = bothRules.length > 0 ? getInterpretation(
              parsedValue,
              bothRules,
              'SOIL',
              'BOTH'
            ) : null

            // Get separate interpretations for UPLAND and WETLAND if rules exist
            const uplandInterpretation = uplandRules.length > 0 ? getInterpretation(
              parsedValue,
              uplandRules,
              'SOIL',
              'UPLAND'
            ) : null

            const wetlandInterpretation = wetlandRules.length > 0 ? getInterpretation(
              parsedValue,
              wetlandRules,
              'SOIL',
              'WETLAND'
            ) : null

            // If BOTH interpretation exists, use it for both categories
            if (bothInterpretation) {
              valueData = {
                value: parsedValue,
                interpretation: null,
                wetlandInterpretation: bothInterpretation,
                uplandInterpretation: bothInterpretation
              }
            } else {
              // Otherwise use separate interpretations
              valueData = {
                value: parsedValue,
                interpretation: null,
                wetlandInterpretation,
                uplandInterpretation
              }
            }
          } else {
            // For water and fertilizer samples
            console.log('Processing non-soil sample:', sample.sampleType);
            const interpretation = getInterpretation(
              parsedValue,
              testParameter.comparisonRules,
              sample.sampleType
            )

            console.log('Generated interpretation:', interpretation);

            valueData = {
              value: parsedValue,
              interpretation,
              wetlandInterpretation: null,
              uplandInterpretation: null
            }
          }

          console.log('Value data to save:', valueData);

          // Update or create the test result
          const updatedResult = existingResult
            ? await tx.testResult.update({
                where: { id: existingResult.id },
                data: valueData,
                include: {
                  sample: true,
                  testParamater: {
                    select: {
                      id: true,
                      name: true,
                      unit: true,
                      comparisonRules: {
                        select: {
                          soilCategory: true
                        }
                      }
                    }
                  }
                }
              })
            : await tx.testResult.create({
                data: {
                  sample: { connect: { id } },
                  testParamater: { connect: { id: testParameterId } },
                  ...valueData
                },
                include: {
                  sample: true,
                  testParamater: {
                    select: {
                      id: true,
                      name: true,
                      unit: true,
                      comparisonRules: {
                        select: {
                          soilCategory: true
                        }
                      }
                    }
                  }
                }
              })

          results.push(updatedResult)
        }

        // Update sample status to TEST_COMPLETED if all test results are submitted
        const totalOrderedParameters = orderedParameters.length
        if (results.length === totalOrderedParameters) {
          // Update sample status
          const updatedSample = await tx.sample.update({
            where: { id },
            data: { status: SampleStatus.TEST_COMPLETED }
          })

          // Get all samples for the order
          const orderSamples = await tx.sample.findMany({
            where: { orderId: updatedSample.orderId }
          })

          const allSamplesCompleted = orderSamples.every(
            sample => sample.status === SampleStatus.TEST_COMPLETED
          )

          if (allSamplesCompleted) {
            await checkAndCreateReport(updatedSample.orderId, tx)
          }
        }

        return results
      },
      {
        timeout: 30000 // Set timeout to 30 seconds
      }
    )

    return NextResponse.json(updatedResults)
  } catch (error) {
    console.error('Error updating test results:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to update test results',
          message: error.message
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to update test results',
        message: 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: any
) {
  try {
    const body = await request.json()
    const params = await context.params;
    const id = params.id;

    // Get the current sample to check conditions
    const currentSample = await prisma.sample.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            client: true
          }
        }
      }
    });

    if (!currentSample) {
      return NextResponse.json(
        { error: 'Sample not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Only allow these fields for SOIL samples with GOVT_ORG clients
    if (currentSample.sampleType === 'SOIL' && currentSample.order.client.clientType === 'GOVT_ORG') {
      if (body.bunot !== undefined) updateData.bunot = body.bunot;
      if (body.manchitroUnit !== undefined) updateData.manchitroUnit = body.manchitroUnit;
      if (body.vumiSrini !== undefined) updateData.vumiSrini = body.vumiSrini;
    }

    // Always allow these basic fields
    if (body.collectionLocation !== undefined) updateData.collectionLocation = body.collectionLocation;
    if (body.cropType !== undefined) updateData.cropType = body.cropType;
    if (body.collectionDate !== undefined) updateData.collectionDate = new Date(body.collectionDate);

    const updatedSample = await prisma.sample.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          include: {
            client: true
          }
        },
        orderItem: {
          include: {
            agroTest: true
          }
        }
      }
    });

    return NextResponse.json(updatedSample);
  } catch (error) {
    console.error('Error updating sample:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update sample',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}