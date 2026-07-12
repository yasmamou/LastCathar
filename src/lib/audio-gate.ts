'use client'

import { useCallback, useEffect, useState } from 'react'

// Paywall audio : les FREE_AUDIO_GUIDES premiers guides sont gratuits, ensuite
// le Pass Audioguides (5 €, paiement unique) est requis.
export const FREE_AUDIO_GUIDES = 2

const LS_PLAYS = 'audio:plays'

interface AccessState {
  loaded: boolean
  authenticated: boolean
  hasAccess: boolean
  configured: boolean
}

function readPlays(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const v = JSON.parse(localStorage.getItem(LS_PLAYS) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export function useAudioGate() {
  const [access, setAccess] = useState<AccessState>({
    loaded: false,
    authenticated: false,
    hasAccess: false,
    configured: false,
  })

  useEffect(() => {
    let cancelled = false
    fetch('/api/audio/access')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAccess({ loaded: true, authenticated: !!d.authenticated, hasAccess: !!d.hasAccess, configured: !!d.configured })
      })
      .catch(() => { if (!cancelled) setAccess((a) => ({ ...a, loaded: true })) })
    return () => { cancelled = true }
  }, [])

  // Peut-on jouer cet audio ? On ne bloque JAMAIS tant que le pass n'est pas
  // configuré (Stripe absent) ou tant que l'état n'est pas chargé.
  const canPlay = useCallback(
    (key: string): boolean => {
      if (!access.loaded || !access.configured || access.hasAccess) return true
      const plays = readPlays()
      if (plays.includes(key)) return true
      return plays.length < FREE_AUDIO_GUIDES
    },
    [access],
  )

  // Enregistre un audio écouté (dédupliqué).
  const registerPlay = useCallback((key: string) => {
    const plays = readPlays()
    if (!plays.includes(key)) {
      plays.push(key)
      localStorage.setItem(LS_PLAYS, JSON.stringify(plays))
    }
  }, [])

  // Lance le paiement du Pass Audioguides (5 €). Nécessite d'être connecté.
  const startAudioCheckout = useCallback(async (): Promise<{ ok: boolean; needAuth?: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: 'audio' }),
      })
      if (res.status === 401) return { ok: false, needAuth: true }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return { ok: true }
      }
      return { ok: false, error: data.error || 'Erreur' }
    } catch {
      return { ok: false, error: 'Erreur réseau' }
    }
  }, [])

  return { access, canPlay, registerPlay, startAudioCheckout, freeLimit: FREE_AUDIO_GUIDES }
}
