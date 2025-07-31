import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ClientType, SampleType, SoilCategory, AnalysisType } from '@/lib/generated/prisma-client';
import { AgroTest } from '@/app/types/agrotest';

// Define interfaces for our data structures
interface ComparisonRule {
    min: number;
    max: number;
    interpretation: string;
    type?: string;
    soilCategory?: SoilCategory | null;
}

interface Pricing {
    clientType: ClientType;
    price: number;
}

interface TestParameter {
    name: string;
    soilCategory?: SoilCategory | null;
    unit: string;
    analysisType?: AnalysisType | null; // Added analysisType back
    comparisonRules?: ComparisonRule[];
    pricing?: Pricing[];
}

interface AgroTestData {
    name: string;
    sampleType: SampleType;
    testParameters: TestParameter[];
}

// Helper function to validate and convert comparison type
function getComparisonType(type: string | undefined): 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' {
    if (!type) return 'BETWEEN';
    
    switch (type.toUpperCase()) {
        case 'GREATER_THAN':
            return 'GREATER_THAN';
        case 'LESS_THAN':
            return 'LESS_THAN';
        case 'BETWEEN':
            return 'BETWEEN';
        default:
            return 'BETWEEN';
    }
}

export async function GET() {
    try {
        const agrotests = await prisma.agrotest.findMany({
            include: {
                testParameter: {
                    include: {
                        comparisonRules: {
                            select: {
                                id: true,
                                min: true,
                                max: true,
                                interpretation: true,
                                type: true,
                                soilCategory: true,
                                createdAt: true,
                                updatedAt: true
                            }
                        },
                        pricing: true
                    }
                }
            }
        });
        
        if (!agrotests || agrotests.length === 0) {
            return NextResponse.json(
                { message: 'No agro tests found' },
                { status: 404 }
            );
        }

        // Transform the data to ensure soil category is properly included
        const transformedAgrotests = agrotests.map(test => ({
            ...test,
            testParameter: test.testParameter.map(param => ({
                ...param,
                comparisonRules: param.comparisonRules.map(rule => ({
                    ...rule,
                    soilCategory: test.sampleType === SampleType.SOIL ? rule.soilCategory : null
                }))
            }))
        }));

        return NextResponse.json(transformedAgrotests);
    } catch (error) {
        console.error('Error fetching agro tests:', error);
        return NextResponse.json(
            { message: 'Failed to fetch agro tests', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json() as AgroTestData;
        const { name, sampleType, testParameters } = body;

        // Validate required fields
        if (!name || !sampleType) {
            return NextResponse.json(
                { error: 'Name and sampleType are required' },
                { status: 400 }
            );
        }

        if (!testParameters || !Array.isArray(testParameters) || testParameters.length === 0) {
            return NextResponse.json(
                { error: 'At least one test parameter is required' },
                { status: 400 }
            );
        }

        // Check if a test with the same name already exists
        const existingTest = await prisma.agrotest.findUnique({
            where: { name }
        });

        if (existingTest) {
            return NextResponse.json(
                { error: `A test with the name "${name}" already exists` },
                { status: 400 }
            );
        }

        // Validate test parameters
        for (const param of testParameters) {
            if (!param.name || !param.unit) {
                return NextResponse.json(
                    { error: 'Each test parameter must have a name and unit' },
                    { status: 400 }
                );
            }

            // Validate comparison rules for soil test parameters
            if (sampleType === SampleType.SOIL && param.comparisonRules) {
                for (const rule of param.comparisonRules) {
                    if (!rule.soilCategory) {
                        return NextResponse.json(
                            { error: 'Soil category is required for comparison rules of soil test parameters' },
                            { status: 400 }
                        );
                    }
                }
            }
        }

        // Create agro test with test parameters
        const agrotest = await prisma.agrotest.create({
            data: {
                name,
                sampleType,
                testParameter: {
                    create: testParameters.map(param => ({
                        name: param.name,
                        unit: param.unit,
                        analysisType: sampleType === SampleType.FERTILIZER ? param.analysisType : null,
                        comparisonRules: {
                            create: param.comparisonRules?.map((rule: ComparisonRule) => ({
                                min: rule.min,
                                max: rule.max,
                                interpretation: rule.interpretation,
                                type: getComparisonType(rule.type),
                                soilCategory: sampleType === SampleType.SOIL ? rule.soilCategory as SoilCategory : null
                            })) || []
                        },
                        pricing: {
                            create: param.pricing?.map((price: Pricing) => ({
                                clientType: price.clientType,
                                price: price.price
                            })) || []
                        }
                    }))
                }
            },
            include: {
                testParameter: {
                    include: {
                        comparisonRules: {
                            select: {
                                id: true,
                                min: true,
                                max: true,
                                interpretation: true,
                                type: true,
                                soilCategory: true,
                                createdAt: true,
                                updatedAt: true
                            }
                        },
                        pricing: true
                    }
                }
            }
        });

        return NextResponse.json(agrotest, { status: 201 });
    } catch (error) {
        console.error('Error creating agro test:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create agro test' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const body = await request.json() as AgroTestData;
        const { name, sampleType, testParameters } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Test ID is required' },
                { status: 400 }
            );
        }

        // Validate test parameters
        for (const param of testParameters) {
            if (!param.name || !param.unit) {
                return NextResponse.json(
                    { error: 'Each test parameter must have a name and unit' },
                    { status: 400 }
                );
            }

            // Validate comparison rules for soil test parameters
            if (sampleType === SampleType.SOIL && param.comparisonRules) {
                for (const rule of param.comparisonRules) {
                    if (!rule.soilCategory) {
                        return NextResponse.json(
                            { error: 'Soil category is required for comparison rules of soil test parameters' },
                            { status: 400 }
                        );
                    }
                }
            }
        }

        // Use a transaction with increased timeout
        const updatedTest = await prisma.$transaction(async (tx) => {
            // First get all test parameters for this test
            const existingTestParameters = await tx.testParameter.findMany({
                where: { agroTestID: id },
                select: { id: true } // Only select the ID to minimize data transfer
            });

            // Delete all related records in bulk
            if (existingTestParameters.length > 0) {
                const testParameterIds = existingTestParameters.map(param => param.id);
                
                // Delete test results first
                await tx.testResult.deleteMany({
                    where: { testParameterId: { in: testParameterIds } }
                });

                // Delete order test parameters
                await tx.orderTestParameter.deleteMany({
                    where: { testParameterId: { in: testParameterIds } }
                });

                // Delete comparison rules and pricing in parallel
                await Promise.all([
                    tx.comparisonRule.deleteMany({
                        where: { testParameterId: { in: testParameterIds } }
                    }),
                    tx.pricing.deleteMany({
                        where: { testParamterId: { in: testParameterIds } }
                    })
                ]);

                // Delete test parameters
                await tx.testParameter.deleteMany({
                    where: { id: { in: testParameterIds } }
                });
            }

            // Update the agro test
            const updatedAgroTest = await tx.agrotest.update({
                where: { id },
                data: {
                    name,
                    sampleType,
                }
            });

            // Create test parameters with their relations
            for (const param of testParameters) {
                await tx.testParameter.create({
                    data: {
                        name: param.name,
                        unit: param.unit,
                        analysisType: sampleType === SampleType.FERTILIZER ? param.analysisType : null,
                        agroTestID: id,
                        comparisonRules: {
                            create: param.comparisonRules?.map((rule: ComparisonRule) => ({
                                min: rule.min,
                                max: rule.max,
                                interpretation: rule.interpretation,
                                type: getComparisonType(rule.type),
                                soilCategory: sampleType === SampleType.SOIL ? rule.soilCategory as SoilCategory : null
                            })) || []
                        },
                        pricing: {
                            create: param.pricing?.map((price: Pricing) => ({
                                clientType: price.clientType,
                                price: price.price
                            })) || []
                        }
                    }
                });
            }

            // Fetch the updated test with all its relations
            return await tx.agrotest.findUnique({
                where: { id },
                include: {
                    testParameter: {
                        include: {
                            comparisonRules: true,
                            pricing: true
                        }
                    }
                }
            });
        }, {
            timeout: 10000 // Increase timeout to 10 seconds
        });

        if (!updatedTest) {
            throw new Error('Failed to update test');
        }

        return NextResponse.json(updatedTest);
    } catch (error) {
        console.error('Error updating agro test:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update agro test' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Test ID is required' },
                { status: 400 }
            );
        }

        // First check if the agro test exists
        const existingTest = await prisma.agrotest.findUnique({
            where: { id }
        });

        if (!existingTest) {
            return NextResponse.json(
                { error: 'Test not found' },
                { status: 404 }
            );
        }

        // Use a transaction to ensure all operations succeed or fail together
        await prisma.$transaction(async (tx) => {
            // First get all test parameters for this test
            const existingTestParameters = await tx.testParameter.findMany({
                where: { agroTestID: id },
                include: {
                    comparisonRules: true,
                    pricing: true
                }
            });

            // Delete all related records first
            for (const param of existingTestParameters) {
                await tx.comparisonRule.deleteMany({
                    where: { testParameterId: param.id }
                });
                await tx.pricing.deleteMany({
                    where: { testParamterId: param.id }
                });
            }

            // Delete the test parameters
            await tx.testParameter.deleteMany({
                where: { agroTestID: id }
            });

            // Finally delete the agro test
            await tx.agrotest.delete({
                where: { id }
            });
        });

        return NextResponse.json({ message: 'Test and all related data deleted successfully' });
    } catch (error) {
        console.error('Error deleting agro test:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete agro test' },
            { status: 500 }
        );
    }
}