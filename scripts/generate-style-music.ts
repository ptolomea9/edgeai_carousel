/**
 * Pre-generate Style Music Tracks
 *
 * This script generates instrumental background music for each of the 8 art styles
 * using ElevenLabs Music API and stores them permanently in Supabase Storage.
 *
 * Usage: npx tsx scripts/generate-style-music.ts
 *
 * Cost: ~$0.25 per 30-second track = ~$2.00 total for all 8 styles
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
const STYLE_PROMPTS: Record<string, string> = {
  synthwave: 'Instrumental synthwave, retro 80s electronic, driving synthesizers, neon-soaked atmosphere, energetic tempo, no vocals',
  anime: 'Instrumental J-pop style, dramatic orchestral elements, emotional piano, anime soundtrack feel, uplifting, no vocals',
  '3d-pixar': 'Instrumental whimsical orchestral, playful woodwinds, warm strings, Pixar-style adventure theme, heartwarming, no vocals',
  watercolor: 'Instrumental ambient acoustic, soft piano, gentle strings, dreamy and ethereal atmosphere, peaceful, no vocals',
  minimalist: 'Instrumental minimal electronic, clean corporate, subtle beats, professional ambient background, no vocals',
  comic: 'Instrumental upbeat action theme, punchy brass, dynamic percussion, superhero movie feel, exciting, no vocals',
  photorealistic: 'Instrumental cinematic, modern film score, subtle emotional, professional documentary style, no vocals',
  custom: 'Instrumental modern background music, versatile, professional quality, suitable for video content, no vocals',
}

// Friendly names for each style's music
const STYLE_NAMES: Record<string, string> = {
  synthwave: 'Neon Dreams',
  anime: 'Epic Journey',
  '3d-pixar': 'Whimsical Adventure',
  watercolor: 'Gentle Flow',
  minimalist: 'Clean Focus',
  comic: 'Hero Rising',
  photorealistic: 'Cinematic Mood',
  custom: 'Modern Vibes',
}

async function generateAndUpload(style: string, prompt: string): Promise<string> {
  console.log(`\n[${style}] Generating "${STYLE_NAMES[style]}"...`)
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
    throw new Error(`ElevenLabs API error for ${style}: ${response.status} - ${errorText}`)
  }

  console.log(`  Generated successfully, uploading to Supabase...`)

  // 2. Upload to Supabase Storage
  const audioBuffer = await response.arrayBuffer()
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

  const { error: uploadError } = await supabase.storage
    .from('carousel-music')
    .upload(`styles/${style}.mp3`, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true, // Overwrite if exists
    })

  if (uploadError) {
    throw new Error(`Supabase upload error for ${style}: ${uploadError.message}`)
  }

  // 3. Get public URL
  const { data } = supabase.storage
    .from('carousel-music')
    .getPublicUrl(`styles/${style}.mp3`)

  console.log(`  Uploaded: ${data.publicUrl}`)
  return data.publicUrl
}

async function main() {
  console.log('='.repeat(60))
  console.log('Pre-generating Style Music Tracks')
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
  console.log(`\nGenerating 8 tracks (30 seconds each)...`)
  console.log('Estimated time: 5-10 minutes')
  console.log('Estimated cost: ~$2.00')

  const results: Record<string, string> = {}
  const errors: string[] = []

  // Process styles sequentially to avoid rate limiting
  for (const [style, prompt] of Object.entries(STYLE_PROMPTS)) {
    try {
      const url = await generateAndUpload(style, prompt)
      results[style] = url
    } catch (error) {
      console.error(`  Error: ${error}`)
      errors.push(style)
    }
  }

  // Output summary
  console.log('\n' + '='.repeat(60))
  console.log('GENERATION COMPLETE')
  console.log('='.repeat(60))

  if (errors.length > 0) {
    console.log(`\nFailed styles: ${errors.join(', ')}`)
  }

  console.log('\n--- Copy these URLs to lib/n8n.ts MUSIC_BY_ART_STYLE ---\n')

  for (const [style, url] of Object.entries(results)) {
    console.log(`  '${style}': {`)
    console.log(`    id: 'style-${style}',`)
    console.log(`    name: '${STYLE_NAMES[style]}',`)
    console.log(`    genre: '${style.charAt(0).toUpperCase() + style.slice(1).replace('-', ' ')}',`)
    console.log(`    duration: '0:30',`)
    console.log(`    previewUrl: '${url}',`)
    console.log(`    fullUrl: '${url}',`)
    console.log(`  },`)
  }

  console.log('\n--- End of URLs ---\n')

  // Output as a single object for easy copy-paste
  console.log('\n--- Alternative: JSON format ---\n')
  console.log(JSON.stringify(results, null, 2))
}

main().catch(console.error)
