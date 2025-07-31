import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
    try {
        const reports = await prisma.report.findMany({
            include: {
                client: {
                    select: {
                        name: true,
                        phone: true
                    }
                },
                order: {
                    select: {
                        id: true
                    }
                },
                samples: {
                    include: {
                        testResults: {
                            select: {
                                id: true,
                                value: true,
                                interpretation: true,
                                uplandInterpretation: true,
                                wetlandInterpretation: true,
                                testParamater: {
                                    select: {
                                        name: true,
                                        unit: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(reports)
    } catch (error) {
        console.error('Error fetching reports:', error)
        
        // Check if it's a Prisma initialization error
        if (error instanceof Error && error.message.includes('PrismaClient')) {
            return NextResponse.json(
                { error: 'Database connection error' },
                { status: 503 }
            )
        }

        // Handle other types of errors
        return NextResponse.json(
            { error: 'Failed to fetch reports', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
