import { NextRequest, NextResponse } from 'next/server'
import {
  triggerCarouselGeneration,
  generateId,
  setGenerationStatus,
  type N8nWebhookPayload,
} from '@/lib/n8n'
import {
  createGeneration,
  uploadBase64Image,
  updateGeneration,
  addSlides,
  uploadImageFromUrl,
  setSlidesConfig,
  getSlidesConfig,
} from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const generationId = generateId()

  try {
    const payload: N8nWebhookPayload = await request.json()

    // Validate required fields
    if (!payload.heroImage) {
      return NextResponse.json(
        { error: 'Hero image is required' },
        { status: 400 }
      )
    }

    if (!payload.slideCount || payload.slideCount < 1) {
      return NextResponse.json(
        { error: 'Invalid slide count' },
        { status: 400 }
      )
    }

    // Upload hero image to Supabase Storage if it's base64
    let heroImageUrl = payload.heroImage
    if (payload.heroImage.startsWith('data:')) {
      const uploadedUrl = await uploadBase64Image(
        payload.heroImage,
        'carousel-images',
        `${generationId}/hero.jpg`
      )
      if (uploadedUrl) {
        heroImageUrl = uploadedUrl
        console.log(`Uploaded hero image to: ${heroImageUrl}`)
      } else {
        console.warn('Failed to upload hero image, using base64 fallback')
      }
    }

    // Create record in Supabase FIRST (required for status updates)
    try {
      await createGeneration({
        generation_id: generationId,
        hero_image_url: heroImageUrl,
        art_style: payload.artStyle,
        slide_count: payload.slideCount,
        status: 'generating',
      })
      console.log(`Created generation record: ${generationId}`)

      // Store original slide text for later gallery display
      if (payload.slides && payload.slides.length > 0) {
        await setSlidesConfig(
          generationId,
          payload.slides.map((s) => ({ headline: s.headline, bodyText: s.bodyText }))
        )
      }
    } catch (error) {
      console.error('Supabase createGeneration error:', error)
      // Continue with generation even if DB fails
    }

    // Initialize status in Supabase (now that record exists)
    await setGenerationStatus(generationId, {
      status: 'analyzing',
      progress: 5,
      message: 'Starting generation...',
    })

    // Update status - starting generation
    await setGenerationStatus(generationId, {
      status: 'generating',
      progress: 10,
      message: 'Generating slides...',
      totalSlides: payload.slideCount,
    })

    // Trigger n8n webhook and WAIT for response
    // The static workflow uses responseMode: "lastNode" so it returns results synchronously
    const result = await triggerCarouselGeneration({
      ...payload,
      heroImage: heroImageUrl,
      generationId,
    })

    console.log('n8n static workflow completed:', result.success)

    // Extract slides from the result
    const slides = result.results?.slides || result.slides || []
    const isVideoEnabled = payload.outputType === 'video' || payload.outputType === 'both'

    // Update status with results
    if (slides.length > 0) {
      // Determine if we're still processing video
      const status = isVideoEnabled ? 'animating' : 'complete'
      const progress = isVideoEnabled ? 50 : 100

      await setGenerationStatus(generationId, {
        status,
        progress,
        message: isVideoEnabled ? 'Animating slides for video...' : 'Generation complete!',
        results: {
          slides: slides.map((slide: { slideNumber?: number; imageUrl: string }, index: number) => ({
            id: `slide-${index + 1}`,
            slideNumber: slide.slideNumber || index + 1,
            imageUrl: slide.imageUrl,
          })),
        },
      })

      // Persist slides to Supabase in background
      persistSlidesToSupabase(generationId, slides, isVideoEnabled).catch((error) => {
        console.error('Supabase slide persistence error:', error)
      })
    } else {
      // No slides returned - error state
      await setGenerationStatus(generationId, {
        status: 'error',
        progress: 0,
        error: 'No slides were generated',
      })

      await updateGeneration(generationId, { status: 'error' }).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      generationId,
      message: isVideoEnabled ? 'Generation in progress, video rendering...' : 'Generation complete',
    })
  } catch (error) {
    console.error('Generate carousel error:', error)

    // Update status to error (may fail if generation record wasn't created)
    await setGenerationStatus(generationId, {
      status: 'error',
      progress: 0,
      error: error instanceof Error ? error.message : 'Generation failed',
    }).catch(console.error)

    // Try to update database status
    await updateGeneration(generationId, { status: 'error' }).catch(console.error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Persist slides to Supabase Storage
async function persistSlidesToSupabase(
  generationId: string,
  slides: { slideNumber?: number; imageUrl: string }[],
  isVideoEnabled: boolean
): Promise<void> {
  try {
    // Get original slide text from stored config
    const slidesConfig = await getSlidesConfig(generationId)

    // Upload images to Supabase Storage
    const uploadedSlides = await Promise.all(
      slides.map(async (slide, index) => {
        const slideNumber = slide.slideNumber || index + 1
        const storagePath = `${generationId}/slide-${slideNumber}.png`
        const supabaseUrl = await uploadImageFromUrl(
          slide.imageUrl,
          'carousel-images',
          storagePath
        )

        // Get original text from config (index-based)
        const originalText = slidesConfig?.[index] || { headline: '', bodyText: '' }

        return {
          slide_number: slideNumber,
          headline: originalText.headline || '',
          body_text: originalText.bodyText || '',
          image_url: supabaseUrl || slide.imageUrl,
          original_url: slide.imageUrl,
        }
      })
    )

    // Add slides to database
    await addSlides(generationId, uploadedSlides)

    // Update generation status if not waiting for video
    if (!isVideoEnabled) {
      await updateGeneration(generationId, { status: 'complete' })
    }

    console.log(`Persisted ${uploadedSlides.length} slides for generation ${generationId}`)
  } catch (error) {
    console.error('Error persisting slides:', error)
    throw error
  }
}
