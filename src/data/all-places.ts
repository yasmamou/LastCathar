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

export const allPlaces: PlaceEntry[] = [
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
]
