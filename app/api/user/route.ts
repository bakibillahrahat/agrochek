import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth-options"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true
      }
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("[USER_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { name, imageUrl } = body

    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email
      },
      data: {
        name,
        imageUrl
      },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("[USER_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 