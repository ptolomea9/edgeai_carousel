import type React from "react"
import type { Metadata } from "next"
import { Syne, Outfit, JetBrains_Mono } from "next/font/google"
import { Suspense } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/toaster"
import { AuthProvider } from "@/components/auth/auth-provider"
import "./globals.css"

// Syne: Bold geometric display font for headers — techy and memorable
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
})

// Outfit: Refined geometric sans for body text — clean and modern
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "EdgeAI Carousel Creator",
  description:
    "Generate character-consistent carousel ads with AI. Upload a hero image and create stunning multi-slide carousels with video output.",
  keywords: [
    "AI carousel",
    "carousel generator",
    "AI image generation",
    "character consistent",
    "social media ads",
    "video carousel",
  ],
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
      style={{ backgroundColor: "#000000" }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased" style={{ backgroundColor: "#000000" }}>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={null}>{children}</Suspense>
          </ErrorBoundary>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
