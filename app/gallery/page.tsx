'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import Link from 'next/link'
import { Dithering } from '@paper-design/shaders-react'
import { Loader2, Plus, Download, X, Images, Video, Layers } from 'lucide-react'
import { GenerationCard } from '@/components/gallery/generation-card'
import { GenerationDetail } from '@/components/gallery/generation-detail'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GenerationWithSlides } from '@/lib/supabase'

type FilterType = 'all' | 'static' | 'video'

const MemoizedDithering = memo(Dithering)

export default function GalleryPage() {
  const [generations, setGenerations] = useState<GenerationWithSlides[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [selectedGeneration, setSelectedGeneration] =
    useState<GenerationWithSlides | null>(null)

  // Filter state
  const [filter, setFilter] = useState<FilterType>('all')

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDownloading, setIsDownloading] = useState(false)

  const limit = 20

  const fetchGenerations = async (newOffset = 0, append = false, filterType: FilterType = filter) => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/gallery?limit=${limit}&offset=${newOffset}&filter=${filterType}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch gallery')
      }

      const data = await response.json()

      if (append) {
        setGenerations((prev) => [...prev, ...data.generations])
      } else {
        setGenerations(data.generations)
      }

      setHasMore(data.hasMore)
      setOffset(newOffset)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGenerations(0, false, filter)
  }, [filter])

  // Auto-refresh when window gains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if not currently loading
      if (!isLoading) {
        fetchGenerations(0, false, filter)
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [filter, isLoading])

  const loadMore = () => {
    fetchGenerations(offset + limit, true, filter)
  }

  // Handle filter change
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter)
    setOffset(0)
    setGenerations([])
    // Clear selection when changing filter
    setSelectedIds(new Set())
  }

  // Toggle selection for a generation
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // Exit selection mode
  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  // Bulk download handler
  const handleBulkDownload = async () => {
    if (selectedIds.size === 0) return

    setIsDownloading(true)
    try {
      const selectedGenerations = generations.filter((g) => selectedIds.has(g.id))

      for (const gen of selectedGenerations) {
        for (const slide of gen.slides) {
          // Download each slide with delay to prevent browser blocking
          const response = await fetch(slide.image_url)
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${gen.generation_id}-slide-${slide.slide_number}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          // Small delay between downloads
          await new Promise((r) => setTimeout(r, 300))
        }
      }

      // Exit selection mode after download
      exitSelectionMode()
    } catch (error) {
      console.error('Bulk download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        {/* Animated shader background */}
        <div className="fixed inset-0 z-0 shader-background">
          <MemoizedDithering
            colorBack="#00000000"
            colorFront="#005B5B"
            speed={0.3}
            shape="wave"
            type="4x4"
            pxSize={3}
            scale={1.13}
            style={{
              backgroundColor: '#000000',
              height: '100vh',
              width: '100vw',
            }}
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Gallery</h1>
          <div className="text-center py-12 bg-black/70 rounded-lg border border-white/10">
            <p className="text-red-400">{error}</p>
            <Button
              variant="outline"
              onClick={() => fetchGenerations()}
              className="mt-4 rounded-lg"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Animated shader background */}
      <div className="fixed inset-0 z-0 shader-background">
        <MemoizedDithering
          colorBack="#00000000"
          colorFront="#005B5B"
          speed={0.3}
          shape="wave"
          type="4x4"
          pxSize={3}
          scale={1.13}
          style={{
            backgroundColor: '#000000',
            height: '100vh',
            width: '100vw',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-glow-teal">Gallery</h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base">
              Browse your generated carousel collections
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectionMode ? (
              <>
                <span className="text-sm text-gray-400">
                  {selectedIds.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDownload}
                  disabled={selectedIds.size === 0 || isDownloading}
                  className="bg-white text-black hover:bg-gray-200 rounded-lg"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="size-4 mr-2" />
                      Download Selected
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exitSelectionMode}
                  className="bg-black/70 border-white/20 text-gray-300 hover:bg-black/90 rounded-lg"
                >
                  <X className="size-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectionMode(true)}
                  className="bg-black/70 border-white/20 text-gray-300 hover:bg-[var(--teal-900)]/30 hover:text-[var(--teal-300)] hover:border-[var(--teal-700)] rounded-lg transition-all duration-300"
                >
                  Select Multiple
                </Button>
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--teal-500)] to-[var(--teal-600)] text-black font-medium rounded-lg hover:from-[var(--teal-400)] hover:to-[var(--teal-500)] transition-all duration-300 glow-teal-sm hover:glow-teal"
                >
                  <Plus className="size-4" />
                  Create New
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Filter tabs with teal accent */}
        <div className="mb-6 flex gap-2 animate-fade-in-up delay-100">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('all')}
            className={cn(
              'rounded-lg transition-all duration-300',
              filter === 'all'
                ? 'bg-[var(--teal-500)] text-black hover:bg-[var(--teal-400)] glow-teal-sm'
                : 'bg-black/70 border-white/20 text-gray-300 hover:bg-[var(--teal-900)]/30 hover:text-[var(--teal-300)] hover:border-[var(--teal-700)]'
            )}
          >
            <Layers className="size-4 mr-2" />
            All
          </Button>
          <Button
            variant={filter === 'static' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('static')}
            className={cn(
              'rounded-lg transition-all duration-300',
              filter === 'static'
                ? 'bg-[var(--teal-500)] text-black hover:bg-[var(--teal-400)] glow-teal-sm'
                : 'bg-black/70 border-white/20 text-gray-300 hover:bg-[var(--teal-900)]/30 hover:text-[var(--teal-300)] hover:border-[var(--teal-700)]'
            )}
          >
            <Images className="size-4 mr-2" />
            Images Only
          </Button>
          <Button
            variant={filter === 'video' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('video')}
            className={cn(
              'rounded-lg transition-all duration-300',
              filter === 'video'
                ? 'bg-[var(--teal-500)] text-black hover:bg-[var(--teal-400)] glow-teal-sm'
                : 'bg-black/70 border-white/20 text-gray-300 hover:bg-[var(--teal-900)]/30 hover:text-[var(--teal-300)] hover:border-[var(--teal-700)]'
            )}
          >
            <Video className="size-4 mr-2" />
            With Video
          </Button>
        </div>


        {isLoading && generations.length === 0 ? (
          <div className="flex items-center justify-center py-24 bg-black/70 rounded-xl border border-white/10 noise-overlay animate-fade-in-up delay-200">
            <Loader2 className="size-8 animate-spin text-[var(--teal-500)]" />
          </div>
        ) : generations.length === 0 ? (
          <div className="text-center py-24 bg-black/70 rounded-xl border border-white/10 noise-overlay animate-fade-in-up delay-200">
            <p className="text-gray-400 text-lg font-display">No generations yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Create your first carousel to see it here
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up delay-200">
              {generations.map((gen, index) => (
                <div
                  key={gen.id}
                  className="animate-fade-in-scale"
                  style={{ animationDelay: `${150 + index * 50}ms` }}
                >
                  <GenerationCard
                    generation={gen}
                    onClick={() => {
                      if (selectionMode) {
                        toggleSelection(gen.id)
                      } else {
                        setSelectedGeneration(gen)
                      }
                    }}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(gen.id)}
                    onToggleSelect={toggleSelection}
                  />
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="bg-black/70 border-white/20 text-gray-300 hover:bg-[var(--teal-900)]/30 hover:text-[var(--teal-300)] hover:border-[var(--teal-700)] rounded-lg transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Footer with subtle branding */}
        <div className="mt-12 pt-6 border-t border-white/5 text-center animate-fade-in-up delay-500">
          <p className="text-sm text-gray-500 font-medium">
            Powered by <span className="text-[var(--teal-500)]">EdgeAI Media</span>
          </p>
        </div>
      </div>

      {selectedGeneration && (
        <GenerationDetail
          generation={selectedGeneration}
          onClose={() => setSelectedGeneration(null)}
        />
      )}
    </div>
  )
}
