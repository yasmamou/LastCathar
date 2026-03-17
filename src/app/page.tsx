'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { PlaceEntry, CategoryPrimary, ConfidenceLevel } from '@/types/places'
import { allPlaces } from '@/data/all-places'
import { Header } from '@/components/layout/Header'
import { AmbientMusic } from '@/components/layout/AmbientMusic'
import { PlaceDetailPanel } from '@/components/panels/PlaceDetailPanel'
import { CategoryFilters } from '@/components/layout/CategoryFilters'
import { SearchBar } from '@/components/layout/SearchBar'
import { FeaturedStrip } from '@/components/layout/FeaturedStrip'

const GlobeView = dynamic(() => import('@/components/globe/GlobeView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-midnight-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border border-gold-400/20 border-t-gold-400/60 animate-spin" />
        <div className="text-gold-400/40 text-xs tracking-[0.3em] uppercase">
          Initializing Globe
        </div>
      </div>
    </div>
  ),
})

export default function Home() {
  const [selectedPlace, setSelectedPlace] = useState<PlaceEntry | null>(null)
  const [flyToTrigger, setFlyToTrigger] = useState(0)
  const [activeCategory, setActiveCategory] = useState<CategoryPrimary | null>(null)
  const [activeConfidence, setActiveConfidence] = useState<ConfidenceLevel | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showIntro, setShowIntro] = useState(true)
  const [uiVisible, setUiVisible] = useState(false)

  useEffect(() => {
    const introTimer = setTimeout(() => setShowIntro(false), 3500)
    const uiTimer = setTimeout(() => setUiVisible(true), 4000)
    return () => {
      clearTimeout(introTimer)
      clearTimeout(uiTimer)
    }
  }, [])

  const filteredPlaces = allPlaces.filter((place) => {
    if (activeCategory && place.categoryPrimary !== activeCategory) return false
    if (activeConfidence && place.confidenceLevel !== activeConfidence) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        place.title.toLowerCase().includes(q) ||
        place.tags.some((t) => t.toLowerCase().includes(q)) ||
        place.shortDescription.toLowerCase().includes(q) ||
        place.alternateNames.some((n) => n.toLowerCase().includes(q))
      )
    }
    return true
  })

  const featuredPlaces = (activeCategory || activeConfidence || searchQuery)
    ? filteredPlaces.slice(0, 20)
    : allPlaces.filter((p) => p.isFeatured)

  const handlePlaceSelect = useCallback((place: PlaceEntry) => {
    setSelectedPlace(place)
    setFlyToTrigger((n) => n + 1)
    setSearchQuery('')
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedPlace(null)
  }, [])

  const [showFilters, setShowFilters] = useState(false)

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-midnight-950">
      {/* Globe — full screen, always interactive */}
      <div className="absolute inset-0 z-0">
        <GlobeView
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          flyToTrigger={flyToTrigger}
          onPlaceSelect={handlePlaceSelect}
        />
      </div>

      {/* Cinematic vignette — lighter on mobile so globe is more visible */}
      <div className="vignette z-10 pointer-events-none" />

      {/* Cinematic intro overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none px-4"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(5,6,13,0.3) 0%, rgba(5,6,13,0.95) 70%)',
            }}
          >
            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20, letterSpacing: '0.5em' }}
                animate={{ opacity: 1, y: 0, letterSpacing: '0.3em' }}
                transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                className="font-display text-4xl sm:text-5xl md:text-7xl font-semibold text-white/95"
              >
                Last Cathar
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 1.2 }}
                className="mt-3 text-xs sm:text-sm md:text-base tracking-[0.2em] sm:tracking-[0.25em] uppercase text-gold-400/50"
              >
                Treasures &middot; Myths &middot; Hidden Stories
              </motion.p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.5, delay: 1.8, ease: 'easeInOut' }}
                className="mt-4 mx-auto w-24 sm:w-32 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI overlays — appear after intro */}
      <AnimatePresence>
        {uiVisible && !selectedPlace && (
          <>
            <Header />

            {/* Search bar — compact on mobile */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute top-10 sm:top-16 md:top-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-3"
            >
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                allPlaces={allPlaces}
                onPlaceSelect={handlePlaceSelect}
              />
            </motion.div>

            {/* Mobile: filter toggle button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="md:hidden absolute top-[4.5rem] right-3 z-30"
            >
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="glass rounded-full px-3 py-1.5 text-[10px] tracking-wider uppercase text-white/40 active:text-white/70"
              >
                {showFilters ? 'Hide filters' : 'Filters'}
                {(activeCategory || activeConfidence) && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-gold-400 inline-block" />
                )}
              </button>
            </motion.div>

            {/* Category filters — hidden on mobile unless toggled, always visible on desktop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className={`absolute top-[6.5rem] sm:top-[7rem] md:top-[8.5rem] left-1/2 -translate-x-1/2 z-20 w-full max-w-3xl px-2 md:px-4 ${
                showFilters ? 'block' : 'hidden md:block'
              }`}
            >
              <CategoryFilters
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                activeConfidence={activeConfidence}
                onConfidenceChange={setActiveConfidence}
                places={allPlaces}
              />
            </motion.div>

            {/* Featured strip at bottom */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="absolute bottom-0 left-0 right-0 z-20"
            >
              <FeaturedStrip places={featuredPlaces} onSelect={handlePlaceSelect} />
            </motion.div>

            {/* Music player — bottom left, above featured strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="absolute bottom-[3.5rem] sm:bottom-20 md:bottom-24 left-2 md:left-4 z-30"
            >
              <AmbientMusic
                selectedCountry={undefined}
                selectedEras={undefined}
              />
            </motion.div>

            {/* Place count */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="absolute bottom-[3.5rem] sm:bottom-20 md:bottom-[6.5rem] right-2 md:right-4 z-10"
            >
              <p className="text-[9px] md:text-[10px] text-white/15 tracking-wider">
                {filteredPlaces.length} places
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Place detail panel */}
      <AnimatePresence>
        {selectedPlace && (
          <PlaceDetailPanel
            place={selectedPlace}
            onClose={handleClosePanel}
            selectedCountry={selectedPlace.country}
            selectedEras={selectedPlace.era}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
