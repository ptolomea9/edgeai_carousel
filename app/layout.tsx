import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "EdgeAI Carousel - AI-Powered Carousel Ad Creator",
  description:
    "Create stunning carousel ads with AI. Upload your character, choose an art style, add text overlays, and generate professional carousel content for Instagram and TikTok.",
  keywords: [
    "carousel creator",
    "AI image generation",
    "Instagram carousel",
    "TikTok carousel",
    "social media ads",
    "AI art generator",
    "character consistency",
    "RealTPO",
  ],
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
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
      style={{ backgroundColor: "#000000" }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-mono antialiased" style={{ backgroundColor: "#000000" }}>
        {children}
      </body>
    </html>
  )
}
