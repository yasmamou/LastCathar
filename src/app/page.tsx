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
import { Epic } from '@/data/epics'

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
  const [activeEpic, setActiveEpic] = useState<Epic | null>(null)
  const [nearbyMode, setNearbyMode] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)

  useEffect(() => {
    const introTimer = setTimeout(() => setShowIntro(false), 3500)
    const uiTimer = setTimeout(() => setUiVisible(true), 4000)
    return () => {
      clearTimeout(introTimer)
      clearTimeout(uiTimer)
    }
  }, [])

  // Epic mode: filter to only places in the active epic
  const epicSlugs = activeEpic ? new Set(activeEpic.places.map(p => p.slug)) : null

  const filteredPlaces = allPlaces.filter((place) => {
    // Epic filter takes priority
    if (epicSlugs && !epicSlugs.has(place.slug)) return false
    if (activeCategory && place.categoryPrimary !== activeCategory) return false
    if (activeConfidence && place.confidenceLevel !== activeConfidence) return false
    // Nearby mode: sort by distance (filter happens below)
    if (nearbyMode && userLocation) {
      const dist = Math.sqrt(
        Math.pow(place.latitude - userLocation.lat, 2) +
        Math.pow(place.longitude - userLocation.lng, 2)
      )
      // Show places within ~300km (~3 degrees)
      if (dist > 3) return false
    }
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

  // Sort nearby places by distance
  const sortedPlaces = (nearbyMode && userLocation)
    ? [...filteredPlaces].sort((a, b) => {
        const da = Math.sqrt(Math.pow(a.latitude - userLocation.lat, 2) + Math.pow(a.longitude - userLocation.lng, 2))
        const db = Math.sqrt(Math.pow(b.latitude - userLocation.lat, 2) + Math.pow(b.longitude - userLocation.lng, 2))
        return da - db
      })
    : filteredPlaces

  const featuredPlaces = activeEpic
    ? activeEpic.places
        .map(ep => allPlaces.find(p => p.slug === ep.slug))
        .filter((p): p is PlaceEntry => p !== undefined)
    : (activeCategory || activeConfidence || searchQuery || nearbyMode)
      ? sortedPlaces.slice(0, 20)
      : allPlaces.filter((p) => p.isFeatured)

  const handlePlaceSelect = useCallback((place: PlaceEntry) => {
    setSelectedPlace(place)
    setFlyToTrigger((n) => n + 1)
    setSearchQuery('')
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedPlace(null)
  }, [])

  const handleEpicSelect = useCallback((epic: Epic) => {
    setActiveEpic(epic)
    setActiveCategory(null)
    setActiveConfidence(null)
    setSearchQuery('')
    setNearbyMode(false)
    // Fly to first place in epic
    const firstSlug = epic.places[0]?.slug
    const firstPlace = allPlaces.find(p => p.slug === firstSlug)
    if (firstPlace) {
      setSelectedPlace(firstPlace)
      setFlyToTrigger(n => n + 1)
    }
  }, [])

  const handleNearby = useCallback(() => {
    if (nearbyMode) {
      setNearbyMode(false)
      setUserLocation(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setNearbyMode(true)
        setActiveEpic(null)
        setActiveCategory(null)
        setSearchQuery('')
      },
      () => {
        alert('Impossible d\'accéder à votre position. Vérifiez les permissions.')
      }
    )
  }, [nearbyMode])

  const handleClearEpic = useCallback(() => {
    setActiveEpic(null)
  }, [])

  const [showFilters, setShowFilters] = useState(false)

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-midnight-950">
      {/* Globe — full screen, always interactive */}
      <div className="absolute inset-0 z-0">
        <GlobeView
          places={sortedPlaces}
          selectedPlace={selectedPlace}
          flyToTrigger={flyToTrigger}
          onPlaceSelect={handlePlaceSelect}
          epicLines={activeEpic ? { placeSlugs: activeEpic.places.map(p => p.slug), color: activeEpic.color } : null}
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
                onEpicSelect={handleEpicSelect}
              />
            </motion.div>

            {/* Quick action buttons — left side, below header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute top-[4.2rem] sm:top-[5rem] md:top-[5.5rem] left-2 md:left-4 z-25 flex flex-col gap-1.5"
            >
              {/* Nearby button */}
              <button
                onClick={handleNearby}
                className={`glass rounded-full px-3 py-1.5 text-[10px] tracking-wider uppercase transition-colors flex items-center gap-1.5 ${
                  nearbyMode
                    ? 'text-emerald-400 border border-emerald-400/30'
                    : 'text-white/30 hover:text-white/50 active:text-white/70'
                }`}
              >
                📍 {nearbyMode ? `Près de moi · ${sortedPlaces.length}` : 'Près de moi'}
                {nearbyMode && <span className="text-white/30 ml-1">✕</span>}
              </button>

              {/* Mobile: filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden glass rounded-full px-3 py-1.5 text-[10px] tracking-wider uppercase text-white/40 active:text-white/70 flex items-center gap-1.5"
              >
                {showFilters ? 'Masquer filtres' : 'Filtres'}
                {(activeCategory || activeConfidence) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400 inline-block" />
                )}
              </button>
            </motion.div>

            {/* Active epic banner — centered below search */}
            {activeEpic && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-[4.2rem] sm:top-[5rem] md:top-[5.5rem] left-1/2 -translate-x-1/2 z-25"
              >
                <div
                  className="glass rounded-full px-4 py-1.5 flex items-center gap-2 text-xs"
                  style={{ color: activeEpic.color, borderColor: `${activeEpic.color}30`, borderWidth: 1 }}
                >
                  <span>{activeEpic.icon}</span>
                  <span className="font-medium">{activeEpic.title}</span>
                  <span className="text-white/30 hidden sm:inline">· {activeEpic.places.length} lieux</span>
                  <button onClick={handleClearEpic} className="text-white/30 hover:text-white/60 ml-1">✕</button>
                </div>
              </motion.div>
            )}

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
                {sortedPlaces.length} places
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
            onEpicSelect={handleEpicSelect}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
