'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, MapPin } from 'lucide-react'
import { PlaceEntry } from '@/types/places'
import { getCategoryColor, getCategoryIcon, getCategoryLabel } from '@/lib/categories'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  allPlaces: PlaceEntry[]
  onPlaceSelect: (place: PlaceEntry) => void
}

export function SearchBar({ value, onChange, allPlaces, onPlaceSelect }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const suggestions = useMemo(() => {
    if (!value || value.length < 1) return []
    const q = value.toLowerCase()
    return allPlaces
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.alternateNames.some((n) => n.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.categoryPrimary.toLowerCase().includes(q) ||
          (p.region && p.region.toLowerCase().includes(q))
      )
      .slice(0, 8)
  }, [value, allPlaces])

  const showDropdown = isFocused && suggestions.length > 0

  const handleSelect = (place: PlaceEntry) => {
    onPlaceSelect(place)
    setIsFocused(false)
    onChange('')
    inputRef.current?.blur()
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="glass glow-gold rounded-2xl px-5 py-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-gold-400/60 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search treasures, myths, castles..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="bg-transparent text-sm text-white/90 placeholder:text-white/25 outline-none flex-1 tracking-wide"
        />
        {value && (
          <button
            onClick={() => { onChange(''); inputRef.current?.focus() }}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 glass rounded-xl overflow-hidden shadow-2xl z-50"
          >
            {suggestions.map((place) => {
              const color = getCategoryColor(place.categoryPrimary)
              return (
                <button
                  key={place.id}
                  onClick={() => handleSelect(place)}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                >
                  <span
                    className="text-sm flex-shrink-0"
                    style={{ color }}
                  >
                    {getCategoryIcon(place.categoryPrimary)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/85 truncate">{place.title}</p>
                    <p className="text-[10px] text-white/30 truncate">
                      {getCategoryLabel(place.categoryPrimary)}
                      {place.region && ` · ${place.region}`}
                    </p>
                  </div>
                  <MapPin className="w-3 h-3 text-white/15 flex-shrink-0" />
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
