'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, MapPin, Calendar, Shield, ExternalLink, Compass, Camera, ChevronLeft, ChevronRight } from 'lucide-react'
import { PlaceEntry } from '@/types/places'
import { useWikipediaImages } from '@/hooks/useWikipediaImages'
import {
  getCategoryColor,
  getCategoryIcon,
  getCategoryLabel,
  getConfidenceColor,
  getConfidenceLabel,
  getStatusBadgeLabel,
} from '@/lib/categories'

interface PlaceDetailPanelProps {
  place: PlaceEntry
  onClose: () => void
}

export function PlaceDetailPanel({ place, onClose }: PlaceDetailPanelProps) {
  const categoryColor = getCategoryColor(place.categoryPrimary)
  const confidenceColor = getConfidenceColor(place.confidenceLevel)
  const { images, loading: imagesLoading } = useWikipediaImages({
    sourceLinks: place.sourceLinks,
    heroImageUrl: place.heroImageUrl,
    imageUrls: place.imageUrls,
  })
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const activeImage = images[activeImageIndex]

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute top-0 right-0 bottom-0 z-30 w-full max-w-md"
    >
      <div className="h-full glass overflow-y-auto">
        {/* Hero section with Wikipedia image */}
        <div
          className="relative flex items-end p-6 overflow-hidden"
          style={{
            minHeight: activeImage ? '280px' : '180px',
            background: activeImage
              ? undefined
              : `linear-gradient(135deg, ${categoryColor}15 0%, #05060d 100%)`,
          }}
        >
          {/* Background image */}
          {activeImage && (
            <>
              <img
                src={activeImage.thumb}
                alt={place.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05060d] via-[#05060d]/60 to-transparent" />
            </>
          )}

          {/* Image navigation */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 flex items-center gap-1 z-10">
              <button
                onClick={() => setActiveImageIndex((i) => (i - 1 + images.length) % images.length)}
                className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-white/50 px-1">
                {activeImageIndex + 1}/{images.length}
              </span>
              <button
                onClick={() => setActiveImageIndex((i) => (i + 1) % images.length)}
                className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Loading indicator */}
          {imagesLoading && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10">
              <Camera className="w-3 h-3 text-white/30 animate-pulse" />
              <span className="text-[9px] text-white/30">Loading images...</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/60 hover:text-white/90 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative space-y-2 z-10">
            <div
              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-medium"
              style={{
                backgroundColor: `${categoryColor}20`,
                color: categoryColor,
                border: `1px solid ${categoryColor}30`,
              }}
            >
              {getStatusBadgeLabel(place.statusBadge)}
            </div>

            <h2 className="font-display text-2xl font-semibold text-white leading-tight">
              {place.title}
            </h2>

            {place.alternateNames.length > 0 && (
              <p className="text-xs text-white/30 italic">
                Also known as: {place.alternateNames.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Image thumbnails strip */}
        {images.length > 1 && (
          <div className="flex gap-1 px-6 py-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImageIndex(i)}
                className={`w-12 h-9 rounded overflow-hidden border-2 transition-all ${
                  i === activeImageIndex
                    ? 'border-gold-400/60 opacity-100'
                    : 'border-transparent opacity-40 hover:opacity-70'
                }`}
              >
                <img src={img.thumb} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Attribution */}
        {activeImage && (
          <div className="px-6 pb-1">
            <p className="text-[9px] text-white/20 italic">
              Photo: {activeImage.attribution} — Wikimedia Commons
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Meta row */}
          <div className="flex flex-wrap gap-3">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
              style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
            >
              <span>{getCategoryIcon(place.categoryPrimary)}</span>
              {getCategoryLabel(place.categoryPrimary)}
            </div>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
              style={{ backgroundColor: `${confidenceColor}15`, color: confidenceColor }}
            >
              <Shield className="w-3 h-3" />
              {getConfidenceLabel(place.confidenceLevel)}
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-white/5 text-white/50">
              <MapPin className="w-3 h-3" />
              {place.region || place.country}
            </div>

            {place.era.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-white/5 text-white/50">
                <Calendar className="w-3 h-3" />
                {place.era.join(', ')}
              </div>
            )}
          </div>

          <p className="text-sm text-white/70 leading-relaxed">
            {place.shortDescription}
          </p>

          <div className="h-px bg-white/5" />

          <div className="space-y-2">
            <h3 className="text-xs tracking-widest uppercase text-gold-400/50 font-medium">
              The Story
            </h3>
            <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">
              {place.fullStory}
            </p>
          </div>

          {/* Scores */}
          <div className="space-y-2">
            <h3 className="text-xs tracking-widest uppercase text-gold-400/50 font-medium">
              Scores
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <ScoreBar label="Mystery" value={place.mysteryScore} color="#e879f9" />
              <ScoreBar label="Historical" value={place.historicalScore} color="#60a5fa" />
              <ScoreBar label="Tourism" value={place.tourismScore} color="#38bdf8" />
              <ScoreBar label="Architecture" value={place.architectureScore} color="#94a3b8" />
              <ScoreBar label="Local Legend" value={place.localLegendScore} color="#a3e635" />
              <ScoreBar label="Travel" value={place.travelInterestScore} color="#34d399" />
            </div>
          </div>

          {/* Sources */}
          {place.sourceSummary && (
            <div className="space-y-2">
              <h3 className="text-xs tracking-widest uppercase text-gold-400/50 font-medium">
                Sources
              </h3>
              <p className="text-xs text-white/40 leading-relaxed">
                {place.sourceSummary}
              </p>
              {place.sourceLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {place.sourceLinks.map((link, i) => {
                    const label = link.includes('wikipedia.org') ? 'Wikipedia' : 'Source'
                    return (
                      <a
                        key={i}
                        href={decodeURIComponent(link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-gold-400/40 hover:text-gold-400/70 transition-colors underline underline-offset-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {label}
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {place.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs tracking-widest uppercase text-gold-400/50 font-medium">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {place.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-white/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Coordinates */}
          <div className="flex items-center gap-2 text-[10px] text-white/20 pt-2">
            <Compass className="w-3 h-3" />
            {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
            <span className="ml-1">({place.locationPrecision})</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-white/30">{label}</span>
        <span style={{ color }} className="font-medium">{value}</span>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}
