import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const operators = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(operators);
  } catch (error) {
    console.error('Error fetching operators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operators' },
      { status: 500 }
    );
  }
} 