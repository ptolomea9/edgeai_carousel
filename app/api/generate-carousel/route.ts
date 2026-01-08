import { NextRequest, NextResponse } from 'next/server'
import {
  triggerCarouselGeneration,
  generateId,
  setGenerationStatus,
  type N8nWebhookPayload,
} from '@/lib/n8n'
import { createGeneration } from '@/lib/supabase'

export async function POST(request: NextRequest) {
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

    const generationId = generateId()

    // Initialize status in memory
    setGenerationStatus(generationId, {
      status: 'analyzing',
      progress: 0,
      message: 'Starting generation...',
    })

    // Also create record in Supabase for persistence
    createGeneration({
      generation_id: generationId,
      hero_image_url: payload.heroImage,
      art_style: payload.artStyle,
      slide_count: payload.slideCount,
      status: 'generating',
    }).catch((error) => {
      console.error('Supabase createGeneration error:', error)
      // Non-fatal - continue with generation
    })

    // Trigger n8n webhook (async - don't await)
    triggerCarouselGeneration({
      ...payload,
      generationId,
    }).catch((error) => {
      console.error('n8n webhook error:', error)
      setGenerationStatus(generationId, {
        status: 'error',
        progress: 0,
        error: 'Failed to connect to generation service',
      })
    })

    return NextResponse.json({
      success: true,
      generationId,
      message: 'Generation started',
    })
  } catch (error) {
    console.error('Generate carousel error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
