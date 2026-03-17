'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Scroll } from 'lucide-react'
import { Epic } from '@/data/epics'
import { PlaceEntry } from '@/types/places'
import { getCategoryColor, getCategoryIcon } from '@/lib/categories'

interface EpicDetailPanelProps {
  epic: Epic
  allPlaces: PlaceEntry[]
  onClose: () => void
  onPlaceSelect: (place: PlaceEntry) => void
}

export function EpicDetailPanel({ epic, allPlaces, onClose, onPlaceSelect }: EpicDetailPanelProps) {
  // Match epic places to actual place data
  const epicPlaces = epic.places
    .map(ep => {
      const place = allPlaces.find(p => p.slug === ep.slug)
      return place ? { ...ep, place } : null
    })
    .filter((ep): ep is { slug: string; role: string; order: number; date?: string; place: PlaceEntry } => ep !== null)

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute inset-0 md:left-auto md:w-full md:max-w-md z-40"
    >
      <div className="h-full glass overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 sticky top-0 z-10 glass safe-top">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white/60 active:text-white/90 py-2 pr-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Globe</span>
          </button>
          <div className="flex items-center gap-1.5">
            <Scroll className="w-3.5 h-3.5" style={{ color: epic.color }} />
            <span className="text-[10px] tracking-wider uppercase" style={{ color: epic.color }}>Épopée</span>
          </div>
        </div>

        {/* Hero section */}
        <div
          className="px-6 py-8"
          style={{
            background: `linear-gradient(135deg, ${epic.color}15 0%, #05060d 100%)`,
          }}
        >
          <div className="text-4xl mb-4">{epic.icon}</div>
          <h2
            className="font-display text-2xl font-semibold leading-tight mb-2"
            style={{ color: epic.color }}
          >
            {epic.title}
          </h2>
          <p className="text-sm text-white/50 italic">{epic.subtitle}</p>
        </div>

        {/* Description */}
        <div className="px-6 py-5">
          <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">
            {epic.description}
          </p>
        </div>

        <div className="h-px bg-white/5 mx-6" />

        {/* Places list — chronological */}
        <div className="px-6 py-5">
          <h3 className="text-xs tracking-widest uppercase font-medium mb-4" style={{ color: `${epic.color}80` }}>
            {epicPlaces.length} lieux · Parcours chronologique
          </h3>

          <div className="space-y-0">
            {epicPlaces.map((ep, i) => {
              const catColor = getCategoryColor(ep.place.categoryPrimary)
              const isLast = i === epicPlaces.length - 1

              return (
                <div key={ep.slug} className="relative">
                  {/* Vertical line connecting places */}
                  {!isLast && (
                    <div
                      className="absolute left-[11px] top-[28px] bottom-0 w-[2px]"
                      style={{ backgroundColor: `${epic.color}20` }}
                    />
                  )}

                  <button
                    onClick={() => onPlaceSelect(ep.place)}
                    className="w-full text-left pl-0 pr-2 py-3 flex items-start gap-3 hover:bg-white/5 active:bg-white/10 rounded-lg transition-colors relative z-10"
                  >
                    {/* Dot */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: `${epic.color}20`,
                        color: epic.color,
                        border: `2px solid ${epic.color}40`,
                      }}
                    >
                      {ep.order}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: catColor }}>
                          {getCategoryIcon(ep.place.categoryPrimary)}
                        </span>
                        <span className="text-sm font-medium text-white/85 truncate">
                          {ep.place.title}
                        </span>
                      </div>

                      <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
                        {ep.role}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        {ep.date && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/25">
                            {ep.date}
                          </span>
                        )}
                        <span className="text-[9px] text-white/15 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {ep.place.region || ep.place.country}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tags */}
        <div className="px-6 py-4 border-t border-white/5">
          <div className="flex flex-wrap gap-1.5">
            {epic.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-white/25">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
