'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Check, Sparkles, ArrowLeft, Loader2 } from 'lucide-react'
import { PLANS, type PlanKey } from '@/lib/stripe'

const PLAN_ORDER: PlanKey[] = ['SINGLE', 'PACK_10']

export default function PricingPage() {
  const { status } = useSession()
  const [loading, setLoading] = useState<PlanKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout(plan: PlanKey) {
    setError(null)
    if (status !== 'authenticated') {
      setError('Connectez-vous pour souscrire un abonnement.')
      return
    }
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Erreur de création du paiement')
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gradient-to-b from-[#05060d] via-[#0a0d1a] to-[#05060d] text-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au globe
        </Link>

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs uppercase tracking-widest text-amber-300 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Vitrines marchands
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-semibold tracking-tight mb-4">
            Faites découvrir votre commerce
            <br />
            <span className="text-amber-300">au cœur des lieux légendaires</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/70">
            Vos produits, vos services, votre boutique s&apos;affichent dans la fiche des lieux où vos
            clients rêvent déjà de se rendre. Résiliable à tout moment, aucun engagement.
          </p>
        </div>

        {error && (
          <div className="mx-auto max-w-md mb-8 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
            {status !== 'authenticated' && (
              <>
                {' — '}
                <Link href="/" className="underline">
                  Retour à l&apos;accueil pour vous connecter
                </Link>
              </>
            )}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {PLAN_ORDER.map((key, idx) => {
            const plan = PLANS[key]
            const highlighted = idx === 1
            return (
              <div
                key={key}
                className={`relative rounded-2xl border p-8 backdrop-blur-sm transition ${
                  highlighted
                    ? 'border-amber-400/50 bg-amber-400/5 shadow-[0_0_60px_-15px_rgba(251,191,36,0.3)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-black">
                    Meilleure valeur
                  </div>
                )}

                <h2 className="font-serif text-2xl font-semibold mb-1">{plan.name}</h2>
                <p className="text-sm text-white/60 mb-6">{plan.tagline}</p>

                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{plan.priceMonthly} €</span>
                  <span className="text-white/50">/ mois</span>
                </div>

                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-white/80">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(key)}
                  disabled={loading !== null || status === 'loading'}
                  className={`w-full rounded-lg py-3 text-sm font-semibold transition ${
                    highlighted
                      ? 'bg-amber-400 text-black hover:bg-amber-300'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === key ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirection…
                    </span>
                  ) : status !== 'authenticated' ? (
                    'Se connecter pour souscrire'
                  ) : (
                    `Souscrire — ${plan.priceMonthly} €/mois`
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-16 text-center text-sm text-white/50">
          <p>
            Paiement sécurisé par Stripe. Aucune donnée bancaire n&apos;est stockée sur Last Cathar.
          </p>
          <p className="mt-2">
            Déjà abonné ?{' '}
            <button
              onClick={async () => {
                const res = await fetch('/api/stripe/portal', { method: 'POST' })
                const data = await res.json()
                if (data.url) window.location.href = data.url
                else setError(data.error ?? 'Erreur portail')
              }}
              className="text-amber-300 underline hover:text-amber-200"
            >
              Gérer mon abonnement
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
