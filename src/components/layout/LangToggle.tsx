'use client'

import type { Lang } from '@/lib/lang'

interface Props {
  lang: Lang
  onChange: (l: Lang) => void
  className?: string
}

// Sélecteur de langue compact avec drapeaux — 🇫🇷 FR / 🇬🇧 EN.
// Assez petit pour tenir en haut à droite sur mobile, bien contrasté.
export function LangToggle({ lang, onChange, className = '' }: Props) {
  return (
    <div
      className={`inline-flex items-center rounded-full bg-black/60 border border-white/20 overflow-hidden text-xs font-semibold shadow-lg ${className}`}
    >
      {(['fr', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          aria-pressed={lang === code}
          aria-label={code === 'fr' ? 'Français' : 'English'}
          className={`flex items-center gap-1 px-2.5 py-1.5 transition-colors ${
            lang === code ? 'bg-amber-400 text-midnight-950' : 'text-white/60 hover:text-white'
          }`}
        >
          <span className="text-sm leading-none">{code === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
          <span className="tracking-wide">{code === 'fr' ? 'FR' : 'EN'}</span>
        </button>
      ))}
    </div>
  )
}
