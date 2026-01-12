/**
 * Pre-generate Style Music Tracks
 *
 * This script generates instrumental background music for each of the 8 art styles
 * using ElevenLabs Music API and stores them permanently in Supabase Storage.
 *
 * Each style gets TWO variants with different moods/tempos for variety.
 *
 * Usage: npx tsx scripts/generate-style-music.ts
 * Usage (variants only): npx tsx scripts/generate-style-music.ts --variants-only
 *
 * Cost: ~$0.25 per 30-second track = ~$4.00 total for all 16 tracks
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Art style to instrumental music prompt mappings
// Each style has TWO variants: original (energetic) and variant (different mood)
interface StyleVariants {
  original: { prompt: string; name: string }
  variant: { prompt: string; name: string }
}

const STYLE_PROMPTS: Record<string, StyleVariants> = {
  synthwave: {
    original: {
      prompt: 'Instrumental synthwave, retro 80s electronic, driving synthesizers, neon-soaked atmosphere, energetic tempo, no vocals',
      name: 'Neon Dreams',
    },
    variant: {
      prompt: 'Instrumental chillwave synthwave, relaxed retro electronic, soft pulsing synthesizers, dreamy 80s sunset vibes, mellow tempo, no vocals',
      name: 'Midnight Drive',
    },
  },
  anime: {
    original: {
      prompt: 'Instrumental J-pop style, dramatic orchestral elements, emotional piano, anime soundtrack feel, uplifting, no vocals',
      name: 'Epic Journey',
    },
    variant: {
      prompt: 'Instrumental anime slice-of-life, gentle acoustic guitar, soft bells, peaceful everyday moments feel, warm and cozy, no vocals',
      name: 'Peaceful Days',
    },
  },
  '3d-pixar': {
    original: {
      prompt: 'Instrumental whimsical orchestral, playful woodwinds, warm strings, Pixar-style adventure theme, heartwarming, no vocals',
      name: 'Whimsical Adventure',
    },
    variant: {
      prompt: 'Instrumental magical orchestral, soft harp and celeste, gentle strings, wonder and discovery theme, nostalgic and tender, no vocals',
      name: 'Magical Moments',
    },
  },
  watercolor: {
    original: {
      prompt: 'Instrumental ambient acoustic, soft piano, gentle strings, dreamy and ethereal atmosphere, peaceful, no vocals',
      name: 'Gentle Flow',
    },
    variant: {
      prompt: 'Instrumental impressionist, flowing harp arpeggios, light flute melodies, waterside serenity, floating and delicate, no vocals',
      name: 'Morning Mist',
    },
  },
  minimalist: {
    original: {
      prompt: 'Instrumental minimal electronic, clean corporate, subtle beats, professional ambient background, no vocals',
      name: 'Clean Focus',
    },
    variant: {
      prompt: 'Instrumental ambient minimal, sparse piano notes, soft pad textures, meditative and spacious, zen-like calm, no vocals',
      name: 'Quiet Space',
    },
  },
  comic: {
    original: {
      prompt: 'Instrumental upbeat action theme, punchy brass, dynamic percussion, superhero movie feel, exciting, no vocals',
      name: 'Hero Rising',
    },
    variant: {
      prompt: 'Instrumental comic book jazz, funky bass line, snappy drums, retro detective noir vibes, cool and confident, no vocals',
      name: 'City Swagger',
    },
  },
  photorealistic: {
    original: {
      prompt: 'Instrumental cinematic, modern film score, subtle emotional, professional documentary style, no vocals',
      name: 'Cinematic Mood',
    },
    variant: {
      prompt: 'Instrumental documentary ambient, atmospheric pads, sparse piano, contemplative and introspective, human story feel, no vocals',
      name: 'Human Stories',
    },
  },
  custom: {
    original: {
      prompt: 'Instrumental modern background music, versatile, professional quality, suitable for video content, no vocals',
      name: 'Modern Vibes',
    },
    variant: {
      prompt: 'Instrumental uplifting indie, acoustic guitar strums, light percussion, positive and inspiring, feel-good energy, no vocals',
      name: 'Bright Ideas',
    },
  },
}

async function generateAndUpload(
  style: string,
  variant: 'original' | 'variant',
  prompt: string,
  name: string
): Promise<string> {
  const suffix = variant === 'variant' ? '-v2' : ''
  const fileName = `${style}${suffix}.mp3`

  console.log(`\n[${style}${suffix}] Generating "${name}"...`)
  console.log(`  Prompt: ${prompt.substring(0, 60)}...`)

  // 1. Generate with ElevenLabs Music API
  const response = await fetch('https://api.elevenlabs.io/v1/music', {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      music_length_ms: 30000, // 30 seconds
      force_instrumental: true,
      output_format: 'mp3_44100_128',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs API error for ${style}${suffix}: ${response.status} - ${errorText}`)
  }

  console.log(`  Generated successfully, uploading to Supabase...`)

  // 2. Upload to Supabase Storage
  const audioBuffer = await response.arrayBuffer()
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

  const { error: uploadError } = await supabase.storage
    .from('carousel-music')
    .upload(`styles/${fileName}`, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true, // Overwrite if exists
    })

  if (uploadError) {
    throw new Error(`Supabase upload error for ${style}${suffix}: ${uploadError.message}`)
  }

  // 3. Get public URL
  const { data } = supabase.storage
    .from('carousel-music')
    .getPublicUrl(`styles/${fileName}`)

  console.log(`  Uploaded: ${data.publicUrl}`)
  return data.publicUrl
}

async function main() {
  const variantsOnly = process.argv.includes('--variants-only')

  console.log('='.repeat(60))
  console.log('Pre-generating Style Music Tracks')
  console.log(variantsOnly ? '(Variants only mode)' : '(All tracks)')
  console.log('='.repeat(60))

  // Validate environment variables
  if (!ELEVENLABS_API_KEY) {
    console.error('Error: ELEVENLABS_API_KEY not found in .env.local')
    process.exit(1)
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: Supabase credentials not found in .env.local')
    process.exit(1)
  }

  console.log(`\nElevenLabs API Key: ${ELEVENLABS_API_KEY.substring(0, 8)}...`)
  console.log(`Supabase URL: ${SUPABASE_URL}`)

  const trackCount = variantsOnly ? 8 : 16
  console.log(`\nGenerating ${trackCount} tracks (30 seconds each)...`)
  console.log(`Estimated time: ${variantsOnly ? '5-10' : '10-20'} minutes`)
  console.log(`Estimated cost: ~$${variantsOnly ? '2.00' : '4.00'}`)

  const results: Record<string, { original?: string; variant?: string; originalName?: string; variantName?: string }> = {}
  const errors: string[] = []

  // Process styles sequentially to avoid rate limiting
  for (const [style, variants] of Object.entries(STYLE_PROMPTS)) {
    results[style] = {}

    // Generate original (unless variants-only mode)
    if (!variantsOnly) {
      try {
        const url = await generateAndUpload(style, 'original', variants.original.prompt, variants.original.name)
        results[style].original = url
        results[style].originalName = variants.original.name
      } catch (error) {
        console.error(`  Error: ${error}`)
        errors.push(`${style}-original`)
      }
    }

    // Generate variant
    try {
      const url = await generateAndUpload(style, 'variant', variants.variant.prompt, variants.variant.name)
      results[style].variant = url
      results[style].variantName = variants.variant.name
    } catch (error) {
      console.error(`  Error: ${error}`)
      errors.push(`${style}-variant`)
    }
  }

  // Output summary
  console.log('\n' + '='.repeat(60))
  console.log('GENERATION COMPLETE')
  console.log('='.repeat(60))

  if (errors.length > 0) {
    console.log(`\nFailed: ${errors.join(', ')}`)
  }

  console.log('\n--- Copy to lib/n8n.ts MUSIC_BY_ART_STYLE ---\n')

  for (const [style, data] of Object.entries(results)) {
    const variants = STYLE_PROMPTS[style]
    console.log(`  '${style}': [`)
    if (data.original) {
      console.log(`    {`)
      console.log(`      id: 'style-${style}',`)
      console.log(`      name: '${variants.original.name}',`)
      console.log(`      genre: '${style.charAt(0).toUpperCase() + style.slice(1).replace('-', ' ')}',`)
      console.log(`      duration: '0:30',`)
      console.log(`      previewUrl: '${data.original}',`)
      console.log(`      fullUrl: '${data.original}',`)
      console.log(`    },`)
    }
    if (data.variant) {
      console.log(`    {`)
      console.log(`      id: 'style-${style}-v2',`)
      console.log(`      name: '${variants.variant.name}',`)
      console.log(`      genre: '${style.charAt(0).toUpperCase() + style.slice(1).replace('-', ' ')}',`)
      console.log(`      duration: '0:30',`)
      console.log(`      previewUrl: '${data.variant}',`)
      console.log(`      fullUrl: '${data.variant}',`)
      console.log(`    },`)
    }
    console.log(`  ],`)
  }

  console.log('\n--- End of URLs ---\n')
}

main().catch(console.error)
