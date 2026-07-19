'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { User, LogOut, Map, Heart, Star, Loader2, Store, Sparkles } from 'lucide-react'

type InteractionFilter = 'VISITED' | 'WISHLIST' | 'FAVORITE' | null

interface UserMenuProps {
  onOpenAuth: () => void
  onFilterInteractions: (filter: InteractionFilter, slugs: string[]) => void
  activeInteractionFilter: InteractionFilter
}

export function UserMenu({ onOpenAuth, onFilterInteractions, activeInteractionFilter }: UserMenuProps) {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const [interactions, setInteractions] = useState<{ placeSlug: string; type: string }[]>([])
  const [loadingFilter, setLoadingFilter] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Load interactions when menu opens
  useEffect(() => {
    if (!open || status !== 'authenticated') return
    fetch('/api/interactions')
      .then(r => r.json())
      .then(data => setInteractions(data.interactions || []))
      .catch(() => {})
  }, [open, status])

  const handleFilterClick = async (type: InteractionFilter) => {
    if (activeInteractionFilter === type) {
      // Toggle off
      onFilterInteractions(null, [])
      setOpen(false)
      return
    }
    setLoadingFilter(true)
    // If we already have interactions loaded, use them
    const slugs = interactions
      .filter(i => i.type === type)
      .map(i => i.placeSlug)
    onFilterInteractions(type, slugs)
    setLoadingFilter(false)
    setOpen(false)
  }

  const countFor = (type: string) => interactions.filter(i => i.type === type).length

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
    )
  }

  if (!session) {
    return (
      <button
        onClick={onOpenAuth}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-[10px] md:text-[11px] tracking-wider uppercase text-gold-400/60 hover:text-gold-400 hover:border-gold-400/20 transition-all"
      >
        <User className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Connexion</span>
      </button>
    )
  }

  const initials = (session.user.name || session.user.email || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-all hover:scale-105 ${
          activeInteractionFilter
            ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-midnight-950 ring-2 ring-gold-400/40'
            : 'bg-gradient-to-br from-gold-400/80 to-gold-600/80 text-midnight-950'
        }`}
      >
        {initials}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-60 glass rounded-xl overflow-hidden"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-sm font-medium text-white/80 truncate">
                {session.user.name}
              </p>
              <p className="text-[10px] text-white/30 truncate">
                {session.user.email}
              </p>
              <span className="inline-block mt-1 text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-gold-400/10 text-gold-400/60">
                {session.user.role === 'SELLER' ? 'Marchand' : session.user.role === 'ADMIN' ? 'Admin' : 'Explorateur'}
              </span>
            </div>

            {/* Menu items with counts */}
            <div className="py-1">
              {loadingFilter ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-white/30" />
                </div>
              ) : (
                <>
                  <MenuButton
                    icon={<Map className="w-3.5 h-3.5" />}
                    label="Mes lieux visités"
                    count={countFor('VISITED')}
                    isActive={activeInteractionFilter === 'VISITED'}
                    activeColor="text-emerald-400"
                    onClick={() => handleFilterClick('VISITED')}
                  />
                  <MenuButton
                    icon={<Star className="w-3.5 h-3.5" />}
                    label="Ma wishlist"
                    count={countFor('WISHLIST')}
                    isActive={activeInteractionFilter === 'WISHLIST'}
                    activeColor="text-blue-400"
                    onClick={() => handleFilterClick('WISHLIST')}
                  />
                  <MenuButton
                    icon={<Heart className="w-3.5 h-3.5" />}
                    label="Mes favoris"
                    count={countFor('FAVORITE')}
                    isActive={activeInteractionFilter === 'FAVORITE'}
                    activeColor="text-pink-400"
                    onClick={() => handleFilterClick('FAVORITE')}
                  />
                </>
              )}
            </div>

            {/* Merchant space + partner CTA */}
            <div className="border-t border-white/5 py-1">
              <a
                href="/compte"
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                Espace marchand
              </a>
              {session.user.role !== 'SELLER' && (
                <a
                  href="/pricing"
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gold-400/60 hover:text-gold-400 hover:bg-white/5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Devenir partenaire
                </a>
              )}
            </div>

            <div className="border-t border-white/5 py-1">
              <button
                onClick={() => { setOpen(false); signOut() }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400/60 hover:text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Se déconnecter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuButton({ icon, label, count, isActive, activeColor, onClick }: {
  icon: React.ReactNode
  label: string
  count: number
  isActive: boolean
  activeColor: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors ${
        isActive
          ? `${activeColor} bg-white/5`
          : 'text-white/50 hover:text-white/80 hover:bg-white/5'
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className={`ml-auto text-[10px] font-medium ${
        isActive ? activeColor : 'text-white/20'
      }`}>
        {count}
      </span>
    </button>
  )
}
