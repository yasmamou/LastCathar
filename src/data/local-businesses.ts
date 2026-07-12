// Vrais commerces / promotions locales d'un lieu — affichés dans « Découvertes
// locales » (panneau) et dans la visite guidée. Source éditoriale, sans alcool.

import carcassonne from './carcassonne-businesses.json'
import type { GuideLang } from './audio-guides'

export interface LocalBusiness {
  id: string
  name: string
  tag: Record<GuideLang, string>
  price: Record<GuideLang, string>
  url: string
  image: string
}

const BY_PLACE = new Map<string, LocalBusiness[]>([
  [carcassonne.placeSlug, carcassonne.businesses as LocalBusiness[]],
])

export function getBusinessesForPlace(placeSlug: string): LocalBusiness[] {
  return BY_PLACE.get(placeSlug) ?? []
}
