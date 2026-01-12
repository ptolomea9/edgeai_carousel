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
  setSlidesConfig,
} from '@/lib/supabase'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

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
    // The kie.ai API requires URLs in input_urls - base64 data won't work
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
        // Cannot proceed without a URL - kie.ai API requires URLs, not base64
        console.error('Failed to upload hero image to storage')
        return NextResponse.json(
          { error: 'Failed to upload hero image. Please try again.' },
          { status: 500 }
        )
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
        user_id: user.id,
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

    // Trigger n8n webhook - returns acknowledgment immediately
    // The workflow now responds right after Extract Config with an acknowledgment
    // Actual slides will be delivered via callback to /api/status/{id}
    const result = await triggerCarouselGeneration({
      ...payload,
      heroImage: heroImageUrl,
      generationId,
    })

    console.log('n8n workflow acknowledged:', result.success, result.message)

    // Check if n8n acknowledged the request
    if (!result.success) {
      await setGenerationStatus(generationId, {
        status: 'error',
        progress: 0,
        error: result.error || 'Failed to start generation',
      })
      await updateGeneration(generationId, { status: 'error' }).catch(console.error)

      return NextResponse.json(
        { error: result.error || 'Failed to start generation' },
        { status: 500 }
      )
    }

    // Generation started successfully - frontend will poll /api/status/{id}
    // n8n will callback to /api/status/{id} with slides when complete
    return NextResponse.json({
      success: true,
      generationId,
      message: 'Generation started, polling for status...',
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
