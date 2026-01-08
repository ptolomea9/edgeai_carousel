'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeroImageUploadProps {
  imagePreview: string | null
  onImageSelect: (file: File) => void
  onImageClear: () => void
  className?: string
}

export function HeroImageUpload({
  imagePreview,
  onImageSelect,
  onImageClear,
  className,
}: HeroImageUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        onImageSelect(file)
      }
    },
    [onImageSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-gray-300">
        Character Reference Image
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Upload an image of your character (mascot, person, animal) to maintain consistency across all slides
      </p>

      {imagePreview ? (
        <div className="relative group">
          <div className="relative aspect-square w-full max-w-[200px] overflow-hidden border border-gray-600 bg-black/50">
            <img
              src={imagePreview}
              alt="Hero character preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onImageClear}
                className="bg-black/80 border-white/20 text-white hover:bg-black hover:text-white"
              >
                <X className="size-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed border-gray-600 bg-black/30 p-8 text-center cursor-pointer transition-colors',
            isDragActive && 'border-white bg-white/5',
            'hover:border-gray-500 hover:bg-black/40'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            {isDragActive ? (
              <>
                <Upload className="size-10 text-white animate-bounce" />
                <p className="text-sm text-white">Drop your image here</p>
              </>
            ) : (
              <>
                <ImageIcon className="size-10 text-gray-500" />
                <div className="space-y-1">
                  <p className="text-sm text-gray-300">
                    Drag & drop your character image
                  </p>
                  <p className="text-xs text-gray-500">
                    or click to browse (PNG, JPG up to 10MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
