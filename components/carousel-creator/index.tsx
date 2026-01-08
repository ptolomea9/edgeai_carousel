'use client'

import { useState, useMemo, memo } from 'react'
import Link from 'next/link'
import { Dithering } from '@paper-design/shaders-react'
import { Loader2, Sparkles, Images, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { HeroImageUpload } from './hero-image-upload'
import { SlideCountSelector } from './slide-count-selector'
import { ArtStylePicker } from './art-style-picker'
import { SlideTextEditor } from './slide-text-editor'
import { BrandingOptions } from './branding-options'
import { OutputOptions } from './output-options'
import { MusicLibrary } from './music-library'
import { CarouselPreview } from './carousel-preview'
import type {
  CarouselConfig,
  SlideContent,
  ArtStyle,
  OutputType,
  GenerationStatus,
} from './types'

const DEFAULT_SLIDE_COUNT = 6

const MemoizedDithering = memo(Dithering)

function generateSlideContents(count: number): SlideContent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `slide-${i + 1}`,
    slideNumber: i + 1,
    headline: '',
    bodyText: '',
  }))
}

export function CarouselCreator() {
  // Hero image state
  const [heroImage, setHeroImage] = useState<File | null>(null)
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null)

  // Carousel config state
  const [slideCount, setSlideCount] = useState(DEFAULT_SLIDE_COUNT)
  const [artStyle, setArtStyle] = useState<ArtStyle>('synthwave')
  const [customStylePrompt, setCustomStylePrompt] = useState('')
  const [slides, setSlides] = useState<SlideContent[]>(
    generateSlideContents(DEFAULT_SLIDE_COUNT)
  )
  const [topic, setTopic] = useState('')
  const [isGeneratingText, setIsGeneratingText] = useState(false)

  // Branding state
  const [includeBranding, setIncludeBranding] = useState(true)
  const [brandingText, setBrandingText] = useState('RealTPO.com')
  const [brandingPosition, setBrandingPosition] = useState<
    'top' | 'bottom' | 'watermark'
  >('watermark')

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
    const reader = new FileReader()
    reader.onloadend = () => {
      setHeroImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleHeroImageRemove = () => {
    setHeroImage(null)
    setHeroImagePreview(null)
  }

  // Handle auto-generate slide text
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
          }))
        )
      }
    } catch (error) {
      console.error('Auto-generate error:', error)
      alert('Failed to generate text. Please try again.')
    } finally {
      setIsGeneratingText(false)
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
            position: brandingPosition,
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
      brandingPosition,
      outputType,
      selectedMusicTrackId,
      recipientEmail,
    ]
  )

  // Handle generation
  const handleGenerate = async () => {
    if (!heroImage) {
      alert('Please upload a hero image for character reference')
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

      // Poll for status
      const pollStatus = async () => {
        const statusResponse = await fetch(`/api/status/${generationId}`)
        const status: GenerationStatus = await statusResponse.json()

        setGenerationStatus(status)

        if (status.status === 'complete' || status.status === 'error') {
          setIsGenerating(false)
          return
        }

        // Continue polling
        setTimeout(pollStatus, 2000)
      }

      pollStatus()
    } catch (error) {
      console.error('Generation error:', error)
      setGenerationStatus({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Generation failed',
      })
      setIsGenerating(false)
    }
  }

  const canGenerate = heroImage !== null && !isGenerating

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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              EdgeAI Carousel Creator
            </h1>
            <p className="text-gray-400 mt-1">
              Generate character-consistent carousel ads with AI
            </p>
          </div>
          <Link
            href="/gallery"
            className="flex items-center gap-2 px-4 py-2 bg-black/70 border border-white/20 rounded-lg text-gray-300 hover:bg-black/90 hover:text-white hover:border-white/40 transition-all"
          >
            <Images className="size-4" />
            Gallery
          </Link>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-4">
            {/* Hero Image Upload */}
            <section className="p-5 bg-black/70 border border-white/10 rounded-lg backdrop-blur-sm">
              <HeroImageUpload
                onImageSelect={handleHeroImageSelect}
                onImageClear={handleHeroImageRemove}
                imagePreview={heroImagePreview}
              />
            </section>

            {/* Tabs for Configuration */}
            <div className="bg-black/70 border border-white/10 rounded-lg backdrop-blur-sm p-4">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-white/10 rounded-lg p-1">
                  <TabsTrigger
                    value="content"
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:text-black transition-all"
                  >
                    Content
                  </TabsTrigger>
                  <TabsTrigger
                    value="style"
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:text-black transition-all"
                  >
                    Style
                  </TabsTrigger>
                  <TabsTrigger
                    value="output"
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:text-black transition-all"
                  >
                    Output
                  </TabsTrigger>
                </TabsList>

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
                    />
                  </section>

                  <section className="p-4 bg-black/50 border border-white/10 rounded-lg">
                    <BrandingOptions
                      brandingText={brandingText}
                      onBrandingTextChange={setBrandingText}
                      brandingPosition={brandingPosition}
                      onBrandingPositionChange={setBrandingPosition}
                      includeBranding={includeBranding}
                      onIncludeBrandingChange={setIncludeBranding}
                    />
                  </section>
                </TabsContent>

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
                        <h3 className="font-medium">Email Results</h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        Receive your carousel images and video via email when generation completes.
                      </p>
                      <input
                        type="email"
                        placeholder="your@email.com (optional)"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-white/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </section>
                </TabsContent>
              </Tabs>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={cn(
                'w-full h-14 text-lg font-semibold rounded-lg transition-all',
                canGenerate
                  ? 'bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10'
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

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <section className="p-5 bg-black/70 border border-white/10 rounded-lg backdrop-blur-sm">
              <CarouselPreview
                status={generationStatus}
                className="min-h-[500px]"
              />
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-500">
          Powered by EdgeAI Media
        </div>
      </div>
    </div>
  )
}
