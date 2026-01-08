'use client'

import { cn } from '@/lib/utils'
import { Image, Video, Layers } from 'lucide-react'
import type { OutputType } from './types'

interface OutputOptionsProps {
  value: OutputType
  onChange: (type: OutputType) => void
  className?: string
}

const OUTPUT_OPTIONS: {
  value: OutputType
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    value: 'static',
    label: 'Static Images',
    description: 'PNG images for carousel posts',
    icon: <Image className="size-5" />,
  },
  {
    value: 'video',
    label: 'Animated Video',
    description: 'MP4 video with music',
    icon: <Video className="size-5" />,
  },
  {
    value: 'both',
    label: 'Both',
    description: 'Images + video output',
    icon: <Layers className="size-5" />,
  },
]

export function OutputOptions({
  value,
  onChange,
  className,
}: OutputOptionsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <label className="text-sm font-medium text-gray-300">
          Output Format
        </label>
        <p className="text-xs text-gray-500">
          Choose how you want your carousel delivered
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {OUTPUT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'p-3 text-center border transition-all',
              value === option.value
                ? 'bg-white/10 border-white text-white'
                : 'bg-black/30 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
            )}
          >
            <div className="flex justify-center mb-2">{option.icon}</div>
            <div className="text-xs font-medium">{option.label}</div>
            <div className="text-[10px] text-gray-500 mt-1">
              {option.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
