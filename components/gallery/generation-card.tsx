'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Play, Pause, Images, Check, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GenerationWithSlides } from '@/lib/supabase'

interface GenerationCardProps {
  generation: GenerationWithSlides
  onClick: () => void
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  showVideoPreview?: boolean
  className?: string
}

export function GenerationCard({
  generation,
  onClick,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  showVideoPreview = false,
  className,
}: GenerationCardProps) {
  const firstSlide = generation.slides[0]
  const hasVideo = !!generation.video_url
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const toggleVideoPlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative bg-black/70 border rounded-xl overflow-hidden backdrop-blur-sm',
        'hover:border-[var(--teal-700)] hover:bg-black/80 transition-all duration-300',
        'hover:shadow-lg hover:shadow-[var(--teal-glow)]',
        'text-left w-full card-hover',
        isSelected ? 'border-[var(--teal-500)] ring-2 ring-[var(--teal-500)]/50 glow-teal-sm' : 'border-white/10',
        className
      )}
    >
      {/* Selection checkbox with teal accent */}
      {selectionMode && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect?.(generation.id)
          }}
          className={cn(
            'absolute top-3 left-3 z-20 size-6 rounded-md border-2 flex items-center justify-center transition-all duration-300 cursor-pointer',
            isSelected
              ? 'bg-[var(--teal-500)] border-[var(--teal-500)] glow-teal-sm'
              : 'bg-black/50 border-white/50 hover:border-[var(--teal-400)]'
          )}
        >
          {isSelected && <Check className="size-4 text-black" />}
        </div>
      )}

      {/* Thumbnail / Video Preview */}
      <div className="relative aspect-square bg-gray-900 rounded-t-lg overflow-hidden">
        {showVideoPreview && hasVideo ? (
          <>
            {/* Video Player */}
            <video
              ref={videoRef}
              src={generation.video_url!}
              loop
              playsInline
              muted
              onClick={toggleVideoPlay}
              onEnded={() => setIsPlaying(false)}
              className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            />

            {/* Play/Pause overlay */}
            <div
              onClick={toggleVideoPlay}
              className={cn(
                'absolute inset-0 flex items-center justify-center transition-opacity duration-300 cursor-pointer',
                isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100 bg-black/30'
              )}
            >
              <div className="size-16 rounded-full bg-[var(--teal-500)]/90 flex items-center justify-center backdrop-blur-sm glow-teal">
                {isPlaying ? (
                  <Pause className="size-8 text-black" />
                ) : (
                  <Play className="size-8 text-black ml-1" />
                )}
              </div>
            </div>

            {/* Info button to open details */}
            <button
              onClick={onClick}
              className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-lg transition-colors z-10"
              title="View details"
            >
              <Info className="size-4 text-white" />
            </button>
          </>
        ) : firstSlide?.image_url ? (
          <Image
            src={firstSlide.image_url}
            alt={`${generation.art_style} carousel`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Images className="size-12 text-gray-700" />
          </div>
        )}

        {/* Overlay on hover (only when not showing video preview) */}
        {!(showVideoPreview && hasVideo) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <span className="text-[var(--teal-300)] text-sm font-medium bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              {selectionMode ? (isSelected ? 'Deselect' : 'Select') : 'View Details'}
            </span>
          </div>
        )}

        {/* Video indicator with teal accent (only when not showing video preview) */}
        {hasVideo && !(showVideoPreview && hasVideo) && (
          <div className="absolute top-2 right-2 bg-[var(--teal-900)]/90 px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm border border-[var(--teal-700)]/50">
            <Play className="size-3 fill-[var(--teal-400)] text-[var(--teal-400)]" />
            <span className="text-xs text-[var(--teal-300)]">Video</span>
          </div>
        )}

        {/* Slide count badge */}
        <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded-md backdrop-blur-sm">
          <span className="text-xs text-gray-300">{generation.slide_count} slides</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium capitalize truncate font-display">
          {generation.art_style.replace(/-/g, ' ')}
        </p>
        <p className="text-xs text-gray-500">
          {formatDate(generation.created_at)}
        </p>
      </div>
    </button>
  )
}
