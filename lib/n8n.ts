// n8n webhook integration helpers

import {
  setStatusDetails,
  getStatusDetails,
  setVideoExecution,
  getVideoExecution,
  type StatusDetails,
  type VideoExecutionDetails,
} from './supabase'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'
const N8N_API_URL = process.env.N8N_API_URL || 'https://edgeaimedia.app.n8n.cloud/api/v1'
const N8N_API_KEY = process.env.N8N_API_KEY || ''
const N8N_VIDEO_WORKFLOW_ID = process.env.N8N_VIDEO_WORKFLOW_ID || '0MpzxUS4blJI7vgm'

// Music track definitions - shared between frontend and backend
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
    duration: '2:30',
    previewUrl: '/music/energy-boost-preview.mp3',
    fullUrl: '/music/energy-boost.mp3',
  },
  {
    id: 'corporate-1',
    name: 'Business Forward',
    genre: 'Corporate',
    duration: '2:45',
    previewUrl: '/music/business-forward-preview.mp3',
    fullUrl: '/music/business-forward.mp3',
  },
  {
    id: 'chill-1',
    name: 'Smooth Vibes',
    genre: 'Chill',
    duration: '3:00',
    previewUrl: '/music/smooth-vibes-preview.mp3',
    fullUrl: '/music/smooth-vibes.mp3',
  },
  {
    id: 'epic-1',
    name: 'Rise Up',
    genre: 'Epic',
    duration: '2:15',
    previewUrl: '/music/rise-up-preview.mp3',
    fullUrl: '/music/rise-up.mp3',
  },
]

// Get full music URL from track ID
export function getMusicUrl(trackId: string | undefined): string | undefined {
  if (!trackId) return undefined
  const track = MUSIC_TRACKS.find((t) => t.id === trackId)
  if (!track) return undefined
  // Return absolute URL for n8n to access
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://edgeai-carousel.vercel.app'
  return `${baseUrl}${track.fullUrl}`
}

export interface N8nWebhookPayload {
  heroImage: string | null
  slideCount: number
  artStyle: string
  customStylePrompt?: string
  slides: {
    id: string
    slideNumber: number
    headline: string
    bodyText: string
    characterAction?: string
  }[]
  branding?: {
    text: string
    position: 'top' | 'bottom' | 'watermark'
  }
  outputType: 'static' | 'video' | 'both'
  musicTrackId?: string
  recipientEmail?: string
}

export interface N8nWebhookResponse {
  success: boolean
  generationId: string
  message?: string
}

export async function triggerCarouselGeneration(
  payload: N8nWebhookPayload & { generationId?: string }
): Promise<N8nWebhookResponse> {
  // Always trigger the static carousel generation workflow first
  const staticResponse = await fetch(`${N8N_WEBHOOK_URL}/carousel-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!staticResponse.ok) {
    const error = await staticResponse.text()
    throw new Error(`n8n carousel-generate webhook failed: ${error}`)
  }

  const staticResult = await staticResponse.json()

  console.log('Static workflow response:', JSON.stringify(staticResult, null, 2))

  // If output type includes video, also trigger the video generation workflow
  if (payload.outputType === 'video' || payload.outputType === 'both') {
    // Extract the generated slides from the static workflow result
    // The slides are in results.slides (from Collect All Results node)
    const generatedSlides = staticResult.results?.slides || staticResult.slides || []

    console.log('Generated slides for video:', JSON.stringify(generatedSlides, null, 2))

    if (generatedSlides.length > 0) {
      // Map slides to the format expected by video workflow
      // Filter for slides with imageUrl (success is already filtered by the workflow)
      const videoSlides = generatedSlides
        .filter((slide: { success?: boolean; imageUrl?: string }) => slide.imageUrl)
        .map((slide: { slideNumber: number; imageUrl: string }) => ({
          slideNumber: slide.slideNumber,
          imageUrl: slide.imageUrl,
        }))

      console.log('Video slides to send:', JSON.stringify(videoSlides, null, 2))

      if (videoSlides.length > 0) {
        const videoGenId = payload.generationId || staticResult.generationId
        // Mark video generation as pending before triggering
        await setVideoExecutionPending(videoGenId)
        // Resolve musicTrackId to full URL for n8n
        const musicUrl = getMusicUrl(payload.musicTrackId)
        triggerVideoGeneration({
          generationId: videoGenId,
          slides: videoSlides,
          musicTrackId: payload.musicTrackId,
          musicUrl,
          slideDuration: 3,
          transitionDuration: 0.5,
          recipientEmail: payload.recipientEmail,
        }).catch((error) => {
          console.error('Video generation trigger failed:', error)
        })
      } else {
        console.error('No slides with imageUrl to create video from. Slides:', generatedSlides)
      }
    } else {
      console.error('No slides returned from static generation. Full result:', staticResult)
    }
  }

  return staticResult
}

export interface VideoGenerationPayload {
  generationId: string
  slides: {
    slideNumber: number
    imageUrl: string
  }[]
  musicTrackId?: string
  musicUrl?: string
  slideDuration?: number
  transitionDuration?: number
  recipientEmail?: string
}

export async function triggerVideoGeneration(
  payload: VideoGenerationPayload
): Promise<N8nWebhookResponse> {
  // Ensure musicUrl is resolved if musicTrackId is provided
  const musicUrl = payload.musicUrl || getMusicUrl(payload.musicTrackId)
  const payloadWithMusic = {
    ...payload,
    musicUrl,
  }

  console.log('Triggering video generation with musicUrl:', musicUrl || 'none')

  const response = await fetch(`${N8N_WEBHOOK_URL}/carousel-video-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payloadWithMusic),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`n8n carousel-video-generate webhook failed: ${error}`)
  }

  // The video webhook uses responseMode: "onReceived" which returns immediately
  // before the workflow completes. It may return a simple acknowledgment string
  // rather than JSON. The app polls for status separately.
  const responseText = await response.text()

  try {
    return JSON.parse(responseText)
  } catch {
    // If not valid JSON, return a simple acknowledgment
    console.log('Video webhook acknowledged:', responseText)
    return {
      success: true,
      generationId: payload.generationId,
      message: 'Video generation started',
    }
  }
}

