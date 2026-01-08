import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create client if valid credentials are provided
const isConfigured =
  supabaseUrl.startsWith('http') && supabaseAnonKey.length > 0

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = isConfigured

function getClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
    )
  }
  return supabase
}

// Types for our database tables
export interface Generation {
  id: string
  generation_id: string
  hero_image_url: string | null
  art_style: string
  slide_count: number
  status: 'generating' | 'complete' | 'error'
  video_url: string | null
  zip_url: string | null
  created_at: string
}

export interface Slide {
  id: string
  generation_id: string
  slide_number: number
  headline: string
  body_text: string
  image_url: string
  original_url: string | null
  created_at: string
}

export interface GenerationWithSlides extends Generation {
  slides: Slide[]
}

// Helper to upload base64 image to Supabase Storage
export async function uploadBase64Image(
  base64Data: string,
  bucket: string,
  path: string
): Promise<string | null> {
  if (!isConfigured) {
    console.warn('Supabase not configured, skipping base64 image upload')
    return null
  }

  try {
    const client = getClient()

    // Extract the base64 content and mime type
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      console.error('Invalid base64 data format')
      return null
    }

    const mimeType = matches[1]
    const base64Content = matches[2]

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Content)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Upload to Supabase Storage
    const { error } = await client.storage.from(bucket).upload(path, bytes, {
      contentType: mimeType,
      upsert: true,
    })

    if (error) {
      console.error('Supabase base64 upload error:', error)
      return null
    }

    // Get public URL
    const { data: publicUrlData } = client.storage
      .from(bucket)
      .getPublicUrl(path)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('uploadBase64Image error:', error)
    return null
  }
}

// Helper to upload image from URL to Supabase Storage
export async function uploadImageFromUrl(
  url: string,
  bucket: string,
  path: string
): Promise<string | null> {
  if (!isConfigured) {
    console.warn('Supabase not configured, skipping image upload')
    return null
  }

  try {
    const client = getClient()

    // Fetch the image
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch image from ${url}`)
      return null
    }

    const blob = await response.blob()

    // Upload to Supabase Storage
    const { error } = await client.storage.from(bucket).upload(path, blob, {
      contentType: blob.type || 'image/png',
      upsert: true,
    })

    if (error) {
      console.error('Supabase upload error:', error)
      return null
    }

    // Get public URL
    const { data: publicUrlData } = client.storage
      .from(bucket)
      .getPublicUrl(path)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('uploadImageFromUrl error:', error)
    return null
  }
}

// Helper to upload video from URL to Supabase Storage
export async function uploadVideoFromUrl(
  url: string,
  bucket: string,
  path: string
): Promise<string | null> {
  if (!isConfigured) {
    console.warn('Supabase not configured, skipping video upload')
    return null
  }

  try {
    const client = getClient()

    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch video from ${url}`)
      return null
    }

    const blob = await response.blob()

    const { error } = await client.storage.from(bucket).upload(path, blob, {
      contentType: blob.type || 'video/mp4',
      upsert: true,
    })

    if (error) {
      console.error('Supabase video upload error:', error)
      return null
    }

    const { data: publicUrlData } = client.storage
      .from(bucket)
      .getPublicUrl(path)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('uploadVideoFromUrl error:', error)
    return null
  }
}

// Create a new generation record
export async function createGeneration(data: {
  generation_id: string
  hero_image_url?: string | null
  art_style: string
  slide_count: number
  status?: 'generating' | 'complete' | 'error'
}): Promise<Generation | null> {
  if (!isConfigured) {
    console.warn('Supabase not configured, skipping generation record creation')
    return null
  }

  try {
    const client = getClient()

    const { data: generation, error } = await client
      .from('generations')
      .insert({
        generation_id: data.generation_id,
        hero_image_url: data.hero_image_url || null,
        art_style: data.art_style,
        slide_count: data.slide_count,
        status: data.status || 'generating',
      })
      .select()
      .single()

    if (error) {
      console.error('createGeneration error:', error)
      return null
    }

    return generation
  } catch (error) {
    console.error('createGeneration error:', error)
    return null
  }
}

// Update generation status and URLs
export async function updateGeneration(
  generationId: string,
  updates: Partial<Pick<Generation, 'status' | 'video_url' | 'zip_url'>>
): Promise<boolean> {
  if (!isConfigured) {
    console.warn('Supabase not configured, skipping generation update')
    return false
  }

  try {
    const client = getClient()

    const { error } = await client
      .from('generations')
      .update(updates)
      .eq('generation_id', generationId)

    if (error) {
      console.error('updateGeneration error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('updateGeneration error:', error)
    return false
  }
}

// Add slides to a generation
export async function addSlides(
  generationId: string,
  slides: {
    slide_number: number
    headline: string
    body_text: string
    image_url: string
    original_url?: string
  }[]
): Promise<boolean> {
  if (!isConfigured) {
    console.warn('Supabase not configured, skipping slides creation')
    return false
  }

  try {
    const client = getClient()

    // First get the UUID for this generation_id
    const { data: generation, error: genError } = await client
      .from('generations')
      .select('id')
      .eq('generation_id', generationId)
      .single()

    if (genError || !generation) {
      console.error('Failed to find generation:', genError)
      return false
    }

    const slidesWithGenId = slides.map((slide) => ({
      ...slide,
      generation_id: generation.id,
      original_url: slide.original_url || null,
    }))

    const { error } = await client.from('slides').insert(slidesWithGenId)

    if (error) {
      console.error('addSlides error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('addSlides error:', error)
    return false
  }
}

// Get all generations with their slides (for gallery)
export async function getGenerations(
  limit = 20,
  offset = 0
): Promise<{ data: GenerationWithSlides[]; count: number }> {
  if (!isConfigured) {
    console.warn('Supabase not configured')
    return { data: [], count: 0 }
  }

  try {
    const client = getClient()

    // Get total count
    const { count } = await client
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'complete')

    // Get generations
    const { data: generations, error } = await client
      .from('generations')
      .select('*')
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error || !generations) {
      console.error('getGenerations error:', error)
      return { data: [], count: 0 }
    }

    // Get slides for each generation
    const generationIds = generations.map((g) => g.id)

    if (generationIds.length === 0) {
      return { data: [], count: 0 }
    }

    const { data: slides, error: slidesError } = await client
      .from('slides')
      .select('*')
      .in('generation_id', generationIds)
      .order('slide_number', { ascending: true })

    if (slidesError) {
      console.error('getSlides error:', slidesError)
      return { data: [], count: 0 }
    }

    // Combine generations with their slides
    const generationsWithSlides = generations.map((gen) => ({
      ...gen,
      slides: (slides || []).filter((s) => s.generation_id === gen.id),
    }))

    return { data: generationsWithSlides, count: count || 0 }
  } catch (error) {
    console.error('getGenerations error:', error)
    return { data: [], count: 0 }
  }
}

// Get a single generation by generation_id
export async function getGenerationById(
  generationId: string
): Promise<GenerationWithSlides | null> {
  if (!isConfigured) {
    console.warn('Supabase not configured')
    return null
  }

  try {
    const client = getClient()

    const { data: generation, error } = await client
      .from('generations')
      .select('*')
      .eq('generation_id', generationId)
      .single()

    if (error || !generation) {
      return null
    }

    const { data: slides } = await client
      .from('slides')
      .select('*')
      .eq('generation_id', generation.id)
      .order('slide_number', { ascending: true })

    return {
      ...generation,
      slides: slides || [],
    }
  } catch (error) {
    console.error('getGenerationById error:', error)
    return null
  }
}
