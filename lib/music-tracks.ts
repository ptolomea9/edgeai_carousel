// Music track definitions - client-safe (no server imports or env vars)

export interface MusicTrack {
  id: string
  name: string
  genre: string
  duration: string
  previewUrl: string
  fullUrl: string
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'upbeat-1',
    name: 'Energy Boost',
    genre: 'Upbeat',
    duration: '4:34',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    fullUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'corporate-1',
    name: 'Business Forward',
    genre: 'Corporate',
    duration: '5:27',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    fullUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'chill-1',
    name: 'Smooth Vibes',
    genre: 'Chill',
    duration: '4:05',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    fullUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'epic-1',
    name: 'Rise Up',
    genre: 'Epic',
    duration: '5:45',
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    fullUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
]

// Art style to recommended music mapping
// Pre-generated AI instrumental tracks from ElevenLabs Music API, stored in Supabase
// Each style has TWO variants with different moods for variety
export type ArtStyleKey = 'synthwave' | 'anime' | '3d-pixar' | 'watercolor' | 'minimalist' | 'comic' | 'photorealistic' | 'custom'

export const MUSIC_BY_ART_STYLE: Record<ArtStyleKey, MusicTrack[]> = {
  synthwave: [
    {
      id: 'style-synthwave',
      name: 'Neon Dreams',
      genre: 'Synthwave',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/synthwave.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/synthwave.mp3',
    },
    {
      id: 'style-synthwave-v2',
      name: 'Midnight Drive',
      genre: 'Synthwave',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/synthwave-v2.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/synthwave-v2.mp3',
    },
  ],
  anime: [
    {
      id: 'style-anime',
      name: 'Epic Journey',
      genre: 'Anime',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/anime.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/anime.mp3',
    },
    {
      id: 'style-anime-v2',
      name: 'Peaceful Days',
      genre: 'Anime',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/anime-v2.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/anime-v2.mp3',
    },
  ],
  '3d-pixar': [
    {
      id: 'style-3d-pixar',
      name: 'Adventure Awaits',
      genre: 'Orchestral',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/3d-pixar.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/3d-pixar.mp3',
    },
    {
      id: 'style-3d-pixar-v2',
      name: 'Playful Moments',
      genre: 'Orchestral',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/3d-pixar-v2.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/3d-pixar-v2.mp3',
    },
  ],
  watercolor: [
    {
      id: 'style-watercolor',
      name: 'Gentle Breeze',
      genre: 'Ambient',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/watercolor.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/watercolor.mp3',
    },
    {
      id: 'style-watercolor-v2',
      name: 'Morning Dew',
      genre: 'Ambient',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/watercolor-v2.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/watercolor-v2.mp3',
    },
  ],
  minimalist: [
    {
      id: 'style-minimalist',
      name: 'Clean Slate',
      genre: 'Electronic',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/minimalist.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/minimalist.mp3',
    },
    {
      id: 'style-minimalist-v2',
      name: 'Simple Truth',
      genre: 'Electronic',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/minimalist-v2.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/minimalist-v2.mp3',
    },
  ],
  comic: [
    {
      id: 'style-comic',
      name: 'Hero Theme',
      genre: 'Action',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/comic.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/comic.mp3',
    },
    {
      id: 'style-comic-v2',
      name: 'Power Up',
      genre: 'Action',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/comic-v2.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/comic-v2.mp3',
    },
  ],
  photorealistic: [
    {
      id: 'style-photorealistic',
      name: 'Elegant Motion',
      genre: 'Cinematic',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/photorealistic.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/photorealistic.mp3',
    },
    {
      id: 'style-photorealistic-v2',
      name: 'Golden Hour',
      genre: 'Cinematic',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/photorealistic-v2.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/photorealistic-v2.mp3',
    },
  ],
  custom: [
    {
      id: 'style-custom',
      name: 'Creative Flow',
      genre: 'Electronic',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/custom.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/custom.mp3',
    },
    {
      id: 'style-custom-v2',
      name: 'Inspiration',
      genre: 'Electronic',
      duration: '0:30',
      previewUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/custom-v2.mp3',
      fullUrl: 'https://qcdgmkjvnjcxytjtqqia.supabase.co/storage/v1/object/public/carousel-music/styles/custom-v2.mp3',
    },
  ],
}
