'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

export type Platform = 'android' | 'ios' | 'desktop' | 'unsupported'

interface PwaContextValue {
  platform: Platform
  isStandalone: boolean
  canInstallNative: boolean
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
  showManualInstructions: boolean
  openManualInstructions: () => void
  closeManualInstructions: () => void
}

const PwaContext = createContext<PwaContextValue | null>(null)

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unsupported'
  const ua = window.navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const anyNav = window.navigator as unknown as { standalone?: boolean }
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    anyNav.standalone === true
  )
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [platform, setPlatform] = useState<Platform>('unsupported')
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showManualInstructions, setShowManualInstructions] = useState(false)

  // SW registration + platform detection
  useEffect(() => {
    setPlatform(detectPlatform())
    setIsStandalone(detectStandalone())

    if ('serviceWorker' in navigator) {
      const register = () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('[pwa] SW registration failed', err)
        })
      }
      if (document.readyState === 'complete') register()
      else window.addEventListener('load', register, { once: true })
    }
  }, [])

  // Capture beforeinstallprompt (Android/Chrome/Edge)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    const installed = () => {
      setDeferredPrompt(null)
      setIsStandalone(true)
    }
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable' as const
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return choice.outcome
  }, [deferredPrompt])

  const value: PwaContextValue = {
    platform,
    isStandalone,
    canInstallNative: !!deferredPrompt,
    promptInstall,
    showManualInstructions,
    openManualInstructions: () => setShowManualInstructions(true),
    closeManualInstructions: () => setShowManualInstructions(false),
  }

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>
}

export function usePwa() {
  const ctx = useContext(PwaContext)
  if (!ctx) throw new Error('usePwa must be used within PwaProvider')
  return ctx
}
