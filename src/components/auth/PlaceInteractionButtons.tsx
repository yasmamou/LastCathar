'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, MapPin, Heart, Loader2 } from 'lucide-react'

interface PlaceInteractionButtonsProps {
  placeSlug: string
  onOpenAuth: () => void
}

type InteractionType = 'VISITED' | 'WISHLIST' | 'FAVORITE'

export function PlaceInteractionButtons({ placeSlug, onOpenAuth }: PlaceInteractionButtonsProps) {
  const { data: session, status } = useSession()
  const [active, setActive] = useState<Set<InteractionType>>(new Set())
  const [loading, setLoading] = useState<InteractionType | null>(null)
  const [justToggled, setJustToggled] = useState<InteractionType | null>(null)

  // Fetch current interactions for this place
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/interactions')
      .then(r => r.json())
      .then(data => {
        if (data.interactions) {
          const set = new Set<InteractionType>()
          for (const i of data.interactions) {
            if (i.placeSlug === placeSlug) set.add(i.type as InteractionType)
          }
          setActive(set)
        }
      })
      .catch(() => {})
  }, [status, placeSlug])

  const toggle = useCallback(async (type: InteractionType) => {
    if (status !== 'authenticated' || !session) {
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
      if (!res.ok) {
        console.error('Interaction error:', res.status, await res.text())
        return
      }
      const data = await res.json()
      setActive(prev => {
        const next = new Set(prev)
        if (data.action === 'added') next.add(type)
        else next.delete(type)
        return next
      })
      // Flash animation
      setJustToggled(type)
      setTimeout(() => setJustToggled(null), 600)
    } catch (err) {
      console.error('Interaction fetch error:', err)
    } finally {
      setLoading(null)
    }
  }, [status, session, placeSlug, onOpenAuth])

  const buttons: { type: InteractionType; icon: typeof Check; label: string; activeColor: string; activeBg: string }[] = [
    { type: 'VISITED', icon: Check, label: 'Visité', activeColor: 'text-emerald-400', activeBg: 'border-emerald-400/40 bg-emerald-400/15' },
    { type: 'WISHLIST', icon: MapPin, label: 'À visiter', activeColor: 'text-blue-400', activeBg: 'border-blue-400/40 bg-blue-400/15' },
    { type: 'FAVORITE', icon: Heart, label: 'Favori', activeColor: 'text-pink-400', activeBg: 'border-pink-400/40 bg-pink-400/15' },
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {buttons.map(({ type, icon: Icon, label, activeColor, activeBg }) => {
        const isActive = active.has(type)
        const isLoading = loading === type
        const wasJustToggled = justToggled === type
        return (
          <motion.button
            key={type}
            onClick={() => toggle(type)}
            disabled={isLoading}
            whileTap={{ scale: 0.95 }}
            animate={wasJustToggled ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium tracking-wide border transition-all duration-200 ${
              isActive
                ? `${activeColor} ${activeBg}`
                : 'text-white/40 border-white/10 hover:text-white/60 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Icon className={`w-3.5 h-3.5 ${isActive && type === 'FAVORITE' ? 'fill-current' : ''}`} />
            )}
            {label}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="w-1.5 h-1.5 rounded-full bg-current"
                />
              )}
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}
