'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteConfirmationProps {
  count: number
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmation({
  count,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationProps) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="size-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold">
            Delete {count === 1 ? 'Carousel' : `${count} Carousels`}?
          </h3>
        </div>

        <div className="text-sm text-gray-400 space-y-2">
          <p>This will permanently delete:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{count} carousel{count !== 1 ? 's' : ''}</li>
            <li>All associated slide images</li>
            <li>Any generated videos</li>
          </ul>
          <p className="text-red-400 font-medium mt-3">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onCancel}
            disabled={isDeleting}
            variant="outline"
            className="flex-1 bg-black/50 border-white/20 text-gray-300 hover:bg-black/70 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 text-white hover:bg-red-700 rounded-lg"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
