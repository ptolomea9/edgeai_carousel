'use client'

import { useState, useMemo, memo } from 'react'
import Link from 'next/link'
import { Dithering } from '@paper-design/shaders-react'
import { Loader2, Sparkles, Images, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { HeroImageUpload } from './hero-image-upload'
import { HeroImageEditor } from './hero-image-editor'
import { SlideCountSelector } from './slide-count-selector'
import { ArtStylePicker } from './art-style-picker'
import { SlideTextEditor } from './slide-text-editor'
import { BrandingOptions } from './branding-options'
import { OutputOptions } from './output-options'
import { MusicLibrary } from './music-library'
import { CarouselPreview } from './carousel-preview'
import { UserMenu } from '@/components/auth/user-menu'
import type {
  CarouselConfig,
  SlideContent,
  ArtStyle,
  OutputType,
  GenerationStatus,
} from './types'

const DEFAULT_SLIDE_COUNT = 6

const MemoizedDithering = memo(Dithering)

// Email validation helper - stricter to catch typos like "gmail..com"
const isValidEmail = (email: string): boolean => {
  // Basic format check + no consecutive dots + valid TLD length
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
         !email.includes('..') &&
         email.split('.').pop()!.length >= 2
}

function generateSlideContents(count: number): SlideContent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `slide-${i + 1}`,
    slideNumber: i + 1,
    headline: '',
    bodyText: '',
    characterAction: '',
  }))
}

