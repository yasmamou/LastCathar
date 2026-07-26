'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

// Paywall audio : les FREE_AUDIO_GUIDES premiers guides sont gratuits, ensuite
// (dès la 3ᵉ lecture) l'accès payant à l'audiobook est requis.
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
  // Le statut de session change quand l'utilisateur crée son compte / se
  // connecte : on doit alors re-vérifier l'accès (sinon le paywall reste bloqué
  // sur « créer un compte » après l'inscription).
  const { status } = useSession()
  const [access, setAccess] = useState<AccessState>({
    loaded: false,
    authenticated: false,
    hasAccess: false,
    configured: false,
  })

  const refreshAccess = useCallback(() => {
    return fetch('/api/audio/access')
      .then((r) => r.json())
      .then((d) => {
        setAccess({ loaded: true, authenticated: !!d.authenticated, hasAccess: !!d.hasAccess, configured: !!d.configured })
        return !!d.hasAccess
      })
      .catch(() => { setAccess((a) => ({ ...a, loaded: true })); return false })
  }, [])

  // Re-fetch au montage ET à chaque changement de session (connexion/inscription).
  useEffect(() => { refreshAccess() }, [status, refreshAccess])

  // Nombre d'écoutes offertes : +1 pour les comptes créés (récompense
  // d'inscription). Anonyme = FREE_AUDIO_GUIDES ; connecté = FREE_AUDIO_GUIDES + 1.
  const freeLimit = access.authenticated ? FREE_AUDIO_GUIDES + 1 : FREE_AUDIO_GUIDES

  // Peut-on jouer cet audio ? On ne bloque JAMAIS tant que le pass n'est pas
  // configuré (Stripe absent) ou tant que l'état n'est pas chargé.
  const canPlay = useCallback(
    (key: string): boolean => {
      if (!access.loaded || !access.configured || access.hasAccess) return true
      const plays = readPlays()
      if (plays.includes(key)) return true
      return plays.length < freeLimit
    },
    [access, freeLimit],
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

  return { access, canPlay, registerPlay, startAudioCheckout, refreshAccess, freeLimit }
}
