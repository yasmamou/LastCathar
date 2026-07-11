import { PlaceEntry } from '@/types/places'
import { seedCatharPlaces } from './seed-cathar'
import { seedMaghrebExtraPlaces } from './seed-maghreb-extra'
import { seedLegendPlaces } from './seed-legends'
import { seedEuropePlaces } from './seed-europe'
import { seedWorldPlaces } from './seed-world'
import { seedMediterraneanPlaces } from './seed-mediterranean'
import { seedMysteryPlaces } from './seed-mysteries'
import { seedAsiaPlaces } from './seed-asia'
import { seedAmericasPlaces } from './seed-americas'
import { seedAfricaExtraPlaces } from './seed-africa-extra'
import { seedTreasurePlaces } from './seed-treasures'
import { seedExtraPlaces } from './seed-extra'
import { seedBatch6Places } from './seed-batch6'
// Pending batches:
// import { seedBatch1Places } from './seed-batch1'
// import { seedBatch2Places } from './seed-batch2'
// import { seedBatch3Places } from './seed-batch3'
import { seedBatch4Places } from './seed-batch4'
import { seedBatch5Places } from './seed-batch5'
import { seedCelticLegendsPlaces } from './seed-celtic-legends'
import { seedSudFrancePlaces } from './seed-sud-france'
import { seedAtlantisPlaces } from './seed-atlantis'
import { seedEpicsNewPlaces } from './seed-epics-new'
import { seedBerberesPlaces } from './seed-berberes'
import { seedSciencePlaces } from './seed-science'

import imageOverrides from './place-image-overrides.json'

const rawPlaces: PlaceEntry[] = [
  ...seedCatharPlaces,
  ...seedMaghrebExtraPlaces,
  ...seedLegendPlaces,
  ...seedEuropePlaces,
  ...seedWorldPlaces,
  ...seedMediterraneanPlaces,
  ...seedMysteryPlaces,
  ...seedAsiaPlaces,
  ...seedAmericasPlaces,
  ...seedAfricaExtraPlaces,
  ...seedTreasurePlaces,
  ...seedExtraPlaces,
  ...seedBatch6Places,
  // ...seedBatch1Places,
  // ...seedBatch2Places,
  // ...seedBatch3Places,
  ...seedBatch4Places,
  ...seedBatch5Places,
  ...seedCelticLegendsPlaces,
  ...seedSudFrancePlaces,
  ...seedAtlantisPlaces,
  ...seedEpicsNewPlaces,
  ...seedBerberesPlaces,
  ...seedSciencePlaces,
]

// Applique les images explicites (place-image-overrides.json) aux lieux dont
// l'article Wikipédia n'a pas d'image de tête exploitable (ex. Massacre de
// Béziers → enluminure médiévale).
const overrides = imageOverrides as unknown as Record<
  string,
  { heroImageUrl?: string; imageUrls?: string[] }
>

export const allPlaces: PlaceEntry[] = rawPlaces.map((p) => {
  const o = overrides[p.slug]
  if (!o) return p
  return {
    ...p,
    heroImageUrl: p.heroImageUrl ?? o.heroImageUrl ?? null,
    imageUrls: p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls : (o.imageUrls ?? []),
  }
})
