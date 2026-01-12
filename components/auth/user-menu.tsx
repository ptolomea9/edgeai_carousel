'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User, ChevronDown } from 'lucide-react'
import { useAuth } from './auth-provider'
import { cn } from '@/lib/utils'

export function UserMenu() {
  const { user, signOut, isLoading } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="h-9 w-24 bg-black/50 rounded-lg animate-pulse border border-white/10" />
    )
  }

  if (!user) return null

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Extract display name from email (part before @)
  const displayName = user.email?.split('@')[0] || 'User'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-black/70 border border-white/20 rounded-lg text-gray-300 hover:bg-[var(--teal-900)]/30 hover:text-[var(--teal-300)] hover:border-[var(--teal-700)] transition-all"
      >
        <div className="size-6 bg-[var(--teal-500)]/20 rounded-full flex items-center justify-center">
          <User className="size-3.5 text-[var(--teal-400)]" />
        </div>
        <span className="text-sm font-medium max-w-[100px] truncate hidden sm:inline">
          {displayName}
        </span>
        <ChevronDown
          className={cn('size-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-black/95 border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden backdrop-blur-sm">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm text-white truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-red-400 transition-colors"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
