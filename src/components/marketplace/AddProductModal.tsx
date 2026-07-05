'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { X, Plus, Loader2, ImagePlus, Link, Tag, FileText, DollarSign, CheckCircle, Eye, TrendingUp, MousePointerClick } from 'lucide-react'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  placeSlug: string
  placeTitle: string
  onOpenAuth: () => void
}

export function AddProductModal({ isOpen, onClose, placeSlug, placeTitle, onOpenAuth }: AddProductModalProps) {
  const { status } = useSession()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // When the server reports a missing subscription / no free slot (HTTP 402),
  // show a CTA to the pricing page rather than a dead-end error.
  const [needsSubscription, setNeedsSubscription] = useState(false)
  const [success, setSuccess] = useState(false)
  const [stats, setStats] = useState<{
    totalViews: number
    todayViews: number
    totalProductClicks: number
    todayProductClicks: number
  } | null>(null)

  // Fetch place stats when modal opens
  useEffect(() => {
    if (!isOpen) return
    fetch(`/api/stats?placeSlug=${encodeURIComponent(placeSlug)}`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [isOpen, placeSlug])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPrice('')
    setExternalUrl('')
    setImageUrls([''])
    setError('')
    setNeedsSubscription(false)
    setSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const addImageField = () => {
    if (imageUrls.length < 5) {
      setImageUrls([...imageUrls, ''])
    }
  }

  const updateImageUrl = (index: number, value: string) => {
    const next = [...imageUrls]
    next[index] = value
    setImageUrls(next)
  }

  const removeImageField = (index: number) => {
    if (imageUrls.length > 1) {
      setImageUrls(imageUrls.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (status !== 'authenticated') {
      onOpenAuth()
      return
    }

    if (!title.trim()) {
      setError('Le titre est requis')
      return
    }

    setLoading(true)
    setError('')
    setNeedsSubscription(false)

    try {
      const res = await fetch('/api/products/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeSlug,
          title: title.trim(),
          description: description.trim() || null,
          price: price.trim() || null,
          externalUrl: externalUrl.trim() || null,
          imageUrls: imageUrls.filter(u => u.trim()),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 402 || data.code === 'NO_SUBSCRIPTION' || data.code === 'NO_SLOTS') {
          setNeedsSubscription(true)
        }
        setError(data.error || 'Erreur lors de la soumission')
        return
      }

      setSuccess(true)
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-3 top-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-[71] glass rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="px-5 pt-6 pb-2 flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-white/90">
                  Proposer un produit
                </h2>
                <p className="text-[11px] text-white/30 mt-0.5">
                  Emplacement : <span className="text-gold-400/50">{placeTitle}</span>
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {success ? (
              <div className="px-5 py-10 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-base font-semibold text-white/80">Produit soumis !</h3>
                <p className="text-xs text-white/40 leading-relaxed max-w-xs mx-auto">
                  Votre produit est en attente de validation par notre équipe.
                  Vous recevrez une notification une fois approuvé.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-white/5 text-sm text-white/60 hover:bg-white/10 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-5 pb-6 space-y-4 mt-2">
                {/* Place stats — convince the merchant */}
                {stats && stats.totalViews > 0 && (
                  <div className="rounded-xl bg-gradient-to-r from-emerald-400/5 to-blue-400/5 border border-emerald-400/10 p-4">
                    <p className="text-[10px] tracking-wider uppercase text-emerald-400/50 font-medium mb-3">
                      Statistiques de cet emplacement
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-white/60">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-lg font-bold">{stats.totalViews.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-white/25 mt-0.5">visites totales</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-emerald-400/70">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span className="text-lg font-bold">+{stats.todayViews}</span>
                        </div>
                        <p className="text-[10px] text-white/25 mt-0.5">aujourd&apos;hui</p>
                      </div>
                      {stats.totalProductClicks > 0 && (
                        <div className="text-center col-span-2">
                          <div className="flex items-center justify-center gap-1.5 text-blue-400/70">
                            <MousePointerClick className="w-3.5 h-3.5" />
                            <span className="text-base font-bold">{stats.totalProductClicks}</span>
                            <span className="text-[10px] text-white/25">clics vers les sites vendeurs</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-white/30 mb-1.5">
                    <Tag className="w-3 h-3" /> Titre du produit *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex: Cassoulet artisanal de Castelnaudary"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-gold-400/40 transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-white/30 mb-1.5">
                    <FileText className="w-3 h-3" /> Description
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Décrivez votre produit ou service..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-gold-400/40 transition-colors resize-none"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-white/30 mb-1.5">
                    <DollarSign className="w-3 h-3" /> Prix
                  </label>
                  <input
                    type="text"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="Ex: 24,90 € ou 25 € / personne"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-gold-400/40 transition-colors"
                  />
                </div>

                {/* External URL */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-white/30 mb-1.5">
                    <Link className="w-3 h-3" /> Lien vers votre site
                  </label>
                  <input
                    type="text"
                    value={externalUrl}
                    onChange={e => setExternalUrl(e.target.value)}
                    onBlur={() => {
                      if (externalUrl && !externalUrl.startsWith('http://') && !externalUrl.startsWith('https://')) {
                        setExternalUrl('https://' + externalUrl)
                      }
                    }}
                    placeholder="www.monsite.fr ou https://monsite.fr"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-gold-400/40 transition-colors"
                  />
                </div>

                {/* Image URLs */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-white/30 mb-1.5">
                    <ImagePlus className="w-3 h-3" /> Photos (URLs)
                  </label>
                  <div className="space-y-2">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={url}
                          onChange={e => updateImageUrl(i, e.target.value)}
                          placeholder="URL de l'image (ex: imgur, unsplash...)"
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-gold-400/40 transition-colors"
                        />
                        {imageUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(i)}
                            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {imageUrls.length < 5 && (
                      <button
                        type="button"
                        onClick={addImageField}
                        className="flex items-center gap-1.5 text-[10px] text-gold-400/50 hover:text-gold-400/80 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Ajouter une image
                      </button>
                    )}
                  </div>
                </div>

                {/* Info box */}
                <div className="rounded-xl bg-gold-400/5 border border-gold-400/10 px-4 py-3">
                  <p className="text-[10px] text-gold-400/50 leading-relaxed">
                    Votre produit sera examiné par notre équipe avant publication.
                    Les emplacements sont à 50 €/mois ou 400 €/mois pour un pack de 10.
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-red-400/80 text-center">{error}</p>
                )}

                {needsSubscription && (
                  <a
                    href="/pricing"
                    className="block w-full py-2.5 rounded-xl bg-white/5 border border-gold-400/20 text-center text-sm text-gold-400/80 hover:bg-white/10 transition-colors"
                  >
                    Voir les abonnements →
                  </a>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950 font-semibold text-sm tracking-wide hover:from-gold-300 hover:to-gold-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Soumettre mon produit
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
