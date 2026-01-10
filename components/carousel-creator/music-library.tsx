'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Music, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MUSIC_TRACKS } from '@/lib/n8n'
import type { MusicTrack } from './types'

// Map the shared MUSIC_TRACKS from lib/n8n.ts to the component's format
// Genre-to-category mapping
const genreToCategory: Record<string, MusicTrack['category']> = {
  'Upbeat': 'upbeat',
  'Corporate': 'corporate',
  'Chill': 'chill',
  'Epic': 'epic',
  'Emotional': 'emotional',
}

// Parse duration string (e.g., "2:30") to seconds
function parseDuration(duration: string): number {
  const [mins, secs] = duration.split(':').map(Number)
  return mins * 60 + secs
}

// Convert lib/n8n tracks to component format
const SAMPLE_TRACKS: MusicTrack[] = MUSIC_TRACKS.map((track) => ({
  id: track.id,
  title: track.name,
  artist: 'Royalty Free',
  duration: parseDuration(track.duration),
  category: genreToCategory[track.genre] || 'upbeat',
  previewUrl: track.previewUrl,
  fullUrl: track.fullUrl,
}))

interface MusicLibraryProps {
  selectedTrackId: string | null
  onSelectTrack: (trackId: string | null) => void
  className?: string
}

export function MusicLibrary({
  selectedTrackId,
  onSelectTrack,
  className,
}: MusicLibraryProps) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const filteredTracks =
    filter === 'all'
      ? SAMPLE_TRACKS
      : SAMPLE_TRACKS.filter((t) => t.category === filter)

  const togglePlay = (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      audioRef.current?.pause()
      setPlayingTrackId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      audioRef.current = new Audio(track.previewUrl)
      audioRef.current.play().catch(() => {
        // Handle audio play error (e.g., file not found in dev)
        console.log('Audio preview not available')
      })
      audioRef.current.onended = () => setPlayingTrackId(null)
      setPlayingTrackId(track.id)
    }
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const categories = ['all', 'upbeat', 'corporate', 'chill', 'epic', 'emotional']

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <label className="text-sm font-medium text-gray-300">
          Background Music
        </label>
        <p className="text-xs text-gray-500">
          Select a royalty-free track for your video (optional)
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              'px-2 py-1 text-xs capitalize transition-colors',
              filter === cat
                ? 'bg-white text-black'
                : 'bg-black/30 text-gray-400 hover:text-white'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Track list */}
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {/* None option */}
        <button
          onClick={() => onSelectTrack(null)}
          className={cn(
            'w-full p-2 flex items-center gap-3 border transition-colors',
            selectedTrackId === null
              ? 'bg-white/10 border-white'
              : 'bg-black/30 border-gray-700 hover:border-gray-500'
          )}
        >
          <div className="size-8 flex items-center justify-center bg-black/50 border border-gray-600">
            <Music className="size-4 text-gray-500" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm text-gray-300">No Music</div>
            <div className="text-xs text-gray-500">Silent output</div>
          </div>
          {selectedTrackId === null && (
            <Check className="size-4 text-white" />
          )}
        </button>

        {filteredTracks.map((track) => (
          <div
            key={track.id}
            className={cn(
              'p-2 flex items-center gap-3 border transition-colors',
              selectedTrackId === track.id
                ? 'bg-white/10 border-white'
                : 'bg-black/30 border-gray-700 hover:border-gray-500'
            )}
          >
            <button
              onClick={() => togglePlay(track)}
              className="size-8 flex items-center justify-center bg-black/50 border border-gray-600 hover:bg-black hover:border-gray-500 transition-colors"
            >
              {playingTrackId === track.id ? (
                <Pause className="size-4 text-white" />
              ) : (
                <Play className="size-4 text-gray-400" />
              )}
            </button>

            <button
              onClick={() => onSelectTrack(track.id)}
              className="flex-1 text-left"
            >
              <div className="text-sm text-gray-300">{track.title}</div>
              <div className="text-xs text-gray-500 flex gap-2">
                <span>{formatDuration(track.duration)}</span>
                <span className="capitalize">{track.category}</span>
                {track.bpm && <span>{track.bpm} BPM</span>}
              </div>
            </button>

            {selectedTrackId === track.id && (
              <Check className="size-4 text-white" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
