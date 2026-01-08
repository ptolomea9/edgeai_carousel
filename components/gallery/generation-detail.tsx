'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  Images,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GenerationWithSlides } from '@/lib/supabase'

interface GenerationDetailProps {
  generation: GenerationWithSlides
  onClose: () => void
}

export function GenerationDetail({
  generation,
  onClose,
}: GenerationDetailProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showVideo, setShowVideo] = useState(false)

  const slides = generation.slides
  const hasVideo = !!generation.video_url

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAllImages = () => {
    slides.forEach((slide, index) => {
      setTimeout(() => {
        downloadImage(slide.image_url, `slide-${index + 1}.png`)
      }, index * 500)
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
      >
        <X className="size-6" />
      </button>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main viewer */}
        <div className="lg:col-span-2 space-y-4">
          {/* Toggle between slides and video */}
          {hasVideo && (
            <div className="flex gap-2 justify-center">
              <Button
                variant={!showVideo ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowVideo(false)}
                className={cn(
                  !showVideo
                    ? 'bg-white text-black'
                    : 'bg-black/50 border-gray-700 text-gray-300'
                )}
              >
                <Images className="size-4 mr-2" />
                Slides
              </Button>
              <Button
                variant={showVideo ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowVideo(true)}
                className={cn(
                  showVideo
                    ? 'bg-white text-black'
                    : 'bg-black/50 border-gray-700 text-gray-300'
                )}
              >
                <Play className="size-4 mr-2" />
                Video
              </Button>
            </div>
          )}

          {/* Viewer area */}
          <div className="relative aspect-square bg-gray-900 border border-gray-800">
            {showVideo && generation.video_url ? (
              <video
                src={generation.video_url}
                controls
                autoPlay
                loop
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : slides.length > 0 ? (
              <>
                <Image
                  src={slides[currentSlide].image_url}
                  alt={`Slide ${currentSlide + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />

                {/* Navigation arrows */}
                {slides.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="size-6" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="size-6" />
                    </button>
                  </>
                )}

                {/* Slide indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        index === currentSlide ? 'bg-white' : 'bg-gray-600'
                      )}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500">No slides available</p>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {slides.length > 1 && !showVideo && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    'relative flex-shrink-0 w-16 h-16 border-2 overflow-hidden',
                    index === currentSlide
                      ? 'border-white'
                      : 'border-transparent hover:border-gray-600'
                  )}
                >
                  <Image
                    src={slide.image_url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold capitalize">
              {generation.art_style.replace(/-/g, ' ')} Carousel
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {formatDate(generation.created_at)}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Slides</span>
              <span>{generation.slide_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Style</span>
              <span className="capitalize">
                {generation.art_style.replace(/-/g, ' ')}
              </span>
            </div>
            {hasVideo && (
              <div className="flex justify-between">
                <span className="text-gray-400">Video</span>
                <span className="text-green-400">Available</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button
              onClick={downloadAllImages}
              className="w-full bg-white text-black hover:bg-gray-200"
            >
              <Download className="size-4 mr-2" />
              Download All Images
            </Button>

            {hasVideo && (
              <Button
                onClick={() =>
                  downloadImage(generation.video_url!, 'carousel-video.mp4')
                }
                variant="outline"
                className="w-full bg-black/50 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Download className="size-4 mr-2" />
                Download Video
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500">
            ID: {generation.generation_id}
          </p>
        </div>
      </div>
    </div>
  )
}