export interface GenerationStatusResponse {
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
      processedImageUrl?: string  // Text-baked image for static display
    }[]
    zipUrl?: string
    videoUrl?: string
  }
  error?: string
}

export async function getGenerationStatus(
  generationId: string
): Promise<GenerationStatusResponse> {
  const response = await fetch(
    `${N8N_WEBHOOK_URL}/carousel-status/${generationId}`
  )

  if (!response.ok) {
    throw new Error('Failed to get generation status')
  }

  return response.json()
}

// Status persistence using Supabase for serverless compatibility
// These functions are async to support database operations

export async function setGenerationStatus(
  generationId: string,
  status: GenerationStatusResponse
): Promise<void> {
  await setStatusDetails(generationId, status as StatusDetails)
}

export async function getStoredStatus(
  generationId: string
): Promise<GenerationStatusResponse | undefined> {
  const status = await getStatusDetails(generationId)
  return status as GenerationStatusResponse | undefined
}

export function generateId(): string {
  return `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Video execution tracking using Supabase for serverless compatibility
interface VideoExecutionInfo {
  pending: boolean
  videoUrl?: string
  videoClips?: { slideNumber: number; videoUrl: string }[]
  lastChecked?: number
}

export async function setVideoExecutionPending(generationId: string): Promise<void> {
  await setVideoExecution(generationId, { pending: true })
}

export async function getVideoExecutionInfo(generationId: string): Promise<VideoExecutionInfo | undefined> {
  const info = await getVideoExecution(generationId)
  return info as VideoExecutionInfo | undefined
}

export async function setVideoExecutionComplete(
  generationId: string,
  videoUrl: string,
  videoClips?: { slideNumber: number; videoUrl: string }[]
): Promise<void> {
  await setVideoExecution(generationId, {
    pending: false,
    videoUrl,
    videoClips,
  })
}

// Poll n8n API for video workflow execution status
export interface VideoExecutionResult {
  status: 'pending' | 'running' | 'success' | 'error'
  videoUrl?: string
  videoClips?: { slideNumber: number; videoUrl: string }[]
  message?: string
}

export async function pollVideoWorkflowStatus(
  generationId: string
): Promise<VideoExecutionResult> {
  if (!N8N_API_KEY) {
    console.warn('N8N_API_KEY not configured, cannot poll video workflow')
    return { status: 'error', message: 'N8N_API_KEY not configured' }
  }

  try {
    // Query executions for the video workflow, filtered by generationId in the input
    const response = await fetch(
      `${N8N_API_URL}/executions?workflowId=${N8N_VIDEO_WORKFLOW_ID}&limit=10&includeData=true`,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('n8n API error:', response.status, errorText)
      return { status: 'error', message: `n8n API error: ${response.status}` }
    }

    const data = await response.json()
    const executions = data.data || []

    // Find execution matching this generationId
    for (const execution of executions) {
      // Check if this execution is for our generationId
      const webhookData = execution.data?.resultData?.runData?.['Video Generation Webhook']?.[0]?.data?.main?.[0]?.[0]?.json
      const bodyGenerationId = webhookData?.body?.generationId || webhookData?.generationId

      if (bodyGenerationId === generationId) {
        // Found the execution for this generation
        const status = execution.status

        if (status === 'success' || execution.finished) {
          // Extract video results from "Format Final Result" node
          const formatResultData = execution.data?.resultData?.runData?.['Format Final Result']?.[0]?.data?.main?.[0]?.[0]?.json

          if (formatResultData) {
            const videoUrl = formatResultData.results?.videoUrl || formatResultData.results?.mergedVideoUrl
            const videoClips = formatResultData.results?.videoClips?.filter(
              (clip: { success?: boolean; videoUrl?: string }) => clip.success && clip.videoUrl
            ).map((clip: { slideNumber: number; videoUrl: string }) => ({
              slideNumber: clip.slideNumber,
              videoUrl: clip.videoUrl,
            }))

            return {
              status: 'success',
              videoUrl: videoUrl || (videoClips?.[0]?.videoUrl),
              videoClips,
              message: formatResultData.message,
            }
          }
        } else if (status === 'error') {
          return { status: 'error', message: 'Video workflow failed' }
        } else if (status === 'waiting' || status === 'running') {
          return { status: 'running', message: 'Video generation in progress' }
        }

        return { status: 'pending', message: 'Video workflow pending' }
      }
    }

    // No execution found for this generationId yet
    return { status: 'pending', message: 'Video workflow not started yet' }
  } catch (error) {
    console.error('Error polling video workflow:', error)
    return { status: 'error', message: `Poll error: ${error}` }
  }
}
