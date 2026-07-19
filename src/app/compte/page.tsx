'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Loader2, ShoppingBag, Eye, MousePointerClick, Pencil, Trash2, ExternalLink,
  Download, CreditCard, Plus, MapPin, X, Check, Store,
} from 'lucide-react'

interface MyProduct {
  id: string
  title: string
  description: string | null
  price: string | null
  externalUrl: string | null
  imageUrls: string[]
  latitude: number | null
  longitude: number | null
  status: 'REVIEW' | 'APPROVED' | 'REJECTED' | string
  views: number
  clicks: number
  placeSlug: string
  createdAt: string
}

interface SubSummary {
  active: boolean
  totalSlots: number
  usedSlots: number
  plans: string[]
  renewsAt: string | null
  canManage: boolean
}

const STATUS: Record<string, { label: string; cls: string }> = {
  REVIEW: { label: 'En revue', cls: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  APPROVED: { label: 'En ligne', cls: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  REJECTED: { label: 'Refusé', cls: 'bg-red-400/10 text-red-400 border-red-400/20' },
}

export default function ComptePage() {
  const { data: session, status: authStatus } = useSession()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<MyProduct[]>([])
  const [sub, setSub] = useState<SubSummary | null>(null)
  const [editing, setEditing] = useState<MyProduct | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/products/mine')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setProducts(d.products || []); setSub(d.subscription || null) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { if (authStatus === 'authenticated') load() }, [authStatus, load])

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ? Cela libère un emplacement.')) return
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) { setProducts((p) => p.filter((x) => x.id !== id)); load() }
  }

  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const d = await res.json()
      if (d.url) window.location.href = d.url
      else setPortalLoading(false)
    } catch { setPortalLoading(false) }
  }

  const exportCsv = () => {
    const esc = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['Titre', 'Lieu', 'Statut', 'Prix', 'Vues', 'Clics', 'Lien', 'Créé le'],
      ...products.map((p) => [
        p.title, p.placeSlug, STATUS[p.status]?.label ?? p.status, p.price ?? '',
        p.views, p.clicks, p.externalUrl ?? '', new Date(p.createdAt).toLocaleDateString('fr-FR'),
      ]),
    ]
    const csv = '﻿' + rows.map((r) => r.map(esc).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'last-cathar-produits.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (authStatus === 'loading') {
    return <Center><Loader2 className="w-8 h-8 animate-spin text-gold-400/40" /></Center>
  }
  if (authStatus !== 'authenticated') {
    return (
      <Center>
        <div className="text-center space-y-3">
          <Store className="w-10 h-10 text-white/20 mx-auto" />
          <p className="text-sm text-white/40">Connectez-vous pour accéder à votre espace marchand.</p>
          <a href="/" className="text-xs text-gold-400/50 hover:text-gold-400 transition-colors">&larr; Retour au globe</a>
        </div>
      </Center>
    )
  }

  const totalViews = products.reduce((s, p) => s + p.views, 0)
  const totalClicks = products.reduce((s, p) => s + p.clicks, 0)

  return (
    <div className="min-h-screen bg-midnight-950 text-white/80">
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="text-gold-400/60 hover:text-gold-400 transition-colors text-sm">&larr; Globe</a>
          <h1 className="font-display text-xl font-semibold text-white/90">Espace marchand</h1>
        </div>
        <div className="text-xs text-white/30">{session?.user?.name || session?.user?.email}</div>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Subscription summary */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          {sub?.active ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-emerald-400/70 font-semibold">Abonnement actif</span>
                  <span className="text-[11px] text-white/40">{sub.plans.join(' + ')}</span>
                </div>
                <p className="text-sm text-white/70">
                  <b className="text-white/90">{sub.usedSlots}</b> / {sub.totalSlots} emplacement{sub.totalSlots > 1 ? 's' : ''} utilisé{sub.usedSlots > 1 ? 's' : ''}
                  {sub.renewsAt && <span className="text-white/30"> · renouvellement {new Date(sub.renewsAt).toLocaleDateString('fr-FR')}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {sub.usedSlots < sub.totalSlots && (
                  <a href="/pricing" className="text-[11px] text-gold-400/60 hover:text-gold-400">+ Ajouter</a>
                )}
                {sub.canManage && (
                  <button onClick={openPortal} disabled={portalLoading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/70 transition-colors disabled:opacity-50">
                    {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                    Gérer mon abonnement
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white/70 font-medium">Aucun abonnement actif</p>
                <p className="text-xs text-white/40 mt-0.5">Abonnez-vous pour placer vos produits sur les lieux de votre choix.</p>
              </div>
              <a href="/pricing" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-400 text-midnight-950 font-semibold text-xs hover:bg-gold-300 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Devenir partenaire
              </a>
            </div>
          )}
        </div>

        {/* Stats + CSV */}
        {products.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex gap-5 text-xs text-white/40">
              <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {totalViews} vues</span>
              <span className="flex items-center gap-1.5"><MousePointerClick className="w-3.5 h-3.5" /> {totalClicks} clics</span>
            </div>
            <button onClick={exportCsv} className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        )}

        {/* Products */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-10 h-10 text-white/10 mx-auto" />
            <p className="text-sm text-white/30 mt-3">Vous n&apos;avez pas encore de produit.</p>
            <p className="text-xs text-white/20 mt-1">Ouvrez un lieu sur le globe et cliquez « Proposer un produit ».</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => {
              const st = STATUS[p.status] ?? { label: p.status, cls: 'bg-white/10 text-white/50 border-white/10' }
              return (
                <div key={p.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex gap-4">
                  {p.imageUrls[0]
                    ? <img src={p.imageUrls[0]} alt={p.title} className="w-24 h-20 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-24 h-20 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><ShoppingBag className="w-6 h-6 text-white/15" /></div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white/85 truncate">{p.title}</h3>
                      <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-[11px] text-white/30 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {p.placeSlug}
                      {p.price && <span className="text-gold-400/50 ml-1">· {p.price}</span>}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-white/35">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {p.views}</span>
                      <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {p.clicks}</span>
                      {p.externalUrl && (
                        <a href={p.externalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400/50 hover:text-blue-400">
                          <ExternalLink className="w-3 h-3" /> lien
                        </a>
                      )}
                    </div>
                    {p.status === 'REJECTED' && (
                      <p className="text-[10px] text-red-400/60 mt-1.5">Refusé par la modération. Modifiez le contenu pour le resoumettre.</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => setEditing(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/70 transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> Modifier
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-400/5 hover:bg-red-400/15 text-xs text-red-400/70 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Supprimer
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editing && (
        <EditModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setProducts((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)))
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-midnight-950 flex items-center justify-center">{children}</div>
}

function EditModal({ product, onClose, onSaved }: { product: MyProduct; onClose: () => void; onSaved: (p: MyProduct) => void }) {
  const [title, setTitle] = useState(product.title)
  const [description, setDescription] = useState(product.description ?? '')
  const [price, setPrice] = useState(product.price ?? '')
  const [externalUrl, setExternalUrl] = useState(product.externalUrl ?? '')
  const [images, setImages] = useState((product.imageUrls ?? []).join('\n'))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!title.trim()) { setError('Le titre est requis'); return }
    setSaving(true); setError('')
    const imageUrls = images.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 5)
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description, price, externalUrl, imageUrls }),
    })
    if (res.ok) {
      onSaved({ ...product, title: title.trim(), description, price, externalUrl, imageUrls })
    } else {
      const d = await res.json().catch(() => null)
      setError(d?.error || 'Échec de l’enregistrement'); setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4" style={{ background: 'rgba(5,6,13,0.85)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f1120] to-[#05060d] p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold text-white">Modifier le produit</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/80"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Titre"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={inputCls} /></Field>
          <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} /></Field>
          <Field label="Prix (texte libre)"><input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="ex. 12 € · à partir de 8 €" className={inputCls} /></Field>
          <Field label="Lien du site"><input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="votresite.fr" className={inputCls} /></Field>
          <Field label="Images (une URL par ligne, 5 max)"><textarea value={images} onChange={(e) => setImages(e.target.value)} rows={3} className={inputCls} /></Field>
        </div>
        {error && <p className="text-xs text-red-400/80 mt-3">{error}</p>}
        <button onClick={save} disabled={saving} className="mt-5 w-full py-3 rounded-xl bg-gold-400 text-midnight-950 font-semibold text-sm hover:bg-gold-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Enregistrer
        </button>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/25 focus:outline-none focus:border-gold-400/40'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}
