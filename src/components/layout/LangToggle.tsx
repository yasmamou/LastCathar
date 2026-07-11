'use client'

import type { Lang } from '@/lib/lang'

interface Props {
  lang: Lang
  onChange: (l: Lang) => void
  className?: string
}

// Petit sélecteur FR / EN réutilisable (même style que les lecteurs audio).
export function LangToggle({ lang, onChange, className = '' }: Props) {
  return (
    <div
      className={`inline-flex items-center rounded-full bg-black/40 border border-white/10 overflow-hidden text-[10px] font-semibold ${className}`}
    >
      {(['fr', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          aria-pressed={lang === code}
          className={`px-2.5 py-1 uppercase tracking-wider transition-colors ${
            lang === code ? 'bg-gold-400 text-midnight-950' : 'text-white/50 hover:text-white/90'
          }`}
        >
          {code === 'fr' ? 'FR' : 'EN'}
        </button>
      ))}
    </div>
  )
}
