import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { LoadingProvider } from "@/contexts/loading-context"
import { PreferencesProvider } from "@/contexts/preferences-context"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useEffect, useState } from "react"

const inter = Inter({ subsets: ["latin"] })

import { PortalContainer } from "@/components/PortalContainer";

export const metadata: Metadata = {
  title: "Windchime - Focus & Productivity",
  description: "A beautiful productivity app with ambient sounds, pomodoro timer, tasks, and notes",
  generator: 'v0.dev',
  icons: {
    icon: '/images/windchimefavicon.ico'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <LoadingProvider>
            <AuthProvider>
              <PreferencesProvider>
                <TooltipProvider>
                  {children}
                  <PortalContainer />
                  <Toaster />
                </TooltipProvider>
              </PreferencesProvider>
            </AuthProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
