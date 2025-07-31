/**
 * Client-side providers wrapper component
 * This component provides authentication context to the entire application
 */

"use client"

import { SessionProvider } from "next-auth/react"
import { type ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"

interface ProvidersProps {
  children: ReactNode
}

/**
 * Providers component that wraps the application with necessary context providers
 * @param {ProvidersProps} props - Component props
 * @param {ReactNode} props.children - Child components to be rendered
 * @returns {JSX.Element} The providers wrapper component
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
} 