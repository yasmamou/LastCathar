'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { ExternalLink, ShoppingBag, X, Eye, MousePointerClick, Plus } from 'lucide-react'
import { AddProductModal } from './AddProductModal'
import { getBusinessesForPlace } from '@/data/local-businesses'
import { useLang } from '@/lib/lang'

interface Product {
  id: string
  title: string
  description: string | null
  price: string | null
  imageUrls: string[]
  externalUrl: string | null
  views: number
  clicks: number
}

interface ProductCardsProps {
  placeSlug: string
  placeTitle: string
  onOpenAuth: () => void
  highlightedProductId?: string | null
}

export function ProductCards({ placeSlug, placeTitle, onOpenAuth, highlightedProductId }: ProductCardsProps) {
  const { status } = useSession()
  const [lang] = useLang()
  // Curated real local businesses for this place (e.g. Carcassonne) — shown as
  // "Découvertes locales" instead of the demo marketplace products. No alcohol.
  const businesses = getBusinessesForPlace(placeSlug)
  const [products, setProducts] = useState<Product[]>([])
  const [maxSlots, setMaxSlots] = useState(0)
  const [availableSlots, setAvailableSlots] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  // Track which highlighted products we already counted a click for, so a
  // products refetch (deps change) doesn't re-fire the same analytics click.
  const trackedClicks = useRef<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    fetch(`/api/products?placeSlug=${encodeURIComponent(placeSlug)}`)
      .then(r => r.json())
      .then(data => {
        setProducts(data.products || [])
        setMaxSlots(data.maxSlots || 0)
        setAvailableSlots(data.availableSlots || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [placeSlug])

  // Auto-open the highlighted product's detail modal once products are loaded
  useEffect(() => {
    if (!highlightedProductId || products.length === 0) return
    const target = products.find((p) => p.id === highlightedProductId)
    if (!target) return
    setSelectedProduct(target)
    // Also scroll the card into view (inside the panel's scroll container)
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-product-card="${highlightedProductId}"]`,
      )
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    // Fire-and-forget analytics click — only once per highlighted product
    if (!trackedClicks.current.has(highlightedProductId)) {
      trackedClicks.current.add(highlightedProductId)
      fetch('/api/products/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: highlightedProductId, placeSlug }),
      }).catch(() => {})
    }
  }, [highlightedProductId, products, placeSlug])

  const handleProductClick = async (product: Product) => {
    setSelectedProduct(product)
    await fetch('/api/products/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, placeSlug }),
    }).catch(() => {})
  }

  const handleVisitSite = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleAddProduct = () => {
    if (status !== 'authenticated') {
      onOpenAuth()
      return
    }
    setShowAddModal(true)
  }

  if (loading) return null

  // Always show the section — even with 0 products, show the "add" button
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5 text-gold-400/50" />
            <h3 className="text-xs tracking-widest uppercase text-gold-400/50 font-medium">
              {lang === 'en' ? 'Local finds' : 'Découvertes locales'}
            </h3>
          </div>
        </div>

        {/* Curated real local businesses (takes priority over demo products) */}
        {businesses.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {businesses.map((b, index) => (
              <motion.a
                key={b.id}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="group text-left rounded-xl overflow-hidden border border-white/5 hover:border-gold-400/25 bg-white/[0.03] hover:bg-white/[0.06] transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={b.image}
                    alt={b.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] font-medium text-white/80 leading-tight line-clamp-2">{b.name}</p>
                  <p className="text-[10px] text-white/40 leading-tight line-clamp-2 mt-0.5">{b.tag[lang]}</p>
                  <span className="flex items-center gap-1 text-[9px] text-gold-400/50 mt-1.5">
                    <ExternalLink className="w-2.5 h-2.5" />
                    {lang === 'en' ? 'Visit' : 'Découvrir'}
                  </span>
                </div>
              </motion.a>
            ))}
          </div>
        )}

        {/* Marketplace demo/paid products — only when no curated businesses */}
        {businesses.length === 0 && products.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {products.map((product, index) => {
              const isHighlighted = highlightedProductId === product.id
              return (
              <motion.button
                key={product.id}
                data-product-card={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleProductClick(product)}
                className={`group text-left rounded-xl overflow-hidden border transition-all bg-white/[0.03] hover:bg-white/[0.06] ${
                  isHighlighted
                    ? 'border-amber-400/60 ring-2 ring-amber-400/30 bg-amber-400/[0.05]'
                    : 'border-white/5 hover:border-gold-400/20'
                }`}
              >
                {product.imageUrls[0] ? (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={product.imageUrls[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-gradient-to-br from-gold-400/5 to-gold-400/10 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-gold-400/20" />
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-[11px] font-medium text-white/70 leading-tight line-clamp-2">
                    {product.title}
                  </p>
                  {product.price && (
                    <p className="text-[11px] font-semibold text-gold-400/70 mt-1">
                      {product.price}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5 text-[9px] text-white/20">
                    <ExternalLink className="w-2.5 h-2.5" />
                    Voir
                  </div>
                </div>
              </motion.button>
              )
            })}
          </div>
        )}

        {/* Add product button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: products.length * 0.1 + 0.2 }}
          onClick={handleAddProduct}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gold-400/15 hover:border-gold-400/30 text-gold-400/40 hover:text-gold-400/70 bg-gold-400/[0.02] hover:bg-gold-400/[0.05] transition-all text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          {lang === 'en' ? 'Feature your business here' : 'Proposer un produit ici'}
          {availableSlots > 0 && (
            <span className="text-[9px] text-white/20">
              · {availableSlots} {lang === 'en'
                ? `slot${availableSlots > 1 ? 's' : ''} available`
                : `emplacement${availableSlots > 1 ? 's' : ''} disponible${availableSlots > 1 ? 's' : ''}`}
            </span>
          )}
        </motion.button>
      </div>

      {/* Product detail modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-sm z-[71] glass rounded-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              {selectedProduct.imageUrls[0] && (
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={selectedProduct.imageUrls[0]}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05060d] via-transparent to-transparent" />
                </div>
              )}

              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/60 hover:text-white/90 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-white/90">
                    {selectedProduct.title}
                  </h3>
                  {selectedProduct.price && (
                    <p className="text-sm font-semibold text-gold-400 mt-1">
                      {selectedProduct.price}
                    </p>
                  )}
                </div>

                {selectedProduct.description && (
                  <p className="text-sm text-white/50 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                )}

                <div className="flex gap-3 text-[10px] text-white/20">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {selectedProduct.views} vues
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="w-3 h-3" /> {selectedProduct.clicks} clics
                  </span>
                </div>

                {selectedProduct.externalUrl && (
                  <button
                    onClick={() => handleVisitSite(selectedProduct.externalUrl!)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950 font-semibold text-sm tracking-wide hover:from-gold-300 hover:to-gold-500 transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir sur le site
                  </button>
                )}

                {selectedProduct.imageUrls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedProduct.imageUrls.slice(1).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="w-20 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add product modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        placeSlug={placeSlug}
        placeTitle={placeTitle}
        onOpenAuth={onOpenAuth}
      />
    </>
  )
}
