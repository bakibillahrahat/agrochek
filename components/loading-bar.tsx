"use client"

import { useEffect } from "react"
import NProgress from "nprogress"
import { usePathname, useSearchParams } from "next/navigation"

// Import custom nprogress styles
import "@/app/styles/nprogress.css"

// Configure nprogress
NProgress.configure({
  minimum: 0.1,
  easing: "ease-in-out",
  speed: 500,
  showSpinner: false,
  trickle: true,
  trickleSpeed: 200,
})

export function LoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    NProgress.start()
    
    // Add a small delay before completing to ensure smooth transition
    const timer = setTimeout(() => {
      NProgress.done()
    }, 100)

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  return null
} 