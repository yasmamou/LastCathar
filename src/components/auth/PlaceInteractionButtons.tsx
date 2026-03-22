'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Check, MapPin, Heart } from 'lucide-react'

interface PlaceInteractionButtonsProps {
  placeSlug: string
  onOpenAuth: () => void
}

type InteractionType = 'VISITED' | 'WISHLIST' | 'FAVORITE'

export function PlaceInteractionButtons({ placeSlug, onOpenAuth }: PlaceInteractionButtonsProps) {
  const { data: session } = useSession()
  const [active, setActive] = useState<Set<InteractionType>>(new Set())
  const [loading, setLoading] = useState<InteractionType | null>(null)

  // Fetch current interactions for this place
  useEffect(() => {
    if (!session) return
    fetch('/api/interactions')
      .then(r => r.json())
      .then(data => {
        const set = new Set<InteractionType>()
        for (const i of data.interactions) {
          if (i.placeSlug === placeSlug) set.add(i.type as InteractionType)
        }
        setActive(set)
      })
      .catch(() => {})
  }, [session, placeSlug])

  const toggle = useCallback(async (type: InteractionType) => {
    if (!session) {
      onOpenAuth()
      return
    }
    setLoading(type)
    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeSlug, type }),
      })
      const data = await res.json()
      setActive(prev => {
        const next = new Set(prev)
        if (data.action === 'added') next.add(type)
        else next.delete(type)
        return next
      })
    } catch {} finally {
      setLoading(null)
    }
  }, [session, placeSlug, onOpenAuth])

  const buttons: { type: InteractionType; icon: typeof Check; label: string; activeColor: string }[] = [
    { type: 'VISITED', icon: Check, label: 'Visité', activeColor: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' },
    { type: 'WISHLIST', icon: MapPin, label: 'À visiter', activeColor: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
    { type: 'FAVORITE', icon: Heart, label: 'Favori', activeColor: 'text-pink-400 border-pink-400/30 bg-pink-400/10' },
  ]

  return (
    <div className="flex gap-2">
      {buttons.map(({ type, icon: Icon, label, activeColor }) => {
        const isActive = active.has(type)
        const isLoading = loading === type
        return (
          <button
            key={type}
            onClick={() => toggle(type)}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] tracking-wide border transition-all ${
              isActive
                ? activeColor
                : 'text-white/30 border-white/10 hover:text-white/50 hover:border-white/20'
            } ${isLoading ? 'opacity-50' : ''}`}
          >
            <Icon className={`w-3 h-3 ${isActive && type === 'FAVORITE' ? 'fill-current' : ''}`} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
