'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, Store, Plus, X } from 'lucide-react'
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
  limit = 4,
}: Props) {
  const [products, setProducts] = useState<VitrineProduct[] | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

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

  // Desktop positioning:
  // - No panel + Chercheur active   → below the HUD on the right
  // - No panel + Chercheur inactive → right side, below Header (top-20)
  // - Panel open + Chercheur active → below the HUD on the LEFT (HUD is at top-4 left-4 when panel open)
  // - Panel open + Chercheur inactive → LEFT side, top-20
  const desktopPosClass = panelOpen
    ? chercheurActive
      ? 'md:top-[16rem] md:left-4'
      : 'md:top-20 md:left-4'
    : chercheurActive
      ? 'md:top-[16rem] md:right-4'
      : 'md:top-20 md:right-4'

  return (
    <>
      {/* ────────────── DESKTOP: vertical column, side switches with panel state ────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className={`hidden md:flex flex-col gap-1.5 absolute ${desktopPosClass} z-20 w-[220px] pointer-events-auto`}
      >
        <div className="flex items-center gap-1.5 px-1 text-[10px] uppercase tracking-widest text-amber-300/80">
          <Store className="w-3 h-3" />
          <span>Produits locaux</span>
        </div>

        {enrichedSorted.map(({ product, place }) => (
          <DesktopProductCard
            key={product.id}
            product={product}
            place={place}
            onClick={() => onSelectPlace(place, product.id)}
          />
        ))}

        <DesktopEmptySlot label={hasProducts ? 'Votre produit ici' : 'Soyez le premier ici'} />
      </motion.div>

      {/* ────────────── MOBILE: pill bottom-right when no panel; hidden when panel open ────────────── */}
      {!panelOpen && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          onClick={() => setMobileOpen(true)}
          className="md:hidden absolute bottom-[6.5rem] right-2 z-20 pointer-events-auto glass rounded-full border border-amber-400/25 bg-black/50 backdrop-blur-md pl-2 pr-3 py-1.5 flex items-center gap-1.5 shadow-lg"
          aria-label="Voir les produits locaux"
        >
          <Store className="w-3 h-3 text-amber-300" />
          <span className="text-[10px] text-white/80 font-medium">
            {hasProducts ? (
              <>
                <b className="text-amber-300">{enrichedSorted.length}</b> produit
                {enrichedSorted.length > 1 ? 's' : ''} local
                {enrichedSorted.length > 1 ? 'aux' : ''}
              </>
            ) : (
              'Devenez marchand'
            )}
          </span>
        </motion.button>
      )}

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 flex items-end pointer-events-auto"
            style={{ background: 'rgba(5,6,13,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[70vh] rounded-t-2xl border-t border-amber-400/20 bg-gradient-to-b from-[#0f1120] to-[#05060d] p-4 pb-6 overflow-y-auto"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-xs uppercase tracking-widest text-amber-300/90 font-semibold">
                    Produits locaux
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-white/40 p-1"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {enrichedSorted.map(({ product, place }) => (
                  <MobileProductCard
                    key={product.id}
                    product={product}
                    place={place}
                    onClick={() => {
                      setMobileOpen(false)
                      onSelectPlace(place, product.id)
                    }}
                  />
                ))}
                <MobileEmptySlot
                  label={hasProducts ? 'Votre produit ici' : 'Soyez le premier ici'}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Cards ────────────────────────────────────────────────────────────

function DesktopProductCard({
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
      className="group flex items-center gap-2 glass rounded-lg border border-amber-400/15 hover:border-amber-400/40 bg-black/40 backdrop-blur-md px-2 py-1.5 transition-colors text-left"
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

function DesktopEmptySlot({ label }: { label: string }) {
  return (
    <Link
      href="/pricing"
      className="group flex items-center gap-2 rounded-lg border border-dashed border-amber-400/30 hover:border-amber-400/60 bg-amber-400/5 hover:bg-amber-400/10 px-2 py-1.5 transition-colors"
    >
      <div className="w-8 h-8 rounded flex items-center justify-center bg-amber-400/10 flex-shrink-0">
        <Plus className="w-4 h-4 text-amber-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-amber-300 truncate">{label}</div>
        <div className="text-[9px] text-white/50 truncate">Louer cet emplacement — 50 €/mois</div>
      </div>
    </Link>
  )
}

function MobileProductCard({
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
      className="w-full flex items-center gap-3 rounded-xl border border-amber-400/15 bg-white/5 p-2.5 text-left"
    >
      <div className="w-11 h-11 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
        {product.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-300/40">
            🛍️
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-white truncate">{product.title}</div>
        <div className="text-[11px] text-white/50 truncate">
          {product.price && <span className="text-amber-300/80 mr-1">{product.price}</span>}
          <span>{place.title}</span>
        </div>
      </div>
      <ExternalLink className="w-3 h-3 text-white/30 flex-shrink-0" />
    </button>
  )
}

function MobileEmptySlot({ label }: { label: string }) {
  return (
    <Link
      href="/pricing"
      className="w-full flex items-center gap-3 rounded-xl border border-dashed border-amber-400/30 bg-amber-400/5 p-2.5"
    >
      <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-amber-400/10 flex-shrink-0">
        <Plus className="w-5 h-5 text-amber-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-amber-300 truncate">{label}</div>
        <div className="text-[11px] text-white/60 truncate">
          Louer cet emplacement — dès 50 €/mois
        </div>
      </div>
    </Link>
  )
}
