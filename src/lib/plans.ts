// Pure plan data, safe to import from client components.
// (Price IDs live in src/lib/stripe.ts — server-only, they read env vars.)

export type PlanKey = 'SINGLE' | 'PACK_10'

export interface PlanInfo {
  key: PlanKey
  name: string
  tagline: string
  slots: number
  priceMonthly: number
  features: string[]
}

export const PLAN_INFO: Record<PlanKey, PlanInfo> = {
  SINGLE: {
    key: 'SINGLE',
    name: 'Vitrine unique',
    tagline: 'Un emplacement sur un lieu de votre choix',
    slots: 1,
    priceMonthly: 50,
    features: [
      '1 emplacement produit sur 1 lieu',
      "Statistiques vues + clics en temps réel",
      'Modification illimitée du contenu',
      'Résiliable à tout moment',
    ],
  },
  PACK_10: {
    key: 'PACK_10',
    name: 'Pack Marchand',
    tagline: '10 emplacements — économie de 100 €/mois',
    slots: 10,
    priceMonthly: 400,
    features: [
      '10 emplacements sur les lieux de votre choix',
      "Statistiques détaillées + export CSV",
      'Support prioritaire',
      'Placement mis en avant dans la sidebar',
      'Résiliable à tout moment',
    ],
  },
}
