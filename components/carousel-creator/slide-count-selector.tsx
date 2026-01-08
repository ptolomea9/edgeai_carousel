'use client'

import { cn } from '@/lib/utils'

interface SlideCountSelectorProps {
  value: number
  onChange: (count: number) => void
  className?: string
}

const SLIDE_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10]

export function SlideCountSelector({
  value,
  onChange,
  className,
}: SlideCountSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-gray-300">
        Number of Slides
      </label>
      <p className="text-xs text-gray-500 mb-3">
        Choose how many slides for your carousel (Instagram allows up to 10)
      </p>

      <div className="flex flex-wrap gap-2">
        {SLIDE_OPTIONS.map((count) => (
          <button
            key={count}
            onClick={() => onChange(count)}
            className={cn(
              'w-10 h-10 flex items-center justify-center text-sm font-medium transition-all border',
              value === count
                ? 'bg-white text-black border-white'
                : 'bg-black/50 text-gray-300 border-gray-600 hover:border-gray-500 hover:text-white'
            )}
          >
            {count}
          </button>
        ))}
      </div>
    </div>
  )
}
