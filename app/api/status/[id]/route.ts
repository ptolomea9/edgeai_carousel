import { NextRequest, NextResponse } from 'next/server'
import {
  getStoredStatus,
  getGenerationStatus,
  getVideoExecutionInfo,
  pollVideoWorkflowStatus,
  setVideoExecutionComplete,
} from '@/lib/n8n'
import {
  updateGeneration,
  addSlides,
  uploadImageFromUrl,
  uploadVideoFromUrl,
  getSlidesConfig,
} from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: generationId } = await params

    if (!generationId) {
      return NextResponse.json(
        { error: 'Generation ID is required' },
        { status: 400 }
      )
    }

    // First check Supabase store
    let localStatus = await getStoredStatus(generationId)

    // Check if there's a pending video execution
    const videoInfo = await getVideoExecutionInfo(generationId)

    if (videoInfo?.pending) {
      // Poll n8n for video workflow status
      const videoResult = await pollVideoWorkflowStatus(generationId)
      console.log('Video poll result:', videoResult)

      if (videoResult.status === 'success' && videoResult.videoUrl) {
        // Video is complete! Update the local status and persist to Supabase
        await setVideoExecutionComplete(
          generationId,
          videoResult.videoUrl,
          videoResult.videoClips
        )

        // Persist video to Supabase
        persistVideoToSupabase(generationId, videoResult.videoUrl).catch(
          (error) => {
            console.error('Video Supabase persistence error:', error)
          }
        )

        // Update local status with video URL
        if (localStatus) {
          localStatus = {
            ...localStatus,
            status: 'complete',
            results: {
              ...localStatus.results,
              slides: localStatus.results?.slides || [],
              videoUrl: videoResult.videoUrl,
            },
          }
        }
      } else if (
        videoResult.status === 'running' ||
        videoResult.status === 'pending'
      ) {
        // Video still generating - return animating status
        if (localStatus) {
          return NextResponse.json({
            ...localStatus,
            status: 'animating',
            message: videoResult.message || 'Generating video...',
          })
        }
      }
    }

    if (localStatus) {
      return NextResponse.json(localStatus)
    }

    // If not in local store, try to fetch from n8n
    try {
      const n8nStatus = await getGenerationStatus(generationId)
      return NextResponse.json(n8nStatus)
    } catch {
      // If n8n doesn't have it either, return not found
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Persist video URL to Supabase
async function persistVideoToSupabase(
  generationId: string,
  videoUrl: string
): Promise<void> {
  // Upload video to Supabase Storage
  const videoPath = `${generationId}/video.mp4`
  const supabaseVideoUrl = await uploadVideoFromUrl(
    videoUrl,
    'carousel-videos',
    videoPath
  )

  // Update generation record with video URL
  await updateGeneration(generationId, {
    status: 'complete',
    video_url: supabaseVideoUrl || videoUrl,
  })

  console.log(`Persisted video for ${generationId} to Supabase`)
}

// n8n can POST status updates here
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: generationId } = await params
    const status = await request.json()

    if (!generationId) {
      return NextResponse.json(
        { error: 'Generation ID is required' },
        { status: 400 }
      )
    }

    // Import dynamically to avoid issues
    const { setGenerationStatus } = await import('@/lib/n8n')
    await setGenerationStatus(generationId, status)

    // If generation is complete, persist to Supabase
    // IMPORTANT: Must await this - serverless functions terminate after response is sent
    console.log(`POST status update: status=${status.status}, hasSlides=${!!status.results?.slides}, slideCount=${status.results?.slides?.length || 0}`)
    if (status.status === 'complete' && status.results?.slides) {
      console.log(`Starting persistence for ${generationId} with ${status.results.slides.length} slides`)
      try {
        await persistToSupabase(generationId, status)
        console.log(`Successfully persisted slides for ${generationId}`)
      } catch (error) {
        console.error('Supabase persistence error:', error)
        // Don't fail the request - slides are non-critical
      }
    } else {
      console.log(`Skipping persistence: status=${status.status}, slides=${status.results?.slides ? 'present' : 'missing'}`)
    }

    // If there's an error, update Supabase status
    if (status.status === 'error') {
      updateGeneration(generationId, { status: 'error' }).catch((error) => {
        console.error('Supabase error status update failed:', error)
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Persist completed generation to Supabase with image uploads
async function persistToSupabase(
  generationId: string,
  status: {
    results?: {
      slides: {
        id: string
        slideNumber: number
        imageUrl: string
        processedImageUrl?: string
        headline?: string
        bodyText?: string
      }[]
      videoUrl?: string
      zipUrl?: string
    }
  }
) {
  const slides = status.results?.slides || []
  const videoUrl = status.results?.videoUrl
  const zipUrl = status.results?.zipUrl

  console.log(`Persisting ${slides.length} slides for ${generationId}`)

  // Get original slide text from stored config as fallback
  const slidesConfig = await getSlidesConfig(generationId)

  // Upload images to Supabase Storage and collect new URLs
  // Use processedImageUrl (text-baked) if available, fall back to imageUrl (clean)
  const uploadedSlides = await Promise.all(
    slides.map(async (slide, index) => {
      // Prefer processedImageUrl (text-baked) for static gallery
      const hasProcessedUrl = !!slide.processedImageUrl
      const imageToUpload = slide.processedImageUrl || slide.imageUrl
      console.log(`Slide ${slide.slideNumber}: hasProcessedUrl=${hasProcessedUrl}, uploading=${imageToUpload?.substring(0, 60)}...`)

      const storagePath = `${generationId}/slide-${slide.slideNumber}.png`

      const supabaseUrl = await uploadImageFromUrl(
        imageToUpload,
        'carousel-images',
        storagePath
      )

      if (!supabaseUrl) {
        console.warn(`Failed to upload slide ${slide.slideNumber} image, using original URL: ${imageToUpload}`)
      } else {
        console.log(`Slide ${slide.slideNumber}: uploaded to ${supabaseUrl}`)
      }

      // Use slide data directly, fall back to slidesConfig if missing
      const fallbackText = slidesConfig?.[index] || { headline: '', bodyText: '' }

      return {
        slide_number: slide.slideNumber,
        headline: slide.headline || fallbackText.headline || '',
        body_text: slide.bodyText || fallbackText.bodyText || '',
        image_url: supabaseUrl || imageToUpload,
        original_url: slide.imageUrl,
      }
    })
  )

  // Upload video if exists
  let supabaseVideoUrl: string | null = null
  if (videoUrl) {
    const videoPath = `${generationId}/video.mp4`
    supabaseVideoUrl = await uploadVideoFromUrl(
      videoUrl,
      'carousel-videos',
      videoPath
    )
  }

  // Add slides to database
  console.log(`About to add ${uploadedSlides.length} slides for ${generationId}:`, JSON.stringify(uploadedSlides.map(s => ({ slide_number: s.slide_number, hasImageUrl: !!s.image_url }))))
  const slidesAdded = await addSlides(generationId, uploadedSlides)
  console.log(`Added ${uploadedSlides.length} slides to database: ${slidesAdded ? 'success' : 'FAILED'}`)

  // Update generation status
  await updateGeneration(generationId, {
    status: 'complete',
    video_url: supabaseVideoUrl || videoUrl || null,
    zip_url: zipUrl || null,
  })

  console.log(`Persisted generation ${generationId} to Supabase`)
}
