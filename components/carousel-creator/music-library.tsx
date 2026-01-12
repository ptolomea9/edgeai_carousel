'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Music, Check, Sparkles, Loader2, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MUSIC_TRACKS, MUSIC_BY_ART_STYLE, type ArtStyleKey } from '@/lib/music-tracks'
import { ART_STYLE_LABELS } from './types'
import type { MusicTrack, ArtStyle } from './types'

// Map the shared MUSIC_TRACKS from lib/n8n.ts to the component's format
// Genre-to-category mapping
const genreToCategory: Record<string, MusicTrack['category']> = {
  'Upbeat': 'upbeat',
  'Corporate': 'corporate',
  'Chill': 'chill',
  'Epic': 'epic',
  'Emotional': 'emotional',
  'Synthwave': 'upbeat',
  'Anime': 'epic',
  '3D Pixar': 'upbeat',
  'Watercolor': 'chill',
  'Minimalist': 'corporate',
  'Comic': 'epic',
  'Photorealistic': 'corporate',
  'Custom': 'upbeat',
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

type MusicMode = 'style-match' | 'library' | 'custom'

interface MusicLibraryProps {
  selectedTrackId: string | null
  onSelectTrack: (trackId: string | null, musicUrl?: string) => void
  artStyle?: ArtStyle
  className?: string
}

interface GeneratedTrack {
  id: string
  name: string
  musicUrl: string
  duration: number
}

export function MusicLibrary({
  selectedTrackId,
  onSelectTrack,
  artStyle = 'custom',
  className,
}: MusicLibraryProps) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [mode, setMode] = useState<MusicMode>('style-match')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTrack, setGeneratedTrack] = useState<GeneratedTrack | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const filteredTracks =
    filter === 'all'
      ? SAMPLE_TRACKS
      : SAMPLE_TRACKS.filter((t) => t.category === filter)

  // Get the recommended tracks for current art style (now an array)
  const styleTracks = MUSIC_BY_ART_STYLE[artStyle as ArtStyleKey] || []
  const hasStyleTracks = styleTracks.length > 0 && styleTracks[0].fullUrl

  const togglePlay = (previewUrl: string, trackId: string) => {
    if (!previewUrl) return

    if (playingTrackId === trackId) {
      audioRef.current?.pause()
      setPlayingTrackId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      audioRef.current = new Audio(previewUrl)
      audioRef.current.play().catch(() => {
        console.log('Audio preview not available')
      })
      audioRef.current.onended = () => setPlayingTrackId(null)
      setPlayingTrackId(trackId)
    }
  }

  const handleGenerateCustom = async () => {
    setIsGenerating(true)
    setGenerationError(null)

    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artStyle,
          duration: 30000, // 30 seconds
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate music')
      }

      const data = await response.json()

      const newTrack: GeneratedTrack = {
        id: `generated-${Date.now()}`,
        name: data.name,
        musicUrl: data.musicUrl,
        duration: data.duration,
      }

      setGeneratedTrack(newTrack)
      // Auto-select the generated track (pass URL for custom tracks)
      onSelectTrack(newTrack.id, newTrack.musicUrl)
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectGeneratedTrack = () => {
    if (generatedTrack) {
      onSelectTrack(generatedTrack.id, generatedTrack.musicUrl)
    }
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const categories = ['all', 'upbeat', 'corporate', 'chill', 'epic', 'emotional']
  const styleName = ART_STYLE_LABELS[artStyle] || artStyle

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <label className="text-sm font-medium text-gray-300">
          Background Music
        </label>
        <p className="text-xs text-gray-500">
          AI-generated instrumental music matched to your art style
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-1 p-1 bg-black/30 rounded-lg">
        <button
          onClick={() => setMode('style-match')}
          className={cn(
            'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5',
            mode === 'style-match'
              ? 'bg-[var(--teal-500)] text-black'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <Sparkles className="size-3" />
          Style Match
        </button>
        <button
          onClick={() => setMode('library')}
          className={cn(
            'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5',
            mode === 'library'
              ? 'bg-[var(--teal-500)] text-black'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <Music className="size-3" />
          Library
        </button>
        <button
          onClick={() => setMode('custom')}
          className={cn(
            'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5',
            mode === 'custom'
              ? 'bg-[var(--teal-500)] text-black'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <Wand2 className="size-3" />
          Generate
        </button>
      </div>

      {/* Style Match Mode */}
      {mode === 'style-match' && (
        <div className="space-y-2">
          <div className="p-3 bg-[var(--teal-900)]/20 border border-[var(--teal-700)]/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-[var(--teal-400)]" />
              <span className="text-sm font-medium text-[var(--teal-300)]">
                Recommended for {styleName}
              </span>
            </div>
            {hasStyleTracks ? (
              <div className="space-y-2">
                {styleTracks.map((track, index) => (
                  <div
                    key={track.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg transition-all',
                      selectedTrackId === track.id
                        ? 'bg-[var(--teal-500)]/20 ring-1 ring-[var(--teal-500)]'
                        : 'hover:bg-white/5'
                    )}
                  >
                    <button
                      onClick={() => togglePlay(track.fullUrl, track.id)}
                      className={cn(
                        'size-10 flex items-center justify-center rounded-full transition-colors',
                        index === 0
                          ? 'bg-[var(--teal-500)] hover:bg-[var(--teal-400)]'
                          : 'bg-purple-500 hover:bg-purple-400'
                      )}
                    >
                      {playingTrackId === track.id ? (
                        <Pause className="size-5 text-black" />
                      ) : (
                        <Play className="size-5 text-black ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{track.name}</div>
                      <div className="text-xs text-gray-400">
                        AI Instrumental • {track.duration}
                        {index === 0 && <span className="ml-1.5 text-[var(--teal-400)]">• Energetic</span>}
                        {index === 1 && <span className="ml-1.5 text-purple-400">• Relaxed</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectTrack(track.id)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0',
                        selectedTrackId === track.id
                          ? 'bg-[var(--teal-500)] text-black'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      )}
                    >
                      {selectedTrackId === track.id ? (
                        <span className="flex items-center gap-1">
                          <Check className="size-3" /> Selected
                        </span>
                      ) : (
                        'Use'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400 mb-3">
                  No pre-generated track yet for {styleName}
                </p>
                <button
                  onClick={() => setMode('custom')}
                  className="px-4 py-2 bg-[var(--teal-500)] text-black text-sm font-medium rounded-lg hover:bg-[var(--teal-400)] transition-colors"
                >
                  Generate Custom Track
                </button>
              </div>
            )}
          </div>

          {/* No music option */}
          <button
            onClick={() => onSelectTrack(null)}
            className={cn(
              'w-full p-2 flex items-center gap-3 border transition-colors rounded-lg',
              selectedTrackId === null
                ? 'bg-white/10 border-white'
                : 'bg-black/30 border-gray-700 hover:border-gray-500'
            )}
          >
            <div className="size-8 flex items-center justify-center bg-black/50 border border-gray-600 rounded">
              <Music className="size-4 text-gray-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm text-gray-300">No Music</div>
              <div className="text-xs text-gray-500">Silent output</div>
            </div>
            {selectedTrackId === null && <Check className="size-4 text-white" />}
          </button>
        </div>
      )}

      {/* Library Mode */}
      {mode === 'library' && (
        <>
          {/* Category filter */}
          <div className="flex gap-1 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  'px-2 py-1 text-xs capitalize transition-colors rounded',
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
                'w-full p-2 flex items-center gap-3 border transition-colors rounded-lg',
                selectedTrackId === null
                  ? 'bg-white/10 border-white'
                  : 'bg-black/30 border-gray-700 hover:border-gray-500'
              )}
            >
              <div className="size-8 flex items-center justify-center bg-black/50 border border-gray-600 rounded">
                <Music className="size-4 text-gray-500" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm text-gray-300">No Music</div>
                <div className="text-xs text-gray-500">Silent output</div>
              </div>
              {selectedTrackId === null && <Check className="size-4 text-white" />}
            </button>

            {filteredTracks.map((track) => (
              <div
                key={track.id}
                className={cn(
                  'p-2 flex items-center gap-3 border transition-colors rounded-lg',
                  selectedTrackId === track.id
                    ? 'bg-white/10 border-white'
                    : 'bg-black/30 border-gray-700 hover:border-gray-500'
                )}
              >
                <button
                  onClick={() => togglePlay(track.previewUrl, track.id)}
                  className="size-8 flex items-center justify-center bg-black/50 border border-gray-600 hover:bg-black hover:border-gray-500 transition-colors rounded"
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

                {selectedTrackId === track.id && <Check className="size-4 text-white" />}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Custom Generation Mode */}
      {mode === 'custom' && (
        <div className="space-y-3">
          <div className="p-4 bg-gradient-to-br from-[var(--teal-900)]/30 to-purple-900/20 border border-[var(--teal-700)]/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="size-5 text-[var(--teal-400)]" />
              <span className="text-sm font-medium text-white">
                Generate Custom Instrumental
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Create a unique AI-generated instrumental track tailored for <strong className="text-[var(--teal-300)]">{styleName}</strong> style.
              Generation takes ~30-60 seconds.
            </p>

            {generationError && (
              <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                {generationError}
              </div>
            )}

            <button
              onClick={handleGenerateCustom}
              disabled={isGenerating}
              className={cn(
                'w-full py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2',
                isGenerating
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[var(--teal-500)] to-[var(--teal-600)] text-black hover:from-[var(--teal-400)] hover:to-[var(--teal-500)]'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating... (~30-60s)
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate Unique Track
                </>
              )}
            </button>
          </div>

          {/* Generated track preview */}
          {generatedTrack && (
            <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="size-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">Generated!</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => togglePlay(generatedTrack.musicUrl, generatedTrack.id)}
                  className="size-10 flex items-center justify-center bg-green-500 rounded-full hover:bg-green-400 transition-colors"
                >
                  {playingTrackId === generatedTrack.id ? (
                    <Pause className="size-5 text-black" />
                  ) : (
                    <Play className="size-5 text-black ml-0.5" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{generatedTrack.name}</div>
                  <div className="text-xs text-gray-400">
                    Custom AI Instrumental • {formatDuration(generatedTrack.duration)}
                  </div>
                </div>
                <button
                  onClick={handleSelectGeneratedTrack}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                    selectedTrackId === generatedTrack.id
                      ? 'bg-green-500 text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  )}
                >
                  {selectedTrackId === generatedTrack.id ? (
                    <span className="flex items-center gap-1">
                      <Check className="size-3" /> Selected
                    </span>
                  ) : (
                    'Use This'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* No music option */}
          <button
            onClick={() => onSelectTrack(null)}
            className={cn(
              'w-full p-2 flex items-center gap-3 border transition-colors rounded-lg',
              selectedTrackId === null
                ? 'bg-white/10 border-white'
                : 'bg-black/30 border-gray-700 hover:border-gray-500'
            )}
          >
            <div className="size-8 flex items-center justify-center bg-black/50 border border-gray-600 rounded">
              <Music className="size-4 text-gray-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm text-gray-300">No Music</div>
              <div className="text-xs text-gray-500">Silent output</div>
            </div>
            {selectedTrackId === null && <Check className="size-4 text-white" />}
          </button>
        </div>
      )}
    </div>
  )
}
