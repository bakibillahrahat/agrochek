import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { unstable_cache } from 'next/cache';

// Cache reports for 5 minutes
const getCachedReports = unstable_cache(
    async () => {
        return await prisma.report.findMany({
            select: {
                id: true,
                issueDate: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                client: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        clientType: true
                    }
                },
                order: {
                    select: {
                        id: true,
                        sarokNumber: true,
                        orderDate: true
                    }
                },
                _count: {
                    select: {
                        samples: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    },
    ['reports-list'],
    { 
        revalidate: 300, // 5 minutes
        tags: ['reports']
    }
);

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const clientId = url.searchParams.get('clientId');
        const status = url.searchParams.get('status');
        const includeDetails = url.searchParams.get('includeDetails') === 'true';

        // Use cached version for simple list requests
        if (!clientId && !status && !includeDetails && page === 1 && limit === 20) {
            const reports = await getCachedReports();
            return NextResponse.json(reports);
        }

        // Build where clause
        const whereClause: any = {};
        if (clientId) whereClause.clientId = clientId;
        if (status) whereClause.status = status;

        // Build select clause based on requirements
        const selectClause: any = {
            id: true,
            issueDate: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            client: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    clientType: true
                }
            },
            order: {
                select: {
                    id: true,
                    sarokNumber: true,
                    orderDate: true
                }
            }
        };

        if (includeDetails) {
            selectClause.samples = {
                select: {
                    id: true,
                    sampleIdNumber: true,
                    sampleType: true,
                    collectionDate: true,
                    collectionLocation: true,
                    cropType: true,
                    status: true,
                    testResults: {
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
                                    unit: true
                                }
                            }
                        }
                    }
                }
            };
        } else {
            selectClause._count = {
                select: {
                    samples: true
                }
            };
        }

        // Execute optimized query with pagination
        const [reports, total] = await Promise.all([
            prisma.report.findMany({
                where: whereClause,
                select: selectClause,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.report.count({ where: whereClause })
        ]);

        return NextResponse.json({
            reports,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        
        // Check if it's a Prisma initialization error
        if (error instanceof Error && error.message.includes('PrismaClient')) {
            return NextResponse.json(
                { error: 'Database connection error' },
                { status: 503 }
            );
        }

        // Handle other types of errors
        return NextResponse.json(
            { 
                error: 'Failed to fetch reports', 
                message: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
}
