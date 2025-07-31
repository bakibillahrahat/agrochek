"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { GalleryVerticalEnd } from "lucide-react"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex items-center gap-2 font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <span>AgriCheck</span>
        </div>
        
        <div className="text-center">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="mt-2 text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            We couldn&apos;t find the page you&apos;re looking for.
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
          <Button
            onClick={() => router.push("/")}
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  )
} 