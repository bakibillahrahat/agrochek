import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const testParameters = await prisma.testParameter.findMany({
      include: {
        comparisonRules: true,
        pricing: true
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(testParameters);
  } catch (error) {
    console.error('Error fetching test parameters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test parameters' },
      { status: 500 }
    );
  }
} 