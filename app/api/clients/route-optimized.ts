import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { unstable_cache } from 'next/cache';

const clientSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    address: z.string().optional(),
    clientType: z.enum(['FARMER', 'GOVT_ORG', 'PRIVATE']),
});

// Cache clients list for 5 minutes (300 seconds)
const getCachedClients = unstable_cache(
    async () => {
        return await prisma.client.findMany({
            // Only include necessary fields to reduce data transfer
            select: {
                id: true,
                name: true,
                phone: true,
                address: true,
                clientType: true,
                createdAt: true,
                // Use aggregation instead of including full relations
                _count: {
                    select: {
                        invoices: true,
                        orders: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },
    ['clients-list'],
    { 
        revalidate: 300, // 5 minutes
        tags: ['clients']
    }
);

export async function GET(request: Request) {
    try {
        // Add pagination support
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const search = url.searchParams.get('search');

        // If no search or pagination, use cached version
        if (!search && page === 1 && limit === 50) {
            const clients = await getCachedClients();
            return NextResponse.json(clients);
        }

        // Build dynamic query for search/pagination
        const whereClause = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { phone: { contains: search, mode: 'insensitive' as const } },
                { address: { contains: search, mode: 'insensitive' as const } }
            ]
        } : {};

        const [clients, total] = await Promise.all([
            prisma.client.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    address: true,
                    clientType: true,
                    createdAt: true,
                    _count: {
                        select: {
                            invoices: true,
                            orders: true
                        }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            search ? prisma.client.count({ where: whereClause }) : undefined
        ]);

        const response = {
            clients,
            pagination: {
                page,
                limit,
                total: total || clients.length,
                pages: total ? Math.ceil(total / limit) : 1
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({
            message: 'Failed to fetch clients'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = clientSchema.parse(body);

        // Check for duplicate phone in a single query
        const existingClient = await prisma.client.findUnique({
            where: { phone: validatedData.phone },
            select: { id: true }
        });

        if (existingClient) {
            return NextResponse.json({ 
                message: 'A client with this phone number already exists.' 
            }, { status: 409 });
        }

        const newClient = await prisma.client.create({
            data: validatedData,
            select: {
                id: true,
                name: true,
                phone: true,
                address: true,
                clientType: true,
                createdAt: true
            }
        });

        // Invalidate cache
        // revalidateTag('clients'); // Uncomment when using production caching

        return NextResponse.json(newClient, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                message: 'Validation Error', 
                errors: error.errors 
            }, { status: 400 });
        }

        console.error('Error creating client:', error);
        return NextResponse.json({ 
            message: 'Failed to create client' 
        }, { status: 500 });
    }
}
