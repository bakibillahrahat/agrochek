import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sarokNumber = searchParams.get("sarokNumber");

    if (!sarokNumber) {
      return NextResponse.json(
        { error: "Sarok number is required" },
        { status: 400 }
      );
    }

    // Check if sarokNumber already exists
    const existingOrder = await prisma.order.findUnique({
      where: { sarokNumber: sarokNumber.trim() }
    });

    return NextResponse.json({
      exists: !!existingOrder,
      sarokNumber: sarokNumber.trim()
    });

  } catch (error) {
    console.error("Error checking sarok number:", error);
    return NextResponse.json(
      { error: "Failed to check sarok number" },
      { status: 500 }
    );
  }
}
