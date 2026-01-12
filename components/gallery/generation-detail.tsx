'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Play,
  Images,
  Loader2,
  AlertCircle,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GenerationWithSlides } from '@/lib/supabase'
import { DeleteConfirmation } from './delete-confirmation'

interface GenerationDetailProps {
  generation: GenerationWithSlides
  onClose: () => void
  onDelete?: (id: string) => Promise<void>
}

export function GenerationDetail({
  generation,
  onClose,
  onDelete,
}: GenerationDetailProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [videoLoading, setVideoLoading] = useState(true)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(generation.generation_id)
      onClose()
    } catch (error) {
      console.error('Delete error:', error)
      setIsDeleting(false)
    }
  }

  const slides = generation.slides
  const hasVideo = !!generation.video_url

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to opening in new tab
      window.open(url, '_blank')
    }
  }

  const downloadAllImages = async () => {
    for (let i = 0; i < slides.length; i++) {
      await downloadFile(slides[i].image_url, `slide-${i + 1}.png`)
      // Small delay between downloads to avoid overwhelming the browser
      if (i < slides.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
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
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
      >
        <X className="size-6" />
      </button>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6 bg-black/70 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
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
                  'rounded-lg',
                  !showVideo
                    ? 'bg-white text-black'
                    : 'bg-black/50 border-white/20 text-gray-300'
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
                    ? 'bg-white text-black'
                    : 'bg-black/50 border-white/20 text-gray-300'
                )}
              >
                <Play className="size-4 mr-2" />
                Video
              </Button>
            </div>
          )}

          {/* Viewer area */}
          <div className="relative aspect-square bg-gray-900 border border-white/10 rounded-lg overflow-hidden">
            {showVideo && generation.video_url ? (
              <div className="absolute inset-0 flex items-center justify-center">
                {videoLoading && !videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                    <Loader2 className="size-8 animate-spin text-gray-400" />
                  </div>
                )}
                {videoError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-center p-4">
                    <AlertCircle className="size-12 text-red-400 mb-4" />
                    <p className="text-red-400 font-medium">Video playback error</p>
                    <p className="text-gray-500 text-sm mt-2">{videoError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(generation.video_url!, '_blank')}
                      className="mt-4 bg-black/50 border-white/20 text-gray-300"
                    >
                      Open in New Tab
                    </Button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    src={generation.video_url}
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
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-black/90 transition-colors rounded-lg"
                    >
                      <ChevronLeft className="size-6" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/70 hover:bg-black/90 transition-colors rounded-lg"
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
                    'relative flex-shrink-0 w-16 h-16 border-2 overflow-hidden rounded-md',
                    index === currentSlide
                      ? 'border-white'
                      : 'border-transparent hover:border-white/40'
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
              className="w-full bg-white text-black hover:bg-gray-200 rounded-lg"
            >
              <Download className="size-4 mr-2" />
              Download All Images
            </Button>

            {hasVideo && (
              <Button
                onClick={() =>
                  downloadFile(generation.video_url!, 'carousel-video.mp4')
                }
                variant="outline"
                className="w-full bg-black/50 border-white/20 text-gray-300 hover:bg-black/70 rounded-lg"
              >
                <Download className="size-4 mr-2" />
                Download Video
              </Button>
            )}

            {onDelete && (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="w-full bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 rounded-lg"
              >
                <Trash2 className="size-4 mr-2" />
                Delete Carousel
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500">
            ID: {generation.generation_id}
          </p>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <DeleteConfirmation
          count={1}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
