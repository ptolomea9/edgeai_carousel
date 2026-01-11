'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, Download, ExternalLink, Loader2, Play, Images, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { GenerationStatus, GeneratedSlide } from './types'

interface CarouselPreviewProps {
  status: GenerationStatus | null
  className?: string
}

export function CarouselPreview({ status, className }: CarouselPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [videoLoading, setVideoLoading] = useState(true)
  const [videoError, setVideoError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const slides = status?.results?.slides || []
  const hasSlides = slides.length > 0
  const hasVideo = !!status?.results?.videoUrl

  // Helper to get the best image URL (prefer text-baked for display)
  const getDisplayUrl = (slide: GeneratedSlide) => slide.processedImageUrl || slide.imageUrl

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const downloadSlide = async (slide: GeneratedSlide) => {
    try {
      // Download text-baked image when available
      const imageUrl = getDisplayUrl(slide)
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `carousel-slide-${slide.slideNumber}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const downloadAll = async () => {
    if (status?.results?.zipUrl) {
      window.open(status.results.zipUrl, '_blank')
    }
  }

  // Empty state
  if (!status) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 border border-gray-700 bg-black/30 min-h-[400px]',
          className
        )}
      >
        <div className="text-gray-500 text-center">
          <div className="text-4xl mb-3">🎨</div>
          <p className="text-sm">Your carousel preview will appear here</p>
          <p className="text-xs text-gray-600 mt-1">
            Configure your settings and click Generate
          </p>
        </div>
      </div>
    )
  }

  // Loading state
  if (status.status !== 'complete' && status.status !== 'error') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 border border-gray-700 bg-black/30 min-h-[400px]',
          className
        )}
      >
        <Loader2 className="size-10 text-white animate-spin mb-4" />
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-300">{status.message || 'Generating...'}</p>
          {status.currentSlide && status.totalSlides && (
            <p className="text-xs text-gray-500">
              Slide {status.currentSlide} of {status.totalSlides}
            </p>
          )}
          <Progress value={status.progress} className="w-48 h-1" />
          <p className="text-xs text-gray-600">{status.progress}%</p>
        </div>
      </div>
    )
  }

  // Error state
  if (status.status === 'error') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 border border-red-900/50 bg-red-950/20 min-h-[400px]',
          className
        )}
      >
        <div className="text-red-400 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm">Generation failed</p>
          <p className="text-xs text-red-500/70 mt-1">{status.error}</p>
        </div>
      </div>
    )
  }

  // Results state
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">
          Generated Carousel
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadAll}
            className="bg-black/50 border-gray-600 text-gray-300 hover:bg-black hover:text-white"
          >
            <Download className="size-3 mr-1" />
            Download All
          </Button>
        </div>
      </div>

      {/* Toggle between slides and video */}
      {hasVideo && hasSlides && (
        <div className="flex gap-2 justify-center">
          <Button
            variant={!showVideo ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowVideo(false)}
            className={cn(
              'rounded-lg',
              !showVideo
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-black/50 border-gray-600 text-gray-300 hover:bg-black hover:text-white'
            )}
          >
            <Images className="size-4 mr-2" />
            Slides
          </Button>
          <Button
            variant={showVideo ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setVideoLoading(true)
              setVideoError(null)
              setShowVideo(true)
            }}
            className={cn(
              'rounded-lg',
              showVideo
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-black/50 border-gray-600 text-gray-300 hover:bg-black hover:text-white'
            )}
          >
            <Play className="size-4 mr-2" />
            Video
          </Button>
        </div>
      )}

      {/* Main preview */}
      <div className="relative aspect-square bg-black border border-gray-700 overflow-hidden">
        {showVideo && status?.results?.videoUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {videoLoading && !videoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <Loader2 className="size-8 animate-spin text-gray-400" />
              </div>
            )}
            {videoError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-center p-4">
                <AlertCircle className="size-10 text-red-400 mb-3" />
                <p className="text-red-400 font-medium text-sm">Video playback error</p>
                <p className="text-gray-500 text-xs mt-1">{videoError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(status.results?.videoUrl!, '_blank')}
                  className="mt-3 bg-black/50 border-gray-600 text-gray-300"
                >
                  <ExternalLink className="size-3 mr-1" />
                  Open in New Tab
                </Button>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={status.results.videoUrl}
                controls
                loop
                playsInline
                onLoadedData={() => setVideoLoading(false)}
                onError={(e) => {
                  setVideoLoading(false)
                  const target = e.target as HTMLVideoElement
                  setVideoError(target.error?.message || 'Failed to load video')
                }}
                className="absolute inset-0 w-full h-full object-contain"
              >
                Your browser does not support video playback.
              </video>
            )}
          </div>
        ) : hasSlides && (
          <>
            <img
              src={getDisplayUrl(slides[currentSlide])}
              alt={`Slide ${currentSlide + 1}`}
              className="w-full h-full object-contain"
            />

            {/* Navigation */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center bg-black/70 border border-white/20 text-white hover:bg-black transition-colors"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center bg-black/70 border border-white/20 text-white hover:bg-black transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              </>
            )}

            {/* Slide indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={cn(
                    'size-2 rounded-full transition-colors',
                    idx === currentSlide ? 'bg-white' : 'bg-white/30'
                  )}
                />
              ))}
            </div>

            {/* Download current */}
            <button
              onClick={() => downloadSlide(slides[currentSlide])}
              className="absolute top-2 right-2 size-8 flex items-center justify-center bg-black/70 border border-white/20 text-white hover:bg-black transition-colors"
            >
              <Download className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip - only show when viewing slides */}
      {!showVideo && hasSlides && slides.length > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-2">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={cn(
                'flex-shrink-0 w-16 h-16 border transition-colors overflow-hidden',
                idx === currentSlide
                  ? 'border-white'
                  : 'border-gray-700 opacity-60 hover:opacity-100'
              )}
            >
              <img
                src={getDisplayUrl(slide)}
                alt={`Slide ${idx + 1} thumbnail`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Video download button - shown below video when playing */}
      {showVideo && status.results?.videoUrl && (
        <div className="p-3 bg-black/30 border border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Video with Music</p>
            <p className="text-xs text-gray-500">MP4 format, ready for posting</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(status.results?.videoUrl, '_blank')}
            className="bg-black/50 border-gray-600 text-gray-300 hover:bg-black hover:text-white"
          >
            <Download className="size-3 mr-1" />
            Download Video
          </Button>
        </div>
      )}
    </div>
  )
}
