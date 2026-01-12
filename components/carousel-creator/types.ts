export interface SlideContent {
  id: string
  slideNumber: number
  headline: string
  bodyText: string
  characterAction?: string  // e.g., "owl perched on bridge, wings folded, head tilted curiously"
}

export interface CarouselConfig {
  heroImage: string | null // base64 encoded image
  slideCount: number
  artStyle: ArtStyle
  customStylePrompt?: string
  slides: SlideContent[]
  branding?: {
    text: string
    position?: 'watermark'  // Always bottom-right watermark, kept for API compatibility
  }
  outputType: OutputType
  musicTrackId?: string
  musicUrl?: string // Direct URL for custom-generated tracks (bypasses getMusicUrl lookup)
  recipientEmail?: string // Email to send results to
}

export type ArtStyle =
  | 'synthwave'
  | 'anime'
  | '3d-pixar'
  | 'watercolor'
  | 'minimalist'
  | 'comic'
  | 'photorealistic'
  | 'custom'

export const ART_STYLE_LABELS: Record<ArtStyle, string> = {
  synthwave: 'Synthwave / Miami Vice',
  anime: 'Anime / Manga',
  '3d-pixar': '3D Pixar Style',
  watercolor: 'Watercolor',
  minimalist: 'Minimalist / Corporate',
  comic: 'Comic Book',
  photorealistic: 'Photorealistic',
  custom: 'Custom Style',
}

export const ART_STYLE_DESCRIPTIONS: Record<ArtStyle, string> = {
  synthwave: 'Neon colors, sunset gradients, retro 80s aesthetic',
  anime: 'Japanese animation style with bold lines and expressive characters',
  '3d-pixar': 'High-quality 3D rendering with warm, friendly characters',
  watercolor: 'Soft, artistic watercolor painting style',
  minimalist: 'Clean, professional look with simple shapes and muted colors',
  comic: 'Bold outlines, halftone dots, dynamic action poses',
  photorealistic: 'Highly detailed, realistic imagery',
  custom: 'Describe your own custom art style',
}

export type OutputType = 'static' | 'video' | 'both'

export interface MusicTrack {
  id: string
  title: string
  artist: string
  duration: number
  category: 'upbeat' | 'corporate' | 'chill' | 'epic' | 'emotional'
  previewUrl: string
  fullUrl: string
  bpm?: number
}

export interface GenerationStatus {
  status: 'pending' | 'analyzing' | 'generating' | 'animating' | 'complete' | 'error'
  progress: number
  currentSlide?: number
  totalSlides?: number
  message?: string
  error?: string
  results?: GenerationResult
}

export interface GenerationResult {
  slides: GeneratedSlide[]
  videoUrl?: string
  zipUrl?: string
}

export interface GeneratedSlide {
  id: string
  imageUrl: string
  processedImageUrl?: string  // Text-baked image for static display
  slideNumber: number
}
