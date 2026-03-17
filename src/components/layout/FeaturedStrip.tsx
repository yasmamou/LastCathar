'use client'

import { useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PlaceEntry } from '@/types/places'
import { getCategoryColor, getCategoryIcon, getConfidenceLabel, getConfidenceColor } from '@/lib/categories'

interface FeaturedStripProps {
  places: PlaceEntry[]
  onSelect: (place: PlaceEntry) => void
}

export function FeaturedStrip({ places, onSelect }: FeaturedStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const hasMoved = useRef(false)

  // Mouse events (desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return
    isDragging.current = true
    hasMoved.current = false
    startX.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
    scrollRef.current.style.cursor = 'grabbing'
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.5
    if (Math.abs(walk) > 5) hasMoved.current = true
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
  }, [])

  // Touch events (mobile)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return
    isDragging.current = true
    hasMoved.current = false
    startX.current = e.touches[0].pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.5
    if (Math.abs(walk) > 5) hasMoved.current = true
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
  }, [])

  const handleCardClick = useCallback((place: PlaceEntry) => {
    if (!hasMoved.current) {
      onSelect(place)
    }
  }, [onSelect])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth',
    })
  }

  return (
    <div className="px-2 md:px-4 pb-2 md:pb-4 safe-bottom">
      <div className="flex items-center justify-between mb-1 md:mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-gold-400/40" />
          <span className="text-[10px] tracking-[0.2em] uppercase text-gold-400/30 font-medium">
            Featured
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="w-6 h-6 rounded-full glass-light flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-6 h-6 rounded-full glass-light flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex gap-2 pb-2 overflow-x-auto select-none snap-x snap-mandatory md:snap-none"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          cursor: 'grab',
        }}
      >
        {places.map((place) => {
          const color = getCategoryColor(place.categoryPrimary)
          return (
            <div
              key={place.id}
              onClick={() => handleCardClick(place)}
              className="glass-light flex-shrink-0 rounded-lg px-3 md:px-4 py-2.5 md:py-3 text-left transition-all duration-300 hover:bg-white/10 active:bg-white/15 group snap-start"
              style={{ width: '200px', minWidth: '200px', userSelect: 'none' }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs" style={{ color }}>
                  {getCategoryIcon(place.categoryPrimary)}
                </span>
                <span className="text-xs font-medium text-white/80 group-hover:text-white/95 transition-colors truncate">
                  {place.title}
                </span>
              </div>
              <p className="text-[10px] text-white/30 leading-relaxed line-clamp-2">
                {place.shortDescription}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{
                    color: getConfidenceColor(place.confidenceLevel),
                    backgroundColor: `${getConfidenceColor(place.confidenceLevel)}15`,
                  }}
                >
                  {getConfidenceLabel(place.confidenceLevel)}
                </span>
                {place.mysteryScore > 80 && (
                  <span className="text-[9px] text-purple-400/50">
                    Mystery {place.mysteryScore}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
