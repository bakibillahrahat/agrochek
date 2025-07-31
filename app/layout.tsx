/**
 * Root layout component for the AgriCheck application.
 * This component wraps all pages and provides global configurations.
 */

import { Inter } from "next/font/google";
import { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { Providers } from "./providers";

// Initialize Inter font with Latin subset for optimal performance
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Optimize font loading
});

// Metadata configuration for SEO and browser display
export const metadata: Metadata = {
  title: "AgriCheck",
  description: "Agricultural Testing Laboratory Management System",
};

// Viewport configuration for responsive design
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16a34a", // Green-600 color for theme
};

/**
 * Root layout component that provides the base structure for all pages
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be rendered
 * @returns {JSX.Element} The root layout component
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className="antialiased min-h-screen bg-background text-foreground"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <Toaster 
          richColors 
          position="top-right"
          closeButton
          expand={false}
        />
      </body>
    </html>
  );
}
