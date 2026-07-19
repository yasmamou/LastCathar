'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, AlertTriangle, Store, Headphones } from 'lucide-react'

type SyncState =
  | { phase: 'syncing' }
  | { phase: 'done'; plan: string; slots: number }
  | { phase: 'audio' }
  | { phase: 'error'; message: string }

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const isAudio = searchParams.get('type') === 'audio'
  const [sync, setSync] = useState<SyncState>({ phase: 'syncing' })

  // Persist the subscription server-side right away — don't rely solely on the
  // webhook (not configured in local dev, and delivery can fail in prod).
  useEffect(() => {
    if (!sessionId) {
      setSync({ phase: 'done', plan: '', slots: 0 })
      return
    }
    let cancelled = false
    fetch('/api/stripe/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (cancelled) return
        if (res.ok) {
          if (data.type === 'audio' || isAudio) setSync({ phase: 'audio' })
          else setSync({ phase: 'done', plan: data.plan, slots: data.slots })
        } else {
          setSync({ phase: 'error', message: data.error || 'Erreur de synchronisation' })
        }
      })
      .catch(() => {
        if (!cancelled) setSync({ phase: 'error', message: 'Erreur réseau' })
      })
    return () => { cancelled = true }
  }, [sessionId])

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gradient-to-b from-[#05060d] via-[#0a0d1a] to-[#05060d] text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        {sync.phase === 'syncing' ? (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-400/15 mb-6">
              <Loader2 className="w-8 h-8 text-amber-300 animate-spin" />
            </div>
            <h1 className="font-serif text-3xl font-semibold mb-4">Activation en cours…</h1>
            <p className="text-white/60">Nous confirmons votre abonnement auprès de Stripe.</p>
          </>
        ) : sync.phase === 'error' ? (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/15 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="font-serif text-3xl font-semibold mb-4">Presque !</h1>
            <p className="text-white/70 mb-2">
              Le paiement a été accepté, mais l&apos;activation automatique a échoué :
            </p>
            <p className="text-sm text-red-300/80 mb-8">{sync.message}</p>
            <p className="text-xs text-white/40 mb-8">
              Pas d&apos;inquiétude — l&apos;activation se fera aussi via Stripe. Réessayez dans
              une minute ou contactez-nous si le problème persiste.
            </p>
          </>
        ) : sync.phase === 'audio' ? (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-400/20 mb-6">
              <Headphones className="w-8 h-8 text-amber-300" />
            </div>
            <h1 className="font-serif text-4xl font-semibold mb-4">Pass Audioguides activé !</h1>
            <p className="text-white/70 mb-8">
              Tous les guides et parcours audio de Last Cathar sont désormais débloqués.
              Bonne écoute !
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="font-serif text-4xl font-semibold mb-4">Bienvenue à bord !</h1>
            <p className="text-white/70 mb-8">
              Votre abonnement est actif
              {sync.slots > 0 && (
                <> — <b className="text-amber-300">{sync.slots} emplacement{sync.slots > 1 ? 's' : ''}</b> à votre disposition</>
              )}.
              Cliquez ci-dessous pour choisir un lieu et publier votre produit.
            </p>
          </>
        )}

        {/* CTA spécifiques au parcours : l'audio renvoie à l'écoute, l'abonnement
            marchand renvoie à la vitrine / l'espace marchand. */}
        {sync.phase === 'audio' && (
          <div className="flex justify-center">
            <Link
              href="/?resume=audio"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-300 transition"
            >
              <Headphones className="w-4 h-4" />
              Reprendre l&apos;écoute
            </Link>
          </div>
        )}

        {sync.phase === 'done' && (
          <div className="flex gap-3 justify-center">
            <Link
              href="/compte?add=1"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-300 transition"
            >
              <Store className="w-4 h-4" />
              Placer mon produit
            </Link>
            <Link
              href="/compte"
              className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition"
            >
              Mon espace marchand
            </Link>
          </div>
        )}

        {sync.phase === 'error' && (
          <div className="flex justify-center">
            <Link
              href="/"
              className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition"
            >
              Retour au globe
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PricingSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  )
}
