import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Only create client if valid credentials are provided
const isConfigured =
  supabaseUrl.startsWith('http') && supabaseAnonKey.length > 0

// Server client with service role key (bypasses RLS for server-side operations)
const isServerConfigured =
  supabaseUrl.startsWith('http') && supabaseServiceRoleKey.length > 0

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Server client for operations requiring elevated privileges (uploads, etc.)
export const supabaseServer: SupabaseClient | null = isServerConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
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

function getServerClient(): SupabaseClient {
  if (!supabaseServer) {
    throw new Error(
      'Supabase server client is not configured. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local for storage uploads.'
    )
  }
  return supabaseServer
}

// Status details stored in Supabase for serverless persistence
export interface StatusDetails {
  status: 'analyzing' | 'generating' | 'animating' | 'complete' | 'error'
  progress: number
  message?: string
  currentSlide?: number
  totalSlides?: number
  results?: {
    slides: {
      id: string
      slideNumber: number
      imageUrl: string
    }[]
    zipUrl?: string
    videoUrl?: string
  }
  error?: string
}

// Video execution tracking
export interface VideoExecutionDetails {
  pending: boolean
  videoUrl?: string
  videoClips?: { slideNumber: number; videoUrl: string }[]
  lastChecked?: number
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
  status_details?: StatusDetails | null
  video_execution?: VideoExecutionDetails | null
  slides_config?: { headline: string; bodyText: string }[] | null
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
// Uses server client with service role key to bypass RLS
export async function uploadBase64Image(
  base64Data: string,
  bucket: string,
  path: string
): Promise<string | null> {
  if (!isServerConfigured) {
    console.warn('Supabase server client not configured (missing SUPABASE_SERVICE_ROLE_KEY), skipping base64 image upload')
    return null
  }

  try {
    const client = getServerClient()

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

// Add slides to a generation (with retry logic for race conditions)
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

    // Retry logic to handle race condition where generation record might not exist yet
    let retries = 3
    let generation: { id: string } | null = null

    while (retries > 0 && !generation) {
      const { data, error: genError } = await client
        .from('generations')
        .select('id')
        .eq('generation_id', generationId)
        .single()

      if (data) {
        generation = data
      } else {
        retries--
        if (retries > 0) {
          console.log(`Generation record not found, retrying... (${retries} attempts left)`)
          await new Promise((r) => setTimeout(r, 500))
        } else {
          console.error('Failed to find generation after retries:', genError)
          return false
        }
      }
    }

    if (!generation) {
      console.error('Failed to find generation for slides')
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
// filter: 'all' | 'static' | 'video' - filter by asset type
export async function getGenerations(
  limit = 20,
  offset = 0,
  filter: 'all' | 'static' | 'video' = 'all'
): Promise<{ data: GenerationWithSlides[]; count: number }> {
  if (!isConfigured) {
    console.warn('Supabase not configured')
    return { data: [], count: 0 }
  }

  try {
    const client = getClient()

    // Build base query for count
    let countQuery = client
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'complete')

    // Apply filter to count query
    if (filter === 'static') {
      countQuery = countQuery.is('video_url', null)
    } else if (filter === 'video') {
      countQuery = countQuery.not('video_url', 'is', null)
    }

    const { count } = await countQuery

    // Build base query for generations
    let query = client
      .from('generations')
      .select('*')
      .eq('status', 'complete')
      .order('created_at', { ascending: false })

    // Apply filter
    if (filter === 'static') {
      query = query.is('video_url', null)
    } else if (filter === 'video') {
      query = query.not('video_url', 'is', null)
    }

    // Apply pagination
    const { data: generations, error } = await query.range(offset, offset + limit - 1)

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

// Store generation status in Supabase for serverless persistence
export async function setStatusDetails(
  generationId: string,
  statusDetails: StatusDetails
): Promise<boolean> {
  if (!isConfigured) {
    console.warn('Supabase not configured, status not persisted')
    return false
  }

  try {
    const client = getClient()

    // Map status to the table's status column
    const tableStatus: 'generating' | 'complete' | 'error' =
      statusDetails.status === 'complete'
        ? 'complete'
        : statusDetails.status === 'error'
          ? 'error'
          : 'generating'

    const { error } = await client
      .from('generations')
      .update({
        status_details: statusDetails,
        status: tableStatus,
      })
      .eq('generation_id', generationId)

    if (error) {
      console.error('setStatusDetails error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('setStatusDetails error:', error)
    return false
  }
}

// Get generation status from Supabase
export async function getStatusDetails(
  generationId: string
): Promise<StatusDetails | null> {
  if (!isConfigured) {
    return null
  }

  try {
    const client = getClient()

    const { data, error } = await client
      .from('generations')
      .select('status_details')
      .eq('generation_id', generationId)
      .single()

    if (error || !data?.status_details) {
      return null
    }

    return data.status_details as StatusDetails
  } catch (error) {
    console.error('getStatusDetails error:', error)
    return null
  }
}

// Store video execution info in Supabase
export async function setVideoExecution(
  generationId: string,
  videoExecution: VideoExecutionDetails
): Promise<boolean> {
  if (!isConfigured) {
    return false
  }

  try {
    const client = getClient()

    const { error } = await client
      .from('generations')
      .update({ video_execution: videoExecution })
      .eq('generation_id', generationId)

    if (error) {
      console.error('setVideoExecution error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('setVideoExecution error:', error)
    return false
  }
}

// Get video execution info from Supabase
export async function getVideoExecution(
  generationId: string
): Promise<VideoExecutionDetails | null> {
  if (!isConfigured) {
    return null
  }

  try {
    const client = getClient()

    const { data, error } = await client
      .from('generations')
      .select('video_execution')
      .eq('generation_id', generationId)
      .single()

    if (error || !data?.video_execution) {
      return null
    }

    return data.video_execution as VideoExecutionDetails
  } catch (error) {
    console.error('getVideoExecution error:', error)
    return null
  }
}

// Store original slides config for later gallery display
export async function setSlidesConfig(
  generationId: string,
  slides: { headline: string; bodyText: string }[]
): Promise<boolean> {
  if (!isConfigured) {
    return false
  }

  try {
    const client = getClient()

    const { error } = await client
      .from('generations')
      .update({ slides_config: slides })
      .eq('generation_id', generationId)

    if (error) {
      console.error('setSlidesConfig error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('setSlidesConfig error:', error)
    return false
  }
}

// Get original slides config
export async function getSlidesConfig(
  generationId: string
): Promise<{ headline: string; bodyText: string }[] | null> {
  if (!isConfigured) {
    return null
  }

  try {
    const client = getClient()

    const { data, error } = await client
      .from('generations')
      .select('slides_config')
      .eq('generation_id', generationId)
      .single()

    if (error || !data?.slides_config) {
      return null
    }

    return data.slides_config as { headline: string; bodyText: string }[]
  } catch (error) {
    console.error('getSlidesConfig error:', error)
    return null
  }
}
