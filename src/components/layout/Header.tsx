'use client'

import { motion } from 'framer-motion'
import { Compass } from 'lucide-react'
export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
      className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-400/80 to-gold-600/80 blur-sm" />
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg">
              <Compass className="w-4 h-4 text-midnight-950" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold tracking-wide text-white/90 leading-none">
              Last Cathar
            </h1>
            <p className="text-[9px] tracking-[0.3em] uppercase text-gold-400/40 mt-0.5">
              World Map of Hidden Stories
            </p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <a
            href="/admin"
            className="text-[11px] tracking-wider uppercase text-white/20 hover:text-white/50 transition-colors"
          >
            Admin
          </a>
        </div>
      </div>
    </motion.header>
  )
}
