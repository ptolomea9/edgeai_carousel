import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ArtStyle } from '@/components/carousel-creator/types'

// Art style to instrumental music prompt mappings
const STYLE_PROMPTS: Record<ArtStyle, string> = {
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
const STYLE_MUSIC_NAMES: Record<ArtStyle, string> = {
  synthwave: 'Neon Dreams',
  anime: 'Epic Journey',
  '3d-pixar': 'Whimsical Adventure',
  watercolor: 'Gentle Flow',
  minimalist: 'Clean Focus',
  comic: 'Hero Rising',
  photorealistic: 'Cinematic Mood',
  custom: 'Modern Vibes',
}

export async function POST(request: NextRequest) {
  try {
    const { artStyle, duration = 30000 } = await request.json()

    // Validate art style
    if (!artStyle || !STYLE_PROMPTS[artStyle as ArtStyle]) {
      return NextResponse.json(
        { error: 'Invalid art style' },
        { status: 400 }
      )
    }

    // Check for API key
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey || apiKey === 'your-elevenlabs-api-key-here') {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    // Validate duration (3s to 10min)
    const validDuration = Math.min(Math.max(duration, 3000), 600000)

    const prompt = STYLE_PROMPTS[artStyle as ArtStyle]

    // Call ElevenLabs Music API
    const response = await fetch('https://api.elevenlabs.io/v1/music', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        music_length_ms: validDuration,
        force_instrumental: true,
        output_format: 'mp3_44100_128',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', errorText)
      return NextResponse.json(
        { error: `Music generation failed: ${response.status}` },
        { status: response.status }
      )
    }

    // Get the audio data as a buffer
    const audioBuffer = await response.arrayBuffer()

    // Upload to Supabase Storage
    const supabase = await createClient()
    const fileName = `generated-music/${artStyle}-${Date.now()}.mp3`

    const { error: uploadError } = await supabase.storage
      .from('carousel-music')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to save generated music' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('carousel-music')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      musicUrl: urlData.publicUrl,
      name: STYLE_MUSIC_NAMES[artStyle as ArtStyle],
      artStyle,
      duration: validDuration / 1000, // Return in seconds
    })
  } catch (error) {
    console.error('Generate music error:', error)
    return NextResponse.json(
      { error: 'Failed to generate music' },
      { status: 500 }
    )
  }
}
