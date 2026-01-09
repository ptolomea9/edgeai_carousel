'use client'

import { useState, useCallback } from 'react'
import { Wand2, Loader2, ArrowRight, AlertCircle, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeroImageEditorProps {
  imagePreview: string
  originalImage: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onApplyEdit: (editedBase64: string) => void
}

const QUICK_ACTIONS = [
  { label: 'Remove BG', prompt: 'Remove the background completely and make it transparent or solid white' },
  { label: 'Enhance', prompt: 'Enhance the image quality, lighting, colors and sharpness while keeping the subject identical' },
  { label: 'Studio Light', prompt: 'Add professional studio lighting with soft shadows to make the subject look polished' },
  { label: 'Headshot', prompt: 'Transform this into a professional headshot style photo with clean background' },
]

export function HeroImageEditor({
  imagePreview,
  originalImage,
  isOpen,
  onOpenChange,
  onApplyEdit,
}: HeroImageEditorProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = useCallback(async (editPrompt: string) => {
    if (!editPrompt.trim() || isGenerating) return

    setIsGenerating(true)
    setError(null)
    setEditedImage(null)

    try {
      // Convert base64 data URL to blob for FormData
      const response = await fetch(imagePreview)
      const blob = await response.blob()
      const file = new File([blob], 'hero-image.jpg', { type: blob.type || 'image/jpeg' })

      const formData = new FormData()
      formData.append('mode', 'image-editing')
      formData.append('prompt', editPrompt)
      formData.append('image1', file)
      formData.append('aspectRatio', 'square')

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || errorData.details || 'Failed to generate image')
      }

      const data = await res.json()

      if (data.url) {
        setEditedImage(data.url)
      } else {
        throw new Error('No image returned from API')
      }
    } catch (err) {
      console.error('Image editing error:', err)
      setError(err instanceof Error ? err.message : 'Failed to edit image. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [imagePreview, isGenerating])

  const handleQuickAction = (actionPrompt: string) => {
    setPrompt(actionPrompt)
    handleGenerate(actionPrompt)
  }

  const handleApply = () => {
    if (editedImage) {
      onApplyEdit(editedImage)
      handleReset()
    }
  }

  const handleReset = () => {
    setPrompt('')
    setEditedImage(null)
    setError(null)
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      handleReset()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Wand2 className="size-5" />
            Edit Hero Image with AI
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Use natural language to modify your hero image before carousel generation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Preview Section */}
          <div className="flex items-center gap-4 justify-center">
            {/* Original Image */}
            <div className="flex-1 max-w-[240px]">
              <p className="text-xs text-gray-500 mb-2 text-center">Original</p>
              <div className="aspect-square bg-black/50 border border-gray-700 overflow-hidden">
                <img
                  src={originalImage || imagePreview}
                  alt="Original hero image"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight className="size-6 text-gray-500 flex-shrink-0" />

            {/* Edited/Preview Image */}
            <div className="flex-1 max-w-[240px]">
              <p className="text-xs text-gray-500 mb-2 text-center">
                {isGenerating ? 'Generating...' : editedImage ? 'Edited' : 'Preview'}
              </p>
              <div className="aspect-square bg-black/50 border border-gray-700 overflow-hidden flex items-center justify-center">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Loader2 className="size-8 animate-spin" />
                    <p className="text-xs">Processing...</p>
                  </div>
                ) : editedImage ? (
                  <img
                    src={editedImage}
                    alt="Edited hero image"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-500 text-sm text-center p-4">
                    Enter a prompt or click a quick action to see the result
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700 text-red-300 text-sm">
              <AlertCircle className="size-4 flex-shrink-0" />
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto text-red-300 hover:text-red-200 hover:bg-red-900/50"
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isGenerating}
                  className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500">Custom Edit Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how you want to edit the image... e.g., 'Remove the background and add a soft blue gradient'"
              className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:border-gray-500"
              disabled={isGenerating}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={() => handleClose(false)}
              disabled={isGenerating}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              {editedImage && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isGenerating}
                  className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <RotateCcw className="size-4 mr-1" />
                  Try Another
                </Button>
              )}

              {editedImage ? (
                <Button
                  onClick={handleApply}
                  disabled={isGenerating}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  Use This Edit
                </Button>
              ) : (
                <Button
                  onClick={() => handleGenerate(prompt)}
                  disabled={!prompt.trim() || isGenerating}
                  className="bg-white text-black hover:bg-gray-200 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-4 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-4 mr-1" />
                      Generate Edit
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
