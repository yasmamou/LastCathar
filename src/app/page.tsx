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
import { EpicDetailPanel } from '@/components/panels/EpicDetailPanel'
import { AuthModal } from '@/components/auth/AuthModal'
import { Epic, EPICS } from '@/data/epics'
import { useChercheur } from '@/components/chercheur/useChercheur'
import { STARTER_EPIC_ID } from '@/lib/game'
import { WelcomeChercheurModal } from '@/components/chercheur/WelcomeChercheurModal'
import { ChercheurHUD } from '@/components/chercheur/ChercheurHUD'
import { BadgeToast } from '@/components/chercheur/BadgeToast'
import { QuestBanner } from '@/components/chercheur/QuestBanner'
import { XpToast } from '@/components/chercheur/XpToast'
import { EpicPicker } from '@/components/chercheur/EpicPicker'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { VitrineStrip } from '@/components/marketplace/VitrineStrip'

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
  const [flyToCoords, setFlyToCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [activeCategory, setActiveCategory] = useState<CategoryPrimary | null>(null)
  const [activeConfidence, setActiveConfidence] = useState<ConfidenceLevel | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showIntro, setShowIntro] = useState(true)
  const [uiVisible, setUiVisible] = useState(false)
  const [activeEpic, setActiveEpic] = useState<Epic | null>(null)
  const [showEpicPanel, setShowEpicPanel] = useState(false)
  const [nearbyMode, setNearbyMode] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [interactionFilter, setInteractionFilter] = useState<'VISITED' | 'WISHLIST' | 'FAVORITE' | null>(null)
  const [interactionSlugs, setInteractionSlugs] = useState<string[]>([])

  // Chercheur (gamified) mode
  const chercheur = useChercheur()

  // Camera center — used by VitrineStrip to sort products by proximity
  const [cameraLat, setCameraLat] = useState<number | null>(null)
  const [cameraLng, setCameraLng] = useState<number | null>(null)
  const handleCameraMove = useCallback((lat: number, lng: number) => {
    setCameraLat(lat)
    setCameraLng(lng)
  }, [])

  // When a Vitrine card is clicked, highlight the product inside the place panel
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null)

  // Epic picker modal
  const [epicPickerOpen, setEpicPickerOpen] = useState(false)

  const handleFilterInteractions = useCallback((filter: 'VISITED' | 'WISHLIST' | 'FAVORITE' | null, slugs: string[]) => {
    setInteractionFilter(filter)
    setInteractionSlugs(slugs)
    // Clear other filters
    if (filter) {
      setActiveCategory(null)
      setActiveConfidence(null)
      setSearchQuery('')
      setActiveEpic(null)
      setShowEpicPanel(false)
      setNearbyMode(false)
    }
  }, [])

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

  const interactionSlugSet = interactionFilter ? new Set(interactionSlugs) : null

  const filteredPlaces = allPlaces.filter((place) => {
    // Interaction filter (from user menu: visited/wishlist/favorite)
    if (interactionSlugSet && !interactionSlugSet.has(place.slug)) return false
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
    : (activeCategory || activeConfidence || searchQuery || nearbyMode || interactionFilter)
      ? sortedPlaces.slice(0, 20)
      : allPlaces.filter((p) => p.isFeatured)

  // Nearby places for the selected place (for bottom strip)
  const nearbyPlaces = selectedPlace
    ? allPlaces
        .filter(p => p.slug !== selectedPlace.slug)
        .map(p => ({
          ...p,
          _dist: Math.sqrt(
            Math.pow(p.latitude - selectedPlace.latitude, 2) +
            Math.pow(p.longitude - selectedPlace.longitude, 2)
          ),
        }))
        .sort((a, b) => a._dist - b._dist)
        .slice(0, 15)
    : []

  const handlePlaceSelect = useCallback((place: PlaceEntry, productId?: string) => {
    setSelectedPlace(place)
    setHighlightedProductId(productId ?? null)
    setFlyToTrigger((n) => n + 1)
    setSearchQuery('')
    // If in Chercheur mode: epic place → full visit; any other place → bonus XP
    if (chercheur.chercheurMode) {
      const activeEpic = EPICS.find((e) => e.id === chercheur.activeEpicId)
      if (activeEpic?.places.some((p) => p.slug === place.slug)) {
        chercheur.recordVisit(chercheur.activeEpicId, place.slug)
      } else {
        chercheur.recordVisit('bonus', place.slug)
      }
    }
  }, [chercheur])

  const handleClosePanel = useCallback(() => {
    setSelectedPlace(null)
    // If we came from an epic, go back to epic panel
    if (activeEpic) {
      setShowEpicPanel(true)
    }
  }, [activeEpic])

  const handleCloseEpicPanel = useCallback(() => {
    setShowEpicPanel(false)
    setActiveEpic(null)
  }, [])

  const handleEpicSelect = useCallback((epic: Epic) => {
    setActiveEpic(epic)
    setShowEpicPanel(true)
    setSelectedPlace(null)
    setActiveCategory(null)
    setActiveConfidence(null)
    setSearchQuery('')
    setNearbyMode(false)
    // Clear the interaction filter too — otherwise its filtering stays applied
    // (hiding epic places) and both banners fight for the same spot.
    setInteractionFilter(null)
    setInteractionSlugs([])
    // Fly to first place in epic. selectedPlace is null here (we show the epic
    // panel, not a place panel), so hand GlobeView explicit coords to fly to.
    const firstSlug = epic.places[0]?.slug
    const firstPlace = allPlaces.find(p => p.slug === firstSlug)
    if (firstPlace) {
      setFlyToCoords({ latitude: firstPlace.latitude, longitude: firstPlace.longitude })
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
        setInteractionFilter(null)
        setInteractionSlugs([])
      },
      () => {
        alert('Impossible d\'accéder à votre position. Vérifiez les permissions.')
      }
    )
  }, [nearbyMode])

  const handleClearEpic = useCallback(() => {
    setActiveEpic(null)
    setShowEpicPanel(false)
  }, [])

  const handleEpicPlaceSelect = useCallback((place: PlaceEntry) => {
    setShowEpicPanel(false)
    setSelectedPlace(place)
    setFlyToTrigger(n => n + 1)
  }, [])

  const handleOpenAuth = useCallback(() => {
    setShowAuthModal(true)
  }, [])

  // From the end of the Carcassonne guided tour → continue the Cathar epic at
  // the next place (Béziers). Activates the epic + flies to the next place.
  const handleContinueCatharEpic = useCallback(() => {
    const cathar = EPICS.find((e) => e.id === STARTER_EPIC_ID)
    if (!cathar) return
    const ordered = [...cathar.places].sort((a, b) => a.order - b.order)
    const idx = ordered.findIndex((p) => p.slug === 'cite-de-carcassonne')
    const nextEpicPlace = ordered[idx + 1] ?? ordered[0]
    const target = allPlaces.find((p) => p.slug === nextEpicPlace?.slug)
    chercheur.setActiveEpicId(STARTER_EPIC_ID)
    setActiveEpic(cathar)
    if (target) {
      setSelectedPlace(target)
      setShowEpicPanel(false)
      setFlyToTrigger((n) => n + 1)
      chercheur.recordVisit(STARTER_EPIC_ID, target.slug)
    }
  }, [chercheur])

  const handleStartChercheur = useCallback(() => {
    // startMode() resets the active epic to STARTER_EPIC_ID; reference the
    // constant directly rather than chercheur.activeEpicId, which still holds
    // the (possibly different, persisted) render-time value in this closure.
    chercheur.startMode()
    const catharEpic = EPICS.find((e) => e.id === STARTER_EPIC_ID)
    const carcassonne = allPlaces.find((p) => p.slug === 'cite-de-carcassonne')
    if (catharEpic) {
      setActiveEpic(catharEpic)
      setActiveCategory(null)
      setActiveConfidence(null)
      setSearchQuery('')
      setNearbyMode(false)
      setInteractionFilter(null)
    }
    if (carcassonne) {
      setSelectedPlace(carcassonne)
      setShowEpicPanel(false)
      setFlyToTrigger((n) => n + 1)
      chercheur.recordVisit(STARTER_EPIC_ID, carcassonne.slug)
    }
  }, [chercheur])

  const handleChercheurNextStep = useCallback(() => {
    const epic = EPICS.find((e) => e.id === chercheur.activeEpicId)
    if (!epic) return
    const progress = chercheur.state?.progress.find((p) => p.epicId === chercheur.activeEpicId)
    const ordered = [...epic.places].sort((a, b) => a.order - b.order)
    const next = ordered.find((p) => !progress?.visitedSlugs.includes(p.slug))
    if (!next) return
    const place = allPlaces.find((p) => p.slug === next.slug)
    if (place) handlePlaceSelect(place)
  }, [chercheur.activeEpicId, chercheur.state, handlePlaceSelect])

  // Select a new epic from the picker → activate + fly to first unvisited place
  const handleSelectEpic = useCallback((newEpicId: string) => {
    const newEpic = EPICS.find((e) => e.id === newEpicId)
    if (!newEpic) return
    chercheur.setActiveEpicId(newEpicId)
    setActiveEpic(newEpic)
    setActiveCategory(null)
    setActiveConfidence(null)
    setSearchQuery('')
    setNearbyMode(false)
    setInteractionFilter(null)

    const progress = chercheur.state?.progress.find((p) => p.epicId === newEpicId)
    const ordered = [...newEpic.places].sort((a, b) => a.order - b.order)
    const nextEpicPlace =
      ordered.find((p) => !progress?.visitedSlugs.includes(p.slug)) ?? ordered[0]
    const target = allPlaces.find((p) => p.slug === nextEpicPlace?.slug)
    if (target) {
      setSelectedPlace(target)
      setShowEpicPanel(false)
      setFlyToTrigger((n) => n + 1)
      chercheur.recordVisit(newEpicId, target.slug)
    }
  }, [chercheur])

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
          onCameraMove={handleCameraMove}
          epicLines={activeEpic ? { placeSlugs: activeEpic.places.map(p => p.slug), color: activeEpic.color } : null}
          flyToCoords={flyToCoords}
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
        {uiVisible && !selectedPlace && !showEpicPanel && (
          <>
            <Header
              onOpenAuth={handleOpenAuth}
              onFilterInteractions={handleFilterInteractions}
              activeInteractionFilter={interactionFilter}
            />

            {/* Interaction filter banner — below search (mobile) / below filters (desktop).
                NOTE: motion elements that animate y overwrite the CSS transform, killing
                -translate-x-1/2 — the x:'-50%' in style restores true centering. */}
            {interactionFilter && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ x: '-50%' }}
                className="absolute top-[8.25rem] md:top-[13rem] left-1/2 md:left-[calc(50%-7rem)] z-[25]"
              >
                <div className={`glass rounded-full px-4 py-1.5 flex items-center gap-2 text-xs ${
                  interactionFilter === 'VISITED' ? 'text-emerald-400 border-emerald-400/20' :
                  interactionFilter === 'WISHLIST' ? 'text-blue-400 border-blue-400/20' :
                  'text-pink-400 border-pink-400/20'
                }`} style={{ borderWidth: 1 }}>
                  <span>{
                    interactionFilter === 'VISITED' ? '✓ Mes lieux visités' :
                    interactionFilter === 'WISHLIST' ? '📌 Ma wishlist' :
                    '❤️ Mes favoris'
                  }</span>
                  <span className="text-white/30">· {sortedPlaces.length} lieux</span>
                  <button onClick={() => handleFilterInteractions(null, [])} className="text-white/30 hover:text-white/60 ml-1">✕</button>
                </div>
              </motion.div>
            )}

            {/* Search bar — compact on mobile. x:'-50%' keeps it centered because the
                y animation would otherwise clobber the Tailwind translate. Narrower on
                md so it never runs under the right-side HUD/vitrine columns. */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ x: '-50%' }}
              className="absolute top-10 sm:top-16 md:top-20 left-1/2 md:left-[calc(50%-7rem)] z-30 w-full max-w-xl md:max-w-md lg:max-w-xl px-3"
            >
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                allPlaces={allPlaces}
                onPlaceSelect={handlePlaceSelect}
                onEpicSelect={handleEpicSelect}
              />
            </motion.div>

            {/* Quick action buttons — horizontal row below the search on mobile
                (the old column collided with the centered search bar), vertical
                column on the left on desktop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute top-[6.25rem] sm:top-[7rem] md:top-[5.5rem] left-2 md:left-4 z-[25] flex flex-row md:flex-col gap-1.5"
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

              {/* PWA install prompt */}
              <InstallPrompt />
            </motion.div>

            {/* Active epic banner — below search (mobile) / below filters (desktop),
                x:'-50%' for true centering (see note on the search bar) */}
            {activeEpic && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ x: '-50%' }}
                className="absolute top-[8.25rem] md:top-[13rem] left-1/2 md:left-[calc(50%-7rem)] z-[25]"
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
              className={`absolute top-[10rem] sm:top-[10.5rem] md:top-[8.5rem] left-1/2 -translate-x-1/2 md:left-[calc(50%-7rem)] z-20 w-full max-w-3xl px-2 md:px-4 ${
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

      {/* Epic detail panel */}
      <AnimatePresence>
        {showEpicPanel && activeEpic && !selectedPlace && (
          <EpicDetailPanel
            epic={activeEpic}
            allPlaces={allPlaces}
            onClose={handleCloseEpicPanel}
            onPlaceSelect={handleEpicPlaceSelect}
          />
        )}
      </AnimatePresence>

      {/* Place detail panel */}
      <AnimatePresence>
        {selectedPlace && (
          <PlaceDetailPanel
            place={selectedPlace}
            onClose={handleClosePanel}
            onEpicSelect={handleEpicSelect}
            onOpenAuth={handleOpenAuth}
            allPlaces={allPlaces}
            onPlaceSelect={handlePlaceSelect}
            highlightedProductId={highlightedProductId}
            onContinueCatharEpic={handleContinueCatharEpic}
          />
        )}
      </AnimatePresence>

      {/* Marketplace vitrines — outside the UI overlay block, always visible except during intro.
          On mobile the strip yields its slot to the category filters / active banners. */}
      {uiVisible && (
        <VitrineStrip
          allPlaces={allPlaces}
          referenceLat={selectedPlace ? selectedPlace.latitude : cameraLat}
          referenceLng={selectedPlace ? selectedPlace.longitude : cameraLng}
          onSelectPlace={handlePlaceSelect}
          chercheurActive={chercheur.chercheurMode}
          panelOpen={!!selectedPlace || showEpicPanel}
        />
      )}

      {/* Nearby places strip — shown when a place is selected */}
      {selectedPlace && nearbyPlaces.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <FeaturedStrip places={nearbyPlaces} onSelect={handlePlaceSelect} />
        </div>
      )}

      {/* Auth modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Chercheur — Welcome modal on first landing */}
      <WelcomeChercheurModal
        isOpen={chercheur.showWelcome}
        onStart={handleStartChercheur}
        onDismiss={chercheur.dismissWelcome}
      />

      {/* Chercheur — persistent HUD */}
      <AnimatePresence>
        {chercheur.chercheurMode && uiVisible && (
          <ChercheurHUD
            state={chercheur.state}
            activeEpicId={chercheur.activeEpicId}
            onNextStep={handleChercheurNextStep}
            onOpenPicker={() => setEpicPickerOpen(true)}
            onStop={chercheur.stopMode}
            panelOpen={!!selectedPlace || showEpicPanel}
          />
        )}
      </AnimatePresence>

      {/* Chercheur — epic picker modal */}
      <EpicPicker
        isOpen={epicPickerOpen}
        onClose={() => setEpicPickerOpen(false)}
        onSelectEpic={handleSelectEpic}
        activeEpicId={chercheur.activeEpicId}
        state={chercheur.state}
      />

      {/* Chercheur — invitation banner top-left (only when mode inactive + no panel) */}
      <AnimatePresence>
        {uiVisible && !chercheur.chercheurMode && !selectedPlace && !showEpicPanel && (
          <QuestBanner onStart={handleStartChercheur} />
        )}
      </AnimatePresence>

      {/* Chercheur — badge toast + XP gain toast */}
      <BadgeToast badges={chercheur.lastBadges} onDismiss={chercheur.clearBadges} />
      <XpToast delta={chercheur.lastXpDelta} onDismiss={chercheur.clearXpDelta} />

      {/* Music player — fixed bottom-left; hidden on mobile when a panel covers the screen */}
      <AmbientMusic
        selectedCountry={selectedPlace?.country}
        selectedEras={selectedPlace?.era}
        placeSlug={selectedPlace?.slug}
        panelOpen={!!selectedPlace || showEpicPanel}
      />
    </main>
  )
}
