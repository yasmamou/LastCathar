/**
 * VideoSidebar — Copie exacte de PlaceDetailPanel pour Remotion
 * Mêmes classes Tailwind, même structure, même ordre.
 * Sans: motion, API calls, PlaceInteractionButtons, ProductCards, useWikipediaImages
 */
import React from 'react'
import '../src/app/globals.css'
import { MapPin, Calendar, Shield, ExternalLink, Compass } from 'lucide-react'
import { PlaceEntry } from '../src/types/places'
import {
  getCategoryColor,
  getCategoryIcon,
  getCategoryLabel,
  getConfidenceColor,
  getConfidenceLabel,
  getStatusBadgeLabel,
} from '../src/lib/categories'
import { getEpicsForPlace } from '../src/data/epics'

interface VideoSidebarProps {
  place: PlaceEntry
  epicTitle: string
  epicIcon: string
  epicColor: string
  epicRole: string
  epicDate: string
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-white/30">{label}</span>
        <span style={{ color }} className="font-medium">{value}</span>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ backgroundColor: color, width: `${value}%` }} />
      </div>
    </div>
  )
}

export const VideoSidebar: React.FC<VideoSidebarProps> = ({ place, epicTitle, epicIcon, epicColor, epicRole, epicDate }) => {
  const categoryColor = getCategoryColor(place.categoryPrimary)
  const placeEpics = getEpicsForPlace(place.slug)
  const confidenceColor = getConfidenceColor(place.confidenceLevel)
  const heroImage = place.heroImageUrl

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#05060d', WebkitOverflowScrolling: 'touch' }}>
      {/* Hero section with image — same as PlaceDetailPanel */}
      <div
        className="relative flex items-end p-6 overflow-hidden"
        style={{
          minHeight: heroImage ? '280px' : '180px',
          background: heroImage
            ? undefined
            : `linear-gradient(135deg, ${categoryColor}15 0%, #05060d 100%)`,
        }}
      >
        {heroImage && (
          <>
            <img
              src={heroImage}
              alt={place.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05060d] via-[#05060d]/60 to-transparent" />
          </>
        )}

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

      {/* Content — same as PlaceDetailPanel */}
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

        {/* Épopées */}
        {placeEpics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {placeEpics.map((epic) => {
              const epicPlace = epic.places.find(p => p.slug === place.slug)
              return (
                <div
                  key={epic.id}
                  className="glass-light rounded-lg px-3 py-2 text-left w-full"
                  style={{ borderLeft: `3px solid ${epic.color}` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{epic.icon}</span>
                    <span className="text-xs font-medium" style={{ color: epic.color }}>
                      {epic.title}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/25">ÉPOPÉE</span>
                  </div>
                  {epicPlace?.role && (
                    <p className="text-[10px] text-white/40 mt-1 ml-6 leading-relaxed">
                      {epicPlace.role}
                      {epicPlace.date && <span className="text-white/20"> · {epicPlace.date}</span>}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

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
  )
}
