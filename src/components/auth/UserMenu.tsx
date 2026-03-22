'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { User, LogOut, Map, Heart, Star } from 'lucide-react'

interface UserMenuProps {
  onOpenAuth: () => void
}

export function UserMenu({ onOpenAuth }: UserMenuProps) {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
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
        className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-gold-400/80 to-gold-600/80 flex items-center justify-center text-midnight-950 font-semibold text-xs transition-transform hover:scale-105"
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
            className="absolute right-0 top-full mt-2 w-56 glass rounded-xl overflow-hidden"
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
                Explorateur
              </span>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <MenuButton icon={<Map className="w-3.5 h-3.5" />} label="Mes lieux visités" badge="VISITED" />
              <MenuButton icon={<Star className="w-3.5 h-3.5" />} label="Ma wishlist" badge="WISHLIST" />
              <MenuButton icon={<Heart className="w-3.5 h-3.5" />} label="Mes favoris" badge="FAVORITE" />
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

function MenuButton({ icon, label, badge }: { icon: React.ReactNode; label: string; badge: string }) {
  return (
    <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors">
      {icon}
      <span>{label}</span>
      <span className="ml-auto text-[8px] tracking-wider text-white/15">{badge}</span>
    </button>
  )
}
