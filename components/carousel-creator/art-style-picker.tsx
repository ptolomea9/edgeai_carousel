'use client'

import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ArtStyle,
  ART_STYLE_LABELS,
  ART_STYLE_DESCRIPTIONS,
} from './types'

interface ArtStylePickerProps {
  value: ArtStyle
  onChange: (style: ArtStyle) => void
  customPrompt: string
  onCustomPromptChange: (prompt: string) => void
  className?: string
}

const STYLE_ICONS: Record<ArtStyle, string> = {
  synthwave: '🌆',
  anime: '🎌',
  '3d-pixar': '🎬',
  watercolor: '🎨',
  minimalist: '◻️',
  comic: '💥',
  photorealistic: '📷',
  custom: '✨',
}

export function ArtStylePicker({
  value,
  onChange,
  customPrompt,
  onCustomPromptChange,
  className,
}: ArtStylePickerProps) {
  const styles = Object.keys(ART_STYLE_LABELS) as ArtStyle[]

  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-sm font-medium text-gray-300">
        Art Style
      </label>
      <p className="text-xs text-gray-500 mb-3">
        Select the visual style for your carousel images
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {styles.map((style) => (
          <Tooltip key={style}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onChange(style)}
                className={cn(
                  'p-3 text-left border transition-all rounded-lg',
                  value === style
                    ? 'bg-white/10 border-white text-white'
                    : 'bg-black/30 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                )}
              >
                <div className="text-xl mb-1">{STYLE_ICONS[style]}</div>
                <div className="text-xs font-medium truncate">
                  {ART_STYLE_LABELS[style]}
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={8}
              className="bg-black/95 text-gray-200 border border-white/10 max-w-[220px] p-3"
            >
              <p className="font-medium text-white mb-1">
                {STYLE_ICONS[style]} {ART_STYLE_LABELS[style]}
              </p>
              <p className="text-xs text-gray-400">
                {ART_STYLE_DESCRIPTIONS[style]}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Style description */}
      <div className="text-xs text-gray-500 p-2 bg-black/30 border border-gray-700">
        <span className="text-gray-400">{ART_STYLE_LABELS[value]}:</span>{' '}
        {ART_STYLE_DESCRIPTIONS[value]}
      </div>

      {/* Custom style input */}
      {value === 'custom' && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400">
            Describe your custom style
          </label>
          <Textarea
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="e.g., Cyberpunk neon aesthetic with rain-soaked streets and holographic advertisements..."
            className="min-h-[80px] bg-black/50 border-gray-600 text-white text-sm placeholder:text-gray-600"
          />
        </div>
      )}
    </div>
  )
}
