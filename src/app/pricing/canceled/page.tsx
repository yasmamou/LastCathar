import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function PricingCanceledPage() {
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gradient-to-b from-[#05060d] via-[#0a0d1a] to-[#05060d] text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-6">
          <XCircle className="w-8 h-8 text-white/60" />
        </div>
        <h1 className="font-serif text-4xl font-semibold mb-4">Paiement annulé</h1>
        <p className="text-white/70 mb-8">
          Aucun montant n&apos;a été débité. Vous pouvez reprendre l&apos;inscription quand vous le souhaitez.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/pricing"
            className="rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-300 transition"
          >
            Revenir aux offres
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition"
          >
            Retour au globe
          </Link>
        </div>
      </div>
    </div>
  )
}
