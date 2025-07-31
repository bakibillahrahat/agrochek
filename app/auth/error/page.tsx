"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, Suspense } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get("error")

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Authentication Error</h1>
          <p className="mt-2 text-muted-foreground">
            {error || "An error occurred during authentication"}
          </p>
        </div>
        <Button onClick={() => router.push("/auth/sign-in")}>
          Return to Sign In
        </Button>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
} 