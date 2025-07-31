import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { message: 'Phone number is required' },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { phone },
    });

    return NextResponse.json({
      exists: !!client,
      client: client || null,
    });
  } catch (error) {
    console.error('Error checking client:', error);
    return NextResponse.json(
      { message: 'Failed to check client' },
      { status: 500 }
    );
  }
} 