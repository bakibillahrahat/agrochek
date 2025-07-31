import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { OrderStatus } from '@/lib/generated/prisma-client'
import { unstable_cache } from 'next/cache';

// Cache samples for 3 minutes
const getCachedSamples = unstable_cache(
    async () => {
        return await prisma.sample.findMany({
            where: {
                order: {
                    status: {
                        not: OrderStatus.PENDING
                    }
                }
            },
            select: {
                id: true,
                sampleIdNumber: true,
                collectionDate: true,
                sampleType: true,
                collectionLocation: true,
                cropType: true,
                status: true,
                createdAt: true,
                orderItem: {
                    select: {
                        id: true,
                        agroTest: {
                            select: {
                                id: true,
                                name: true,
                                sampleType: true
                            }
                        }
                    }
                },
                order: {
                    select: {
                        id: true,
                        sarokNumber: true,
                        client: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                                clientType: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        testResults: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    },
    ['samples-list'],
    { 
        revalidate: 180, // 3 minutes
        tags: ['samples']
    }
);

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const status = url.searchParams.get('status');
        const sampleType = url.searchParams.get('sampleType');
        const clientId = url.searchParams.get('clientId');
        const includeTestResults = url.searchParams.get('includeTestResults') === 'true';

        // Use cached version for simple requests
        if (!status && !sampleType && !clientId && !includeTestResults && page === 1 && limit === 20) {
            const samples = await getCachedSamples();
            return NextResponse.json(samples);
        }

        // Build where clause
        const whereClause: any = {
            order: {
                status: {
                    not: OrderStatus.PENDING
                }
            }
        };

        if (status) whereClause.status = status;
        if (sampleType) whereClause.sampleType = sampleType;
        if (clientId) whereClause.order.clientId = clientId;

        // Build select clause based on requirements
        const selectClause: any = {
            id: true,
            sampleIdNumber: true,
            collectionDate: true,
            sampleType: true,
            collectionLocation: true,
            cropType: true,
            status: true,
            createdAt: true,
            bunot: true,
            manchitroUnit: true,
            vumiSrini: true,
            orderItem: {
                select: {
                    id: true,
                    agroTest: {
                        select: {
                            id: true,
                            name: true,
                            sampleType: true
                        }
                    }
                }
            },
            order: {
                select: {
                    id: true,
                    sarokNumber: true,
                    client: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            clientType: true
                        }
                    }
                }
            }
        };

        // Conditionally include test results with optimized query
        if (includeTestResults) {
            selectClause.testResults = {
                select: {
                    id: true,
                    value: true,
                    interpretation: true,
                    uplandInterpretation: true,
                    wetlandInterpretation: true,
                    analysisType: true,
                    testParamater: {
                        select: {
                            id: true,
                            name: true,
                            unit: true,
                            comparisonRules: {
                                select: {
                                    id: true,
                                    min: true,
                                    max: true,
                                    interpretation: true,
                                    type: true,
                                    soilCategory: true
                                }
                            }
                        }
                    }
                }
            };
        } else {
            selectClause._count = {
                select: {
                    testResults: true
                }
            };
        }

        // Execute optimized query with pagination
        const [samples, total] = await Promise.all([
            prisma.sample.findMany({
                where: whereClause,
                select: selectClause,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.sample.count({ where: whereClause })
        ]);

        // Transform results if test results are included
        const transformedSamples = includeTestResults ? samples.map(sample => ({
            ...sample,
            testResults: sample.testResults?.map((result: any) => {
                const comparisonRule = result.testParamater.comparisonRules[0];
                return {
                    id: result.id,
                    testParameterId: result.testParameterId,
                    value: result.value,
                    interpretation: result.interpretation,
                    uplandInterpretation: result.uplandInterpretation,
                    wetlandInterpretation: result.wetlandInterpretation,
                    analysisType: result.analysisType,
                    testParamater: {
                        id: result.testParamater.id,
                        name: result.testParamater.name,
                        unit: result.testParamater.unit,
                        soilCategory: comparisonRule?.soilCategory || null
                    }
                };
            })
        })) : samples;

        return NextResponse.json({
            samples: transformedSamples,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching samples:', error);
        
        if (error instanceof Error && error.message === 'Database connection error') {
            return NextResponse.json(
                { 
                    error: 'Database connection error',
                    message: 'Unable to connect to the database. Please try again later.'
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { 
                error: 'Failed to fetch samples', 
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
