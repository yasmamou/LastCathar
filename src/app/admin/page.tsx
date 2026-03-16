'use client'

import { useState } from 'react'
import { allPlaces } from '@/data/all-places'
import { PlaceEntry, ModerationState } from '@/types/places'
import { getCategoryLabel, getCategoryColor, getConfidenceLabel, getConfidenceColor } from '@/lib/categories'

export default function AdminPage() {
  const [places] = useState<PlaceEntry[]>(allPlaces)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterState, setFilterState] = useState<ModerationState | 'all'>('all')

  const filtered = filterState === 'all'
    ? places
    : places.filter((p) => p.moderationState === filterState)

  const selected = places.find((p) => p.id === selectedId)

  return (
    <div className="min-h-screen bg-midnight-950 text-white/80">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gold-400/60 hover:text-gold-400 transition-colors text-sm">
              &larr; Globe
            </a>
            <h1 className="font-display text-xl font-semibold text-white/90">
              Admin &mdash; Place Entries
            </h1>
          </div>
          <div className="text-xs text-white/30">{filtered.length} entries</div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* List panel */}
        <div className="w-1/2 border-r border-white/5 overflow-y-auto">
          {/* Filters */}
          <div className="flex gap-2 px-4 py-3 border-b border-white/5">
            {(['all', 'draft', 'review', 'approved', 'rejected'] as const).map((state) => (
              <button
                key={state}
                onClick={() => setFilterState(state)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  filterState === state
                    ? 'bg-gold-400/20 text-gold-400'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                {state}
              </button>
            ))}
          </div>

          {/* Entries list */}
          <div className="divide-y divide-white/5">
            {filtered.map((place) => (
              <button
                key={place.id}
                onClick={() => setSelectedId(place.id)}
                className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${
                  selectedId === place.id ? 'bg-white/5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{place.title}</p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {getCategoryLabel(place.categoryPrimary)} &middot; {place.region || place.country}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getCategoryColor(place.categoryPrimary) }}
                    />
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ color: getConfidenceColor(place.confidenceLevel) }}
                    >
                      {getConfidenceLabel(place.confidenceLevel)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="w-1/2 overflow-y-auto p-6">
          {selected ? (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold text-white/90">
                {selected.title}
              </h2>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="Slug" value={selected.slug} />
                <Field label="Category" value={getCategoryLabel(selected.categoryPrimary)} />
                <Field label="Confidence" value={getConfidenceLabel(selected.confidenceLevel)} />
                <Field label="Status Badge" value={selected.statusBadge} />
                <Field label="Moderation" value={selected.moderationState} />
                <Field label="Location Precision" value={selected.locationPrecision} />
                <Field label="Coordinates" value={`${selected.latitude}, ${selected.longitude}`} />
                <Field label="Region" value={selected.region || '-'} />
                <Field label="Country" value={selected.country} />
                <Field label="Featured" value={selected.isFeatured ? 'Yes' : 'No'} />
                <Field label="Verified" value={selected.isVerified ? 'Yes' : 'No'} />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gold-400/50 uppercase tracking-wider">Short Description</label>
                <p className="text-sm text-white/60">{selected.shortDescription}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gold-400/50 uppercase tracking-wider">Full Story</label>
                <p className="text-sm text-white/50 whitespace-pre-line">{selected.fullStory}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gold-400/50 uppercase tracking-wider">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {selected.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/40">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gold-400/50 uppercase tracking-wider">Scores</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <ScoreCell label="Mystery" value={selected.mysteryScore} />
                  <ScoreCell label="Historical" value={selected.historicalScore} />
                  <ScoreCell label="Architecture" value={selected.architectureScore} />
                  <ScoreCell label="Tourism" value={selected.tourismScore} />
                  <ScoreCell label="Local Legend" value={selected.localLegendScore} />
                  <ScoreCell label="Travel Interest" value={selected.travelInterestScore} />
                </div>
              </div>

              {selected.sourceSummary && (
                <div className="space-y-2">
                  <label className="text-xs text-gold-400/50 uppercase tracking-wider">Source Summary</label>
                  <p className="text-xs text-white/40">{selected.sourceSummary}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-white/20">Select an entry to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/25 text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-white/60 mt-0.5">{value}</p>
    </div>
  )
}

function ScoreCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 rounded px-2 py-1.5">
      <p className="text-white/25 text-[10px]">{label}</p>
      <p className="text-white/70 font-medium">{value}</p>
    </div>
  )
}
