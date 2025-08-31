import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { WebSocketProvider } from "@/components/websocket-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "System Monitor",
  description: "System resource monitoring realtime"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}