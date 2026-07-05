// Vérification de cohérence des épopées : chaque slug d'épopée doit exister
// dans allPlaces, les ordres doivent être uniques et complets (1..N).
// Usage: npx tsx scripts/check-epics.ts
import { EPICS } from '../src/data/epics'
import { allPlaces } from '../src/data/all-places'

const placeSlugs = new Set(allPlaces.map((p) => p.slug))
let issues = 0

for (const epic of EPICS) {
  const orders = epic.places.map((p) => p.order)
  const uniqueOrders = new Set(orders)

  // Slugs manquants dans allPlaces
  for (const ep of epic.places) {
    if (!placeSlugs.has(ep.slug)) {
      console.log(`❌ [${epic.id}] slug introuvable dans allPlaces: ${ep.slug}`)
      issues++
    }
  }

  // Ordres dupliqués
  if (uniqueOrders.size !== orders.length) {
    const dupes = orders.filter((o, i) => orders.indexOf(o) !== i)
    console.log(`❌ [${epic.id}] ordres dupliqués: ${[...new Set(dupes)].join(', ')}`)
    issues++
  }

  // Trous dans la séquence
  const sorted = [...uniqueOrders].sort((a, b) => a - b)
  const expected = Array.from({ length: sorted.length }, (_, i) => i + 1)
  if (JSON.stringify(sorted) !== JSON.stringify(expected)) {
    console.log(`⚠️  [${epic.id}] séquence d'ordres non contiguë: ${sorted.join(',')}`)
    issues++
  }

  // Slugs dupliqués dans l'épopée
  const slugSet = new Set(epic.places.map((p) => p.slug))
  if (slugSet.size !== epic.places.length) {
    console.log(`❌ [${epic.id}] slugs dupliqués dans l'épopée`)
    issues++
  }
}

console.log(`\n${EPICS.length} épopées, ${EPICS.reduce((s, e) => s + e.places.length, 0)} étapes vérifiées.`)
if (issues === 0) console.log('✓ Aucune incohérence.')
else console.log(`${issues} problème(s) trouvé(s).`)
process.exit(issues > 0 ? 1 : 0)
