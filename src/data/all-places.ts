import { PlaceEntry } from '@/types/places'
import { seedCatharPlaces } from './seed-cathar'
import { seedMaghrebExtraPlaces } from './seed-maghreb-extra'
import { seedLegendPlaces } from './seed-legends'
import { seedEuropePlaces } from './seed-europe'
import { seedWorldPlaces } from './seed-world'
import { seedMediterraneanPlaces } from './seed-mediterranean'
import { seedMysteryPlaces } from './seed-mysteries'
import { seedAsiaPlaces } from './seed-asia'
// Pending:
import { seedAmericasPlaces } from './seed-americas'
import { seedAfricaExtraPlaces } from './seed-africa-extra'
import { seedTreasurePlaces } from './seed-treasures'
import { seedExtraPlaces } from './seed-extra'

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
]
