'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Store, Plus } from 'lucide-react'
import Link from 'next/link'
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
  referenceLat: number | null
  referenceLng: number | null
  onSelectPlace: (place: PlaceEntry, productId?: string) => void
  chercheurActive?: boolean
  panelOpen?: boolean
  limit?: number
}

function distSq(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  return (a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2
}

export function VitrineStrip({
  allPlaces,
  referenceLat,
  referenceLng,
  onSelectPlace,
  chercheurActive,
  panelOpen,
  limit = 3,
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

    if (referenceLat !== null && referenceLng !== null) {
      withPlace.sort(
        (a, b) =>
          distSq(
            { lat: a.place.latitude, lng: a.place.longitude },
            { lat: referenceLat, lng: referenceLng },
          ) -
          distSq(
            { lat: b.place.latitude, lng: b.place.longitude },
            { lat: referenceLat, lng: referenceLng },
          ),
      )
    }

    return withPlace.slice(0, limit)
  }, [products, allPlaces, referenceLat, referenceLng, limit])

  if (products === null) return null

  const hasProducts = enrichedSorted.length > 0

  // Desktop:
  // - No panel → vertical column on the RIGHT side (music player is bottom-LEFT)
  //   - Chercheur active   → HUD at top-20 right-4 (~13rem tall) → products below at top-[19rem]
  //   - Chercheur inactive → products take the HUD slot at top-20
  // - Panel open → horizontal strip along the TOP, between the Chercheur HUD
  //   (top-left, 320px wide) and the place panel (right, max-w-md). Keeps the
  //   bottom-left music player area completely clear.
  const desktopPosClass = panelOpen
    ? chercheurActive
      ? 'md:top-4 md:left-[22.5rem] md:right-[29.5rem]'
      : 'md:top-4 md:left-4 md:right-[29.5rem]'
    : chercheurActive
      ? 'md:top-[19rem] md:right-4 md:w-[210px]'
      : 'md:top-20 md:right-4 md:w-[210px]'

  return (
    <>
      {/* ────────────── DESKTOP: right column (no panel) / top strip (panel open) ────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 12 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className={`hidden md:block absolute ${desktopPosClass} z-20 pointer-events-auto`}
      >
        <div className="flex items-center gap-1.5 px-1 mb-1.5 text-[10px] uppercase tracking-widest text-amber-300/80">
          <Store className="w-3 h-3" />
          <span>Produits locaux</span>
        </div>

        <div
          className={
            panelOpen
              ? 'flex flex-row gap-1.5 overflow-x-auto pb-1'
              : 'flex flex-col gap-1.5'
          }
          style={panelOpen ? { scrollbarWidth: 'none' } : undefined}
        >
          {enrichedSorted.map(({ product, place }) => (
            <DesktopProductCard
              key={product.id}
              product={product}
              place={place}
              rowMode={!!panelOpen}
              onClick={() => onSelectPlace(place, product.id)}
            />
          ))}

          <DesktopEmptySlot
            rowMode={!!panelOpen}
            label={hasProducts ? 'Votre produit ici' : 'Soyez le premier ici'}
          />
        </div>
      </motion.div>

      {/* NOTE: la vitrine mobile a été retirée de la carte (elle occupait trop de
          place). Les produits locaux sont désormais présentés dans la visite
          guidée (parcours audio), voir CarcassonneTour. */}
    </>
  )
}

// ─── Cards ────────────────────────────────────────────────────────────

function DesktopProductCard({
  product,
  place,
  onClick,
  rowMode,
}: {
  product: VitrineProduct
  place: PlaceEntry
  onClick: () => void
  rowMode?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 glass rounded-lg border border-amber-400/15 hover:border-amber-400/40 bg-black/40 backdrop-blur-md px-2 py-1.5 transition-colors text-left ${
        rowMode ? 'flex-shrink-0 w-[200px]' : ''
      }`}
      title={`${product.title} — ${place.title}`}
    >
      <div className="w-8 h-8 rounded overflow-hidden bg-white/5 flex-shrink-0">
        {product.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-300/40 text-sm">
            🛍️
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
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

function DesktopEmptySlot({ label, rowMode }: { label: string; rowMode?: boolean }) {
  return (
    <Link
      href="/pricing"
      className={`group flex items-center gap-2 rounded-lg border border-dashed border-amber-400/30 hover:border-amber-400/60 bg-amber-400/5 hover:bg-amber-400/10 px-2 py-1.5 transition-colors ${
        rowMode ? 'flex-shrink-0 w-[200px]' : ''
      }`}
    >
      <div className="w-8 h-8 rounded flex items-center justify-center bg-amber-400/10 flex-shrink-0">
        <Plus className="w-4 h-4 text-amber-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-amber-300 truncate">{label}</div>
        <div className="text-[9px] text-white/50 truncate">Réserver cet emplacement →</div>
      </div>
    </Link>
  )
}
