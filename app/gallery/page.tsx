'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Plus } from 'lucide-react'
import { GenerationCard } from '@/components/gallery/generation-card'
import { GenerationDetail } from '@/components/gallery/generation-detail'
import { Button } from '@/components/ui/button'
import type { GenerationWithSlides } from '@/lib/supabase'

export default function GalleryPage() {
  const [generations, setGenerations] = useState<GenerationWithSlides[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [selectedGeneration, setSelectedGeneration] =
    useState<GenerationWithSlides | null>(null)

  const limit = 20

  const fetchGenerations = async (newOffset = 0, append = false) => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/gallery?limit=${limit}&offset=${newOffset}`
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
    fetchGenerations()
  }, [])

  const loadMore = () => {
    fetchGenerations(offset + limit, true)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Gallery</h1>
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
            <Button
              variant="outline"
              onClick={() => fetchGenerations()}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
            <p className="text-gray-400 mt-1">
              Browse your generated carousel collections
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors"
          >
            <Plus className="size-4" />
            Create New
          </Link>
        </div>

        {isLoading && generations.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-gray-400" />
          </div>
        ) : generations.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 text-lg">No generations yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Create your first carousel to see it here
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {generations.map((gen) => (
                <GenerationCard
                  key={gen.id}
                  generation={gen}
                  onClick={() => setSelectedGeneration(gen)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                  className="bg-black/50 border-gray-700 text-gray-300 hover:bg-gray-800"
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