export function CarouselCreator() {
  const { toast } = useToast()

  // Hero image state
  const [heroImage, setHeroImage] = useState<File | null>(null)
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null)
  const [originalHeroImage, setOriginalHeroImage] = useState<string | null>(null)
  const [isHeroImageEdited, setIsHeroImageEdited] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Carousel config state
  const [slideCount, setSlideCount] = useState(DEFAULT_SLIDE_COUNT)
  const [artStyle, setArtStyle] = useState<ArtStyle>('synthwave')
  const [customStylePrompt, setCustomStylePrompt] = useState('')
  const [slides, setSlides] = useState<SlideContent[]>(
    generateSlideContents(DEFAULT_SLIDE_COUNT)
  )
  const [topic, setTopic] = useState('')
  const [isGeneratingText, setIsGeneratingText] = useState(false)
  const [generatingActionSlideId, setGeneratingActionSlideId] = useState<string | null>(null)

  // Branding state
  const [includeBranding, setIncludeBranding] = useState(true)
  const [brandingText, setBrandingText] = useState('RealTPO.com')

  // Output state
  const [outputType, setOutputType] = useState<OutputType>('both')
  const [selectedMusicTrackId, setSelectedMusicTrackId] = useState<
    string | null
  >(null)
  const [recipientEmail, setRecipientEmail] = useState('')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] =
    useState<GenerationStatus | null>(null)

  // Handle slide count change
  const handleSlideCountChange = (count: number) => {
    setSlideCount(count)
    setSlides((prev) => {
      if (count > prev.length) {
        // Add more slides
        const newSlides = [...prev]
        for (let i = prev.length; i < count; i++) {
          newSlides.push({
            id: `slide-${i + 1}`,
            slideNumber: i + 1,
            headline: '',
            bodyText: '',
            characterAction: '',
          })
        }
        return newSlides
      } else {
        // Remove slides
        return prev.slice(0, count)
      }
    })
  }

  // Handle hero image upload
  const handleHeroImageSelect = (file: File) => {
    setHeroImage(file)
    // Reset edit state when a new image is uploaded
    setOriginalHeroImage(null)
    setIsHeroImageEdited(false)
    const reader = new FileReader()
    reader.onloadend = () => {
      setHeroImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleHeroImageRemove = () => {
    setHeroImage(null)
    setHeroImagePreview(null)
    setOriginalHeroImage(null)
    setIsHeroImageEdited(false)
  }

  // Hero image editing handlers
  const handleEditClick = () => {
    setIsEditorOpen(true)
  }

  const handleApplyEdit = (editedImageUrl: string) => {
    // Save original if this is the first edit
    if (!originalHeroImage && heroImagePreview) {
      setOriginalHeroImage(heroImagePreview)
    }
    setHeroImagePreview(editedImageUrl)
    setIsHeroImageEdited(true)
    setIsEditorOpen(false)
  }

  const handleRevertToOriginal = () => {
    if (originalHeroImage) {
      setHeroImagePreview(originalHeroImage)
      setOriginalHeroImage(null)
      setIsHeroImageEdited(false)
    }
  }

  // Handle auto-generate slide text (and character actions if hero image provided)
  const handleAutoGenerate = async () => {
    if (!topic.trim()) return

    setIsGeneratingText(true)
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          slideCount,
          artStyle,
          heroImage: heroImagePreview, // Pass hero image for character action generation
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate text')
      }

      const data = await response.json()

      if (data.slides && Array.isArray(data.slides)) {
        setSlides((prev) =>
          prev.map((slide, index) => ({
            ...slide,
            headline: data.slides[index]?.headline || slide.headline,
            bodyText: data.slides[index]?.bodyText || slide.bodyText,
            characterAction: data.slides[index]?.characterAction || slide.characterAction,
          }))
        )
      }
    } catch (error) {
      console.error('Auto-generate error:', error)
      toast({
        title: 'Text Generation Failed',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingText(false)
    }
  }

  // Generate character action for a single slide
  const handleGenerateAction = async (slideId: string) => {
    if (!heroImagePreview) {
      toast({
        title: 'Hero Image Required',
        description: 'Please upload a hero image to generate character actions.',
        variant: 'destructive',
      })
      return
    }

    const slide = slides.find((s) => s.id === slideId)
    if (!slide) return

    setGeneratingActionSlideId(slideId)
    try {
      const response = await fetch('/api/generate-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heroImage: heroImagePreview,
          slideNumber: slide.slideNumber,
          headline: slide.headline,
          bodyText: slide.bodyText,
          artStyle,
          totalSlides: slideCount,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate character action')
      }

      const data = await response.json()

      if (data.characterAction) {
        setSlides((prev) =>
          prev.map((s) =>
            s.id === slideId
              ? { ...s, characterAction: data.characterAction }
              : s
          )
        )
      }
    } catch (error) {
      console.error('Generate action error:', error)
      toast({
        title: 'Generation Failed',
        description: 'Could not generate character action. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setGeneratingActionSlideId(null)
    }
  }

  // Build config object
  const config: CarouselConfig = useMemo(
    () => ({
      heroImage: heroImagePreview,
      slideCount,
      artStyle,
      customStylePrompt: artStyle === 'custom' ? customStylePrompt : undefined,
      slides,
      branding: includeBranding
        ? {
            text: brandingText,
            position: 'watermark',
          }
        : undefined,
      outputType,
      musicTrackId: selectedMusicTrackId || undefined,
      recipientEmail: recipientEmail.trim() || undefined,
    }),
    [
      heroImagePreview,
      slideCount,
      artStyle,
      customStylePrompt,
      slides,
      includeBranding,
      brandingText,
      outputType,
      selectedMusicTrackId,
      recipientEmail,
    ]
  )

  // Handle generation
  const handleGenerate = async () => {
    if (!heroImage) {
      toast({
        title: 'Hero Image Required',
        description: 'Please upload a hero image for character reference',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    setGenerationStatus({
      status: 'analyzing',
      progress: 0,
      message: 'Analyzing hero image...',
    })

    try {
      // Trigger n8n workflow
      const response = await fetch('/api/generate-carousel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Failed to start generation')
      }

      const { generationId } = await response.json()

      // Poll for status with timeout (15 minutes max for video generation)
      const POLL_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
      const pollStartTime = Date.now()

      const pollStatus = async () => {
        // Check for timeout
        if (Date.now() - pollStartTime > POLL_TIMEOUT_MS) {
          setIsGenerating(false)
          setGenerationStatus({
            status: 'error',
            progress: 0,
            error: 'Generation timed out. Please check your email for results or try again.',
          })
          toast({
            title: 'Generation Timed Out',
            description: 'The generation is taking longer than expected. Check your email for results.',
            variant: 'destructive',
          })
          return
        }

        const statusResponse = await fetch(`/api/status/${generationId}`)
        const status: GenerationStatus = await statusResponse.json()

        setGenerationStatus(status)

        if (status.status === 'complete' || status.status === 'error') {
          setIsGenerating(false)
          if (status.status === 'complete') {
            toast({
              title: 'Carousel Generated!',
              description: `${status.results?.slides?.length || 0} slides ready for download`,
            })
          } else if (status.status === 'error') {
            toast({
              title: 'Generation Failed',
              description: status.error || 'An error occurred during generation',
              variant: 'destructive',
            })
          }
          return
        }

        // Continue polling
        setTimeout(pollStatus, 2000)
      }

      pollStatus()
    } catch (error) {
      console.error('Generation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Generation failed'
      setGenerationStatus({
        status: 'error',
        progress: 0,
        error: errorMessage,
      })
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      setIsGenerating(false)
    }
  }

  const canGenerate = heroImage !== null && !isGenerating && isValidEmail(recipientEmail.trim())

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Animated shader background */}
      <div className="fixed inset-0 z-0 shader-background">
        <MemoizedDithering
          colorBack="#00000000"
          colorFront="#005B5B"
          speed={0.3}
          shape="wave"
          type="4x4"
          pxSize={3}
          scale={1.13}
          style={{
            backgroundColor: '#000000',
            height: '100vh',
            width: '100vw',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with entrance animation */}
        <div className="mb-8 flex items-center justify-between animate-fade-in-up relative z-50">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-glow-teal">
              EdgeAI Carousel Creator
            </h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base">
              Generate character-consistent carousel ads with AI
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/gallery"
              className="flex items-center gap-2 px-4 py-2.5 bg-black/70 border border-white/20 rounded-lg text-gray-300 hover:bg-[var(--teal-900)]/30 hover:text-[var(--teal-300)] hover:border-[var(--teal-700)] transition-all duration-300 card-hover"
            >
              <Images className="size-4" />
              <span className="font-medium">Gallery</span>
            </Link>
            <UserMenu />
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-4">
            {/* Hero Image Upload - Staggered entrance */}
            <section className="p-5 bg-black/70 border border-white/10 rounded-xl backdrop-blur-sm card-hover noise-overlay animate-fade-in-up delay-100">
              <HeroImageUpload
                onImageSelect={handleHeroImageSelect}
                onImageClear={handleHeroImageRemove}
                imagePreview={heroImagePreview}
                onEditClick={handleEditClick}
                onRevertToOriginal={handleRevertToOriginal}
                isEdited={isHeroImageEdited}
              />
            </section>

            {/* Hero Image Editor Dialog */}
            {heroImagePreview && (
              <HeroImageEditor
                imagePreview={heroImagePreview}
                originalImage={originalHeroImage}
                isOpen={isEditorOpen}
                onOpenChange={setIsEditorOpen}
                onApplyEdit={handleApplyEdit}
              />
            )}

            {/* Tabs for Configuration - Staggered entrance */}
            <div className="bg-black/70 border border-white/10 rounded-xl backdrop-blur-sm p-4 card-hover noise-overlay animate-fade-in-up delay-200">
              <Tabs defaultValue="style" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-[var(--teal-900)]/30 rounded-lg p-1">
                  <TabsTrigger
                    value="style"
                    className="rounded-md font-medium data-[state=active]:bg-[var(--teal-500)] data-[state=active]:text-black data-[state=active]:glow-teal-sm transition-all duration-300"
                  >
                    Style
                  </TabsTrigger>
                  <TabsTrigger
                    value="content"
                    className="rounded-md font-medium data-[state=active]:bg-[var(--teal-500)] data-[state=active]:text-black data-[state=active]:glow-teal-sm transition-all duration-300"
                  >
                    Content
                  </TabsTrigger>
                  <TabsTrigger
                    value="output"
                    className="rounded-md font-medium data-[state=active]:bg-[var(--teal-500)] data-[state=active]:text-black data-[state=active]:glow-teal-sm transition-all duration-300"
                  >
                    Output
                  </TabsTrigger>
                </TabsList>

                {/* Style Tab */}
                <TabsContent value="style" className="mt-4 space-y-4">
                  <section className="p-4 bg-black/50 border border-white/10 rounded-lg">
                    <ArtStylePicker
                      value={artStyle}
                      onChange={setArtStyle}
                      customPrompt={customStylePrompt}
                      onCustomPromptChange={setCustomStylePrompt}
                    />
                  </section>
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="mt-4 space-y-4">
                  <section className="p-4 bg-black/50 border border-white/10 rounded-lg">
                    <SlideCountSelector
                      value={slideCount}
                      onChange={handleSlideCountChange}
                    />
                  </section>

                  <section className="p-4 bg-black/50 border border-white/10 rounded-lg">
                    <SlideTextEditor
                      slides={slides}
                      onChange={setSlides}
                      topic={topic}
                      onTopicChange={setTopic}
                      onAutoGenerate={handleAutoGenerate}
                      isGenerating={isGeneratingText}
                      heroImage={heroImagePreview}
                      onGenerateAction={handleGenerateAction}
                      generatingActionSlideId={generatingActionSlideId}
                    />
                  </section>

                  <section className="p-4 bg-black/50 border border-white/10 rounded-lg">
                    <BrandingOptions
                      brandingText={brandingText}
                      onBrandingTextChange={setBrandingText}
                      includeBranding={includeBranding}
                      onIncludeBrandingChange={setIncludeBranding}
                    />
                  </section>
                </TabsContent>

                {/* Output Tab */}
                <TabsContent value="output" className="mt-4 space-y-4">
                  <section className="p-4 bg-black/50 border border-white/10 rounded-lg">
                    <OutputOptions value={outputType} onChange={setOutputType} />
                  </section>

                  {(outputType === 'video' || outputType === 'both') && (
                    <section className="p-4 bg-black/50 border border-white/10 rounded-lg">
                      <MusicLibrary
                        selectedTrackId={selectedMusicTrackId}
                        onSelectTrack={setSelectedMusicTrackId}
                      />
                    </section>
                  )}

                  {/* Email Notification */}
                  <section className="p-4 bg-black/50 border border-white/10 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="size-5 text-gray-400" />
                        <h3 className="font-medium">Email Results <span className="text-red-400">*</span></h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        Receive your carousel images and video via email when generation completes.
                      </p>
                      <input
                        type="email"
                        placeholder="your@email.com (required)"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className={cn(
                          "w-full px-3 py-2 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors",
                          recipientEmail && !isValidEmail(recipientEmail)
                            ? "border-red-400/50 focus:border-red-400"
                            : "border-white/20 focus:border-white/50"
                        )}
                      />
                      {recipientEmail && !isValidEmail(recipientEmail) && (
                        <p className="text-xs text-red-400">Please enter a valid email address</p>
                      )}
                    </div>
                  </section>
                </TabsContent>
              </Tabs>
            </div>

            {/* Generate Button - Prominent teal accent with glow */}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={cn(
                'w-full h-14 text-lg font-display font-bold rounded-xl transition-all duration-300 animate-fade-in-up delay-300',
                canGenerate
                  ? 'bg-gradient-to-r from-[var(--teal-500)] to-[var(--teal-600)] text-black hover:from-[var(--teal-400)] hover:to-[var(--teal-500)] glow-teal hover:glow-teal-lg'
                  : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-5 mr-2" />
                  Generate Carousel
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Preview with gradient border accent */}
          <div className="lg:sticky lg:top-8 lg:self-start animate-slide-in-right delay-200">
            <section className="p-5 bg-black/70 border border-white/10 rounded-xl backdrop-blur-sm gradient-border noise-overlay">
              <CarouselPreview
                status={generationStatus}
                className="min-h-[500px]"
              />
            </section>
          </div>
        </div>

        {/* Footer with subtle branding */}
        <div className="mt-12 pt-6 border-t border-white/5 text-center animate-fade-in-up delay-500">
          <p className="text-sm text-gray-500 font-medium">
            Powered by <span className="text-[var(--teal-500)]">EdgeAI Media</span>
          </p>
        </div>
      </div>
    </div>
  )
}
