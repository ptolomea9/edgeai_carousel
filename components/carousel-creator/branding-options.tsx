'use client'

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface BrandingOptionsProps {
  brandingText: string
  onBrandingTextChange: (text: string) => void
  brandingPosition: 'top' | 'bottom' | 'watermark'
  onBrandingPositionChange: (position: 'top' | 'bottom' | 'watermark') => void
  includeBranding: boolean
  onIncludeBrandingChange: (include: boolean) => void
  className?: string
}

export function BrandingOptions({
  brandingText,
  onBrandingTextChange,
  brandingPosition,
  onBrandingPositionChange,
  includeBranding,
  onIncludeBrandingChange,
  className,
}: BrandingOptionsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-300">
            Branding
          </label>
          <p className="text-xs text-gray-500">
            Add your website or brand name to all slides
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={includeBranding}
            onCheckedChange={onIncludeBrandingChange}
          />
          <Label className="text-xs text-gray-400">
            {includeBranding ? 'On' : 'Off'}
          </Label>
        </div>
      </div>

      {includeBranding && (
        <div className="space-y-3 p-3 bg-black/30 border border-gray-700">
          <div className="space-y-2">
            <Label className="text-xs text-gray-400">Brand Text</Label>
            <Input
              value={brandingText}
              onChange={(e) => onBrandingTextChange(e.target.value)}
              placeholder="RealTPO.com"
              className="bg-black/50 border-gray-600 text-white text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-400">Position</Label>
            <Select
              value={brandingPosition}
              onValueChange={(value) =>
                onBrandingPositionChange(value as 'top' | 'bottom' | 'watermark')
              }
            >
              <SelectTrigger className="bg-black/50 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-600">
                <SelectItem value="top">Top Banner</SelectItem>
                <SelectItem value="bottom">Bottom Banner</SelectItem>
                <SelectItem value="watermark">Corner Watermark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
