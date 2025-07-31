import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SampleType } from '@/lib/generated/prisma-client';
import { unstable_cache } from 'next/cache';

// Cache agrotests for 10 minutes since they change infrequently
const getCachedAgrotests = unstable_cache(
    async () => {
        return await prisma.agrotest.findMany({
            select: {
                id: true,
                name: true,
                sampleType: true,
                createdAt: true,
                updatedAt: true,
                testParameter: {
                    select: {
                        id: true,
                        name: true,
                        unit: true,
                        analysisType: true,
                        comparisonRules: {
                            select: {
                                id: true,
                                min: true,
                                max: true,
                                interpretation: true,
                                type: true,
                                soilCategory: true
                            }
                        },
                        pricing: {
                            select: {
                                id: true,
                                clientType: true,
                                price: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
    },
    ['agrotests-list'],
    { 
        revalidate: 600, // 10 minutes
        tags: ['agrotests']
    }
);

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const sampleType = url.searchParams.get('sampleType') as SampleType;
        const includeParameters = url.searchParams.get('includeParameters') !== 'false';
        const clientType = url.searchParams.get('clientType');

        // Use cached version for simple requests
        if (!sampleType && includeParameters && !clientType) {
            const agrotests = await getCachedAgrotests();
            
            // Transform data to ensure soil category is properly handled
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
        }

        // Build where clause for filtered requests
        const whereClause: any = {};
        if (sampleType) {
            whereClause.sampleType = sampleType;
        }

        // Build select clause based on requirements
        const selectClause: any = {
            id: true,
            name: true,
            sampleType: true,
            createdAt: true,
            updatedAt: true
        };

        if (includeParameters) {
            selectClause.testParameter = {
                select: {
                    id: true,
                    name: true,
                    unit: true,
                    analysisType: true,
                    comparisonRules: {
                        select: {
                            id: true,
                            min: true,
                            max: true,
                            interpretation: true,
                            type: true,
                            soilCategory: true
                        }
                    },
                    pricing: clientType ? {
                        where: {
                            clientType: clientType
                        },
                        select: {
                            id: true,
                            clientType: true,
                            price: true
                        }
                    } : {
                        select: {
                            id: true,
                            clientType: true,
                            price: true
                        }
                    }
                }
            };
        } else {
            selectClause._count = {
                select: {
                    testParameter: true
                }
            };
        }

        const agrotests = await prisma.agrotest.findMany({
            where: whereClause,
            select: selectClause,
            orderBy: {
                name: 'asc'
            }
        });
        
        if (!agrotests || agrotests.length === 0) {
            return NextResponse.json([]);
        }

        // Transform the data to ensure soil category is properly included
        const transformedAgrotests = agrotests.map((test: any) => ({
            ...test,
            testParameter: test.testParameter?.map((param: any) => ({
                ...param,
                comparisonRules: param.comparisonRules?.map((rule: any) => ({
                    ...rule,
                    soilCategory: test.sampleType === SampleType.SOIL ? rule.soilCategory : null
                }))
            }))
        }));

        return NextResponse.json(transformedAgrotests);
    } catch (error) {
        console.error('Error fetching agro tests:', error);
        return NextResponse.json(
            { 
                message: 'Failed to fetch agro tests', 
                error: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
}

// Optimized POST method with better validation and batch operations
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, sampleType, testParameters } = body;

        // Validate required fields
        if (!name || !sampleType || !testParameters || !Array.isArray(testParameters)) {
            return NextResponse.json(
                { message: 'Missing required fields: name, sampleType, testParameters' },
                { status: 400 }
            );
        }

        // Check if agrotest with same name already exists
        const existingAgrotest = await prisma.agrotest.findUnique({
            where: { name },
            select: { id: true }
        });

        if (existingAgrotest) {
            return NextResponse.json(
                { message: 'Agrotest with this name already exists' },
                { status: 409 }
            );
        }

        // Create agrotest with nested test parameters in a single transaction
        const newAgrotest = await prisma.$transaction(async (tx) => {
            // Create the agrotest
            const agrotest = await tx.agrotest.create({
                data: {
                    name,
                    sampleType,
                    testParameter: {
                        create: testParameters.map((param: any) => ({
                            name: param.name,
                            unit: param.unit || null,
                            analysisType: param.analysisType || null,
                            comparisonRules: {
                                create: param.comparisonRules?.map((rule: any) => ({
                                    min: rule.min,
                                    max: rule.max,
                                    interpretation: rule.interpretation,
                                    type: rule.type || 'BETWEEN',
                                    soilCategory: sampleType === SampleType.SOIL ? rule.soilCategory : null
                                })) || []
                            },
                            pricing: {
                                create: param.pricing?.map((price: any) => ({
                                    clientType: price.clientType,
                                    price: price.price
                                })) || []
                            }
                        }))
                    }
                },
                select: {
                    id: true,
                    name: true,
                    sampleType: true,
                    testParameter: {
                        select: {
                            id: true,
                            name: true,
                            unit: true,
                            analysisType: true
                        }
                    }
                }
            });

            return agrotest;
        });

        // Invalidate cache
        // revalidateTag('agrotests'); // Uncomment when using production caching

        return NextResponse.json(newAgrotest, { status: 201 });
    } catch (error) {
        console.error('Error creating agrotest:', error);
        return NextResponse.json(
            { 
                message: 'Failed to create agrotest', 
                error: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
}
