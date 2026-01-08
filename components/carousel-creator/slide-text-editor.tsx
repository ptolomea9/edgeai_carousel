'use client'

import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SlideContent } from './types'

interface SlideTextEditorProps {
  slides: SlideContent[]
  onChange: (slides: SlideContent[]) => void
  topic: string
  onTopicChange: (topic: string) => void
  onAutoGenerate: () => void
  isGenerating?: boolean
  className?: string
}

export function SlideTextEditor({
  slides,
  onChange,
  topic,
  onTopicChange,
  onAutoGenerate,
  isGenerating = false,
  className,
}: SlideTextEditorProps) {
  const updateSlide = useCallback(
    (index: number, updates: Partial<SlideContent>) => {
      const newSlides = [...slides]
      newSlides[index] = { ...newSlides[index], ...updates }
      onChange(newSlides)
    },
    [slides, onChange]
  )

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <label className="text-sm font-medium text-gray-300">
          Slide Content
        </label>
        <p className="text-xs text-gray-500">
          Describe your topic and auto-generate, or manually edit each slide
        </p>
      </div>

      {/* Topic input and auto-generate */}
      <div className="space-y-2 p-3 bg-black/40 border border-gray-700">
        <label className="text-xs font-medium text-gray-400">
          What is your carousel about?
        </label>
        <Textarea
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="e.g., 5 tips for first-time home buyers, How to save money on your mortgage, Why refinancing now makes sense..."
          className="min-h-[60px] bg-black/50 border-gray-600 text-white text-sm placeholder:text-gray-600"
          disabled={isGenerating}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onAutoGenerate}
          disabled={!topic.trim() || isGenerating}
          className="w-full bg-black/50 border-gray-600 text-gray-300 hover:bg-black hover:text-white disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-3 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="size-3 mr-1" />
              Auto-generate Slide Content
            </>
          )}
        </Button>
      </div>

      {/* Individual slide editors */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="p-3 bg-black/30 border border-gray-700 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">
                Slide {index + 1}
              </span>
            </div>

            <Input
              value={slide.headline}
              onChange={(e) =>
                updateSlide(index, { headline: e.target.value })
              }
              placeholder={`Headline for slide ${index + 1}...`}
              className="bg-black/50 border-gray-600 text-white text-sm placeholder:text-gray-600"
              maxLength={50}
            />

            <Textarea
              value={slide.bodyText}
              onChange={(e) =>
                updateSlide(index, { bodyText: e.target.value })
              }
              placeholder="Body text or bullet points..."
              className="min-h-[60px] bg-black/50 border-gray-600 text-white text-xs placeholder:text-gray-600"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
