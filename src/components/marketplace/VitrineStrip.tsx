'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Store } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { PlaceEntry } from '@/types/places'

export interface VitrineProduct {
  id: string
  title: string
  price: string | null
  thumbnail: string | null
  externalUrl: string | null
  placeSlug: string
}

interface Props {
  allPlaces: PlaceEntry[]
  cameraLat: number | null
  cameraLng: number | null
  onSelectPlace: (place: PlaceEntry) => void
  limit?: number
}

// Haversine-ish distance (squared, degrees) — good enough for sorting
function distSq(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  return (a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2
}

export function VitrineStrip({
  allPlaces,
  cameraLat,
  cameraLng,
  onSelectPlace,
  limit = 6,
}: Props) {
  const [products, setProducts] = useState<VitrineProduct[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/products/showcase')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setProducts(data.products ?? [])
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const enrichedSorted = useMemo(() => {
    if (!products || products.length === 0) return []
    const withPlace = products
      .map((p) => {
        const place = allPlaces.find((pl) => pl.slug === p.placeSlug)
        if (!place) return null
        return { product: p, place }
      })
      .filter((x): x is { product: VitrineProduct; place: PlaceEntry } => x !== null)

    if (cameraLat !== null && cameraLng !== null) {
      withPlace.sort(
        (a, b) =>
          distSq({ lat: a.place.latitude, lng: a.place.longitude }, { lat: cameraLat, lng: cameraLng }) -
          distSq({ lat: b.place.latitude, lng: b.place.longitude }, { lat: cameraLat, lng: cameraLng }),
      )
    }

    return withPlace.slice(0, limit)
  }, [products, allPlaces, cameraLat, cameraLng, limit])

  if (products === null || enrichedSorted.length === 0) return null

  return (
    <>
      {/* Desktop: horizontal strip at top-center */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="hidden md:flex absolute top-[9.5rem] left-1/2 -translate-x-1/2 z-20 gap-2 items-center max-w-[720px] overflow-x-auto pb-1 pointer-events-auto"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="flex items-center gap-1 pr-2 text-[10px] uppercase tracking-widest text-amber-300/80 whitespace-nowrap">
          <Store className="w-3 h-3" />
          <span>Vitrines proches</span>
        </div>
        {enrichedSorted.map(({ product, place }) => (
          <DesktopCard
            key={product.id}
            product={product}
            place={place}
            onClick={() => onSelectPlace(place)}
          />
        ))}
      </motion.div>

      {/* Mobile: strip above the featured strip */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="md:hidden absolute bottom-[9.5rem] left-0 right-0 z-20 pointer-events-auto"
      >
        <div className="flex items-center gap-1 px-3 pb-1 text-[9px] uppercase tracking-widest text-amber-300/80">
          <Store className="w-2.5 h-2.5" />
          <span>Vitrines proches d&apos;ici</span>
        </div>
        <div className="flex gap-2 px-3 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory">
          {enrichedSorted.map(({ product, place }) => (
            <MobileCard
              key={product.id}
              product={product}
              place={place}
              onClick={() => onSelectPlace(place)}
            />
          ))}
        </div>
      </motion.div>
    </>
  )
}

function DesktopCard({
  product,
  place,
  onClick,
}: {
  product: VitrineProduct
  place: PlaceEntry
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 flex-shrink-0 glass rounded-lg border border-amber-400/15 hover:border-amber-400/40 bg-black/40 backdrop-blur-md pr-3 pl-1 py-1 transition-colors"
      title={`${product.title} — ${place.title}`}
    >
      <div className="w-8 h-8 rounded overflow-hidden bg-white/5 flex-shrink-0">
        {product.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-300/40 text-sm">
            🛍️
          </div>
        )}
      </div>
      <div className="text-left min-w-0 max-w-[130px]">
        <div className="text-[11px] font-medium text-white truncate group-hover:text-amber-200 transition-colors">
          {product.title}
        </div>
        <div className="text-[9px] text-white/40 truncate">
          {product.price ? <span className="text-amber-300/80">{product.price}</span> : place.title}
        </div>
      </div>
      <ExternalLink className="w-2.5 h-2.5 text-white/30 flex-shrink-0" />
    </button>
  )
}

function MobileCard({
  product,
  place,
  onClick,
}: {
  product: VitrineProduct
  place: PlaceEntry
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="snap-start flex-shrink-0 w-[150px] glass rounded-xl border border-amber-400/15 bg-black/40 backdrop-blur-md p-2 flex gap-2 items-center text-left"
    >
      <div className="w-9 h-9 rounded overflow-hidden bg-white/5 flex-shrink-0">
        {product.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-300/40">
            🛍️
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium text-white truncate">{product.title}</div>
        <div className="text-[9px] text-amber-300/70 truncate">
          {product.price ?? place.title}
        </div>
      </div>
    </button>
  )
}
