'use client'

import { useState, memo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Dithering } from '@paper-design/shaders-react'
import { Loader2, Mail, Lock, Sparkles } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { signInWithPassword, signUp, signInWithMagicLink } from './actions'

const MemoizedDithering = memo(Dithering)

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(searchParams.get('error'))
  const [success, setSuccess] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'password' | 'magic'>('password')

  const handleSubmit = async (
    formData: FormData,
    action: 'login' | 'signup' | 'magic'
  ) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      let result
      if (action === 'magic') {
        result = await signInWithMagicLink(formData)
      } else if (action === 'signup') {
        result = await signUp(formData)
      } else {
        result = await signInWithPassword(formData)
      }

      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(result.success)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative flex items-center justify-center">
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

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 bg-black/70 border border-white/10 rounded-xl backdrop-blur-sm noise-overlay animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold tracking-tight text-glow-teal">
            EdgeAI Carousel
          </h1>
          <p className="text-gray-400 mt-2">
            Sign in to create amazing carousels
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/50 border border-[var(--teal-900)]/30 rounded-lg p-1 mb-6">
            <TabsTrigger
              value="login"
              className="rounded-md font-medium data-[state=active]:bg-[var(--teal-500)] data-[state=active]:text-black"
            >
              Log In
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="rounded-md font-medium data-[state=active]:bg-[var(--teal-500)] data-[state=active]:text-black"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-[var(--teal-500)]/10 border border-[var(--teal-500)]/30 rounded-lg text-[var(--teal-300)] text-sm">
              {success}
            </div>
          )}

          <TabsContent value="login">
            <form
              action={(fd) =>
                handleSubmit(fd, authMode === 'magic' ? 'magic' : 'login')
              }
            >
              {/* Auth method toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setAuthMode('password')}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                    authMode === 'password'
                      ? 'bg-[var(--teal-900)]/30 text-[var(--teal-300)] border border-[var(--teal-700)]'
                      : 'bg-black/50 text-gray-400 border border-white/10 hover:border-white/20'
                  )}
                >
                  <Lock className="size-4 inline mr-2" />
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('magic')}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                    authMode === 'magic'
                      ? 'bg-[var(--teal-900)]/30 text-[var(--teal-300)] border border-[var(--teal-700)]'
                      : 'bg-black/50 text-gray-400 border border-white/10 hover:border-white/20'
                  )}
                >
                  <Sparkles className="size-4 inline mr-2" />
                  Magic Link
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--teal-500)] transition-colors"
                    />
                  </div>
                </div>

                {authMode === 'password' && (
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        minLength={6}
                        className="w-full pl-10 pr-3 py-2.5 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--teal-500)] transition-colors"
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-[var(--teal-500)] to-[var(--teal-600)] text-black font-bold rounded-lg hover:from-[var(--teal-400)] hover:to-[var(--teal-500)] glow-teal transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : authMode === 'magic' ? (
                    'Send Magic Link'
                  ) : (
                    'Log In'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form action={(fd) => handleSubmit(fd, 'signup')}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--teal-500)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                    <input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      minLength={6}
                      className="w-full pl-10 pr-3 py-2.5 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--teal-500)] transition-colors"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 6 characters
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-[var(--teal-500)] to-[var(--teal-600)] text-black font-bold rounded-lg hover:from-[var(--teal-400)] hover:to-[var(--teal-500)] glow-teal transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
