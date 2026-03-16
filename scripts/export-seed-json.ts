/**
 * Export the TypeScript seed data to a clean JSON file
 * Usage: npx tsx scripts/export-seed-json.ts
 */

import { seedCatharPlaces } from '../src/data/seed-cathar'
import * as fs from 'fs'
import * as path from 'path'

const outputPath = path.resolve(__dirname, '../data/approved/cathar-places.json')
const outputDir = path.dirname(outputPath)

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

fs.writeFileSync(outputPath, JSON.stringify(seedCatharPlaces, null, 2))
console.log(`Exported ${seedCatharPlaces.length} places to ${outputPath}`)
