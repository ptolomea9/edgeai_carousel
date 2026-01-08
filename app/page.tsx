import { CarouselCreator } from "@/components/carousel-creator"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "EdgeAI Carousel Creator",
  description:
    "Generate character-consistent carousel ads with AI. Upload a hero image and create stunning multi-slide carousels with video output.",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <CarouselCreator />
    </main>
  )
}
