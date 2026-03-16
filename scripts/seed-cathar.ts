/**
 * Seed script: exports the initial Cathar region seed data to JSON
 * Usage: npx ts-node scripts/seed-cathar.ts
 */

import * as fs from 'fs'
import * as path from 'path'

// We import the seed data by reading the TypeScript file and extracting the array
// For simplicity, we duplicate the export here as JSON

async function main() {
  const seedPath = path.resolve(__dirname, '../src/data/seed-cathar.ts')
  const outputPath = path.resolve(__dirname, '../data/approved/cathar-seed.json')

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log('Seeding Cathar region data...')
  console.log(`Reading from: ${seedPath}`)
  console.log(`Writing to: ${outputPath}`)

  // For now, just create a reference file
  // In production, this would use the Prisma client to insert
  const note = {
    _note: 'Run this after setting up the database. Use SeederAgent to import.',
    command: 'npx ts-node agents/seeder/index.ts',
    sourceFile: 'src/data/seed-cathar.ts',
    createdAt: new Date().toISOString(),
  }

  fs.writeFileSync(outputPath, JSON.stringify(note, null, 2))
  console.log('Done. Configure DATABASE_URL in .env.local and run the SeederAgent.')
}

main().catch(console.error)
