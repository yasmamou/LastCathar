'use client'

import { useCallback, useEffect, useState } from 'react'

// Langue d'interface partagée (FR/EN), mémorisée pour l'utilisateur et
// synchronisée entre tous les composants (accueil, guides audio, parcours).
export type Lang = 'fr' | 'en'

const KEY = 'lastcathar:lang'
const LEGACY_KEY = 'audioguide:lang' // ancienne clé des guides audio
const EVENT = 'lastcathar:langchange'

export function readLang(): Lang {
  if (typeof window === 'undefined') return 'fr'
  const v = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY)
  return v === 'en' ? 'en' : 'fr'
}

export function writeLang(lang: Lang) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, lang)
  localStorage.setItem(LEGACY_KEY, lang) // garde l'ancienne clé synchronisée
  window.dispatchEvent(new CustomEvent(EVENT, { detail: lang }))
}

/**
 * Choix de langue partagé. Renvoie [lang, setLang].
 * L'état initial est 'fr' côté serveur puis synchronisé au montage (évite tout
 * décalage d'hydratation), et se met à jour quand un autre composant change la
 * langue.
 */
export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>('fr')

  useEffect(() => {
    setLangState(readLang())
    const sync = () => setLangState(readLang())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const setLang = useCallback((l: Lang) => {
    writeLang(l)
    setLangState(l)
  }, [])

  return [lang, setLang]
}
