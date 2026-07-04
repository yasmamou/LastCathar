import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function PricingSuccessPage() {
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-gradient-to-b from-[#05060d] via-[#0a0d1a] to-[#05060d] text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="font-serif text-4xl font-semibold mb-4">Bienvenue à bord !</h1>
        <p className="text-white/70 mb-8">
          Votre abonnement est actif. Vous pouvez dès maintenant proposer vos produits sur les
          lieux qui vous inspirent.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-300 transition"
          >
            Explorer le globe
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition"
          >
            Voir mes plans
          </Link>
        </div>
      </div>
    </div>
  )
}
