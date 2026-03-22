'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { allPlaces } from '@/data/all-places'
import { PlaceEntry, ModerationState } from '@/types/places'
import { getCategoryLabel, getCategoryColor, getConfidenceLabel, getConfidenceColor } from '@/lib/categories'
import { ShoppingBag, Check, X, ExternalLink, Loader2, Lock } from 'lucide-react'

type Tab = 'places' | 'products'

interface PendingProduct {
  id: string
  title: string
  description: string | null
  price: string | null
  imageUrls: string[]
  externalUrl: string | null
  status: string
  createdAt: string
  seller: { name: string | null; email: string }
  placeSlot: { placeSlug: string }
}

export default function AdminPage() {
  const { data: session, status: authStatus } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('products')
  const [places] = useState<PlaceEntry[]>(allPlaces)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterState, setFilterState] = useState<ModerationState | 'all'>('all')
  const [products, setProducts] = useState<PendingProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const isAdmin = session?.user?.role === 'ADMIN'

  // Load pending products
  useEffect(() => {
    if (!isAdmin || activeTab !== 'products') return
    setProductsLoading(true)
    fetch('/api/admin/products')
      .then(r => r.json())
      .then(data => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setProductsLoading(false))
  }, [isAdmin, activeTab])

  const handleModerate = async (productId: string, action: 'APPROVED' | 'REJECTED') => {
    setActionLoading(productId)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, status: action }),
      })
      if (res.ok) {
        setProducts(prev => prev.map(p =>
          p.id === productId ? { ...p, status: action } : p
        ))
      }
    } catch {} finally {
      setActionLoading(null)
    }
  }

  // Places filtering
  const filtered = filterState === 'all'
    ? places
    : places.filter((p) => p.moderationState === filterState)
  const selected = places.find((p) => p.id === selectedId)

  // Auth gate
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400/40" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-midnight-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Lock className="w-10 h-10 text-white/20 mx-auto" />
          <p className="text-sm text-white/40">Accès réservé aux administrateurs</p>
          <a href="/" className="text-xs text-gold-400/50 hover:text-gold-400 transition-colors">
            &larr; Retour au globe
          </a>
        </div>
      </div>
    )
  }

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
              Administration
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <span className="px-2 py-1 rounded-full bg-gold-400/10 text-gold-400/60">ADMIN</span>
            {session?.user?.name}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'products'
                ? 'bg-gold-400/10 text-gold-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Produits à modérer
            {products.filter(p => p.status === 'REVIEW').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-medium">
                {products.filter(p => p.status === 'REVIEW').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('places')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeTab === 'places'
                ? 'bg-gold-400/10 text-gold-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            Places ({places.length})
          </button>
        </div>
      </header>

      {/* Products moderation tab */}
      {activeTab === 'products' && (
        <div className="p-6">
          {productsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-white/20" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-10 h-10 text-white/10 mx-auto" />
              <p className="text-sm text-white/30 mt-3">Aucun produit soumis</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`rounded-xl border p-5 transition-all ${
                    product.status === 'REVIEW'
                      ? 'border-gold-400/20 bg-gold-400/[0.02]'
                      : product.status === 'APPROVED'
                      ? 'border-emerald-400/20 bg-emerald-400/[0.02]'
                      : 'border-red-400/20 bg-red-400/[0.02] opacity-60'
                  }`}
                >
                  <div className="flex gap-5">
                    {/* Image */}
                    {product.imageUrls[0] && (
                      <img
                        src={product.imageUrls[0]}
                        alt={product.title}
                        className="w-28 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-white/80">{product.title}</h3>
                          <p className="text-[11px] text-white/30 mt-0.5">
                            Lieu : <span className="text-gold-400/50">{product.placeSlot.placeSlug}</span>
                            {' · '}Vendeur : {product.seller.name || product.seller.email}
                          </p>
                        </div>
                        <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          product.status === 'REVIEW' ? 'bg-amber-400/10 text-amber-400' :
                          product.status === 'APPROVED' ? 'bg-emerald-400/10 text-emerald-400' :
                          'bg-red-400/10 text-red-400'
                        }`}>
                          {product.status}
                        </span>
                      </div>

                      {product.description && (
                        <p className="text-xs text-white/40 mt-2 line-clamp-2">{product.description}</p>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        {product.price && (
                          <span className="text-xs font-medium text-gold-400/60">{product.price}</span>
                        )}
                        {product.externalUrl && (
                          <a
                            href={product.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-blue-400/50 hover:text-blue-400 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {product.externalUrl.replace(/^https?:\/\//, '').slice(0, 40)}
                          </a>
                        )}
                        <span className="text-[10px] text-white/15">
                          {new Date(product.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {product.status === 'REVIEW' && (
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleModerate(product.id, 'APPROVED')}
                          disabled={actionLoading === product.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-400/10 text-emerald-400 text-xs font-medium hover:bg-emerald-400/20 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === product.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Approuver
                        </button>
                        <button
                          onClick={() => handleModerate(product.id, 'REJECTED')}
                          disabled={actionLoading === product.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-400/10 text-red-400 text-xs font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Rejeter
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Additional images */}
                  {product.imageUrls.length > 1 && (
                    <div className="flex gap-2 mt-3">
                      {product.imageUrls.slice(1).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="w-16 h-12 rounded object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Places tab (existing) */}
      {activeTab === 'places' && (
        <div className="flex h-[calc(100vh-130px)]">
          <div className="w-1/2 border-r border-white/5 overflow-y-auto">
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
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(place.categoryPrimary) }} />
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: getConfidenceColor(place.confidenceLevel) }}>
                        {getConfidenceLabel(place.confidenceLevel)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="w-1/2 overflow-y-auto p-6">
            {selected ? (
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-semibold text-white/90">{selected.title}</h2>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Field label="Slug" value={selected.slug} />
                  <Field label="Category" value={getCategoryLabel(selected.categoryPrimary)} />
                  <Field label="Confidence" value={getConfidenceLabel(selected.confidenceLevel)} />
                  <Field label="Coordinates" value={`${selected.latitude}, ${selected.longitude}`} />
                  <Field label="Country" value={selected.country} />
                  <Field label="Featured" value={selected.isFeatured ? 'Yes' : 'No'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gold-400/50 uppercase tracking-wider">Short Description</label>
                  <p className="text-sm text-white/60">{selected.shortDescription}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gold-400/50 uppercase tracking-wider">Full Story</label>
                  <p className="text-sm text-white/50 whitespace-pre-line">{selected.fullStory}</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-white/20">Select an entry to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
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
