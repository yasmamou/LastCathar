#!/usr/bin/env npx tsx
/**
 * Sequential Pipeline Orchestrator
 *
 * Runs the agent pipeline step by step, with checkpoints between each stage.
 * Each step reads from the previous stage's output and writes to the next.
 *
 * Usage:
 *   npx tsx scripts/pipeline.ts discover --theme "celtic-legends" --region "Brittany" --count 10
 *   npx tsx scripts/pipeline.ts enrich --batch data/raw/celtic-legends.json
 *   npx tsx scripts/pipeline.ts geocode --batch data/enriched/celtic-legends.json
 *   npx tsx scripts/pipeline.ts images --batch data/enriched/celtic-legends.json
 *   npx tsx scripts/pipeline.ts qc --batch data/enriched/celtic-legends.json
 *   npx tsx scripts/pipeline.ts approve --batch data/enriched/celtic-legends.json
 *   npx tsx scripts/pipeline.ts seed --batch data/approved/celtic-legends.json
 *   npx tsx scripts/pipeline.ts status
 */

import * as fs from 'fs'
import * as path from 'path'
import { EnrichedPlaceSchema, CandidatePlaceSchema, QCReportSchema } from '../schemas/place.schema'
import type { CandidatePlace, EnrichedPlace } from '../schemas/place.schema'

const DATA_DIR = path.resolve(__dirname, '../data')
const RAW_DIR = path.join(DATA_DIR, 'raw')
const ENRICHED_DIR = path.join(DATA_DIR, 'enriched')
const APPROVED_DIR = path.join(DATA_DIR, 'approved')

// Ensure directories exist
;[RAW_DIR, ENRICHED_DIR, APPROVED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

function log(stage: string, msg: string) {
  const timestamp = new Date().toISOString().slice(11, 19)
  console.log(`[${timestamp}] [${stage}] ${msg}`)
}

function readJSON<T>(filepath: string): T {
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'))
}

function writeJSON(filepath: string, data: unknown) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
  log('IO', `Written: ${filepath} (${fs.statSync(filepath).size} bytes)`)
}

function getSlugs(): Set<string> {
  // Read existing slugs from all seed files to avoid duplicates
  const srcDataDir = path.resolve(__dirname, '../src/data')
  const slugs = new Set<string>()

  for (const file of fs.readdirSync(srcDataDir)) {
    if (file.startsWith('seed-') && file.endsWith('.ts')) {
      const content = fs.readFileSync(path.join(srcDataDir, file), 'utf-8')
      const matches = content.matchAll(/slug:\s*['"]([^'"]+)['"]/g)
      for (const match of matches) {
        slugs.add(match[1])
      }
    }
  }

  log('SLUGS', `Found ${slugs.size} existing slugs`)
  return slugs
}

// ─── STEP 1: Discovery ───
// This step is designed to be run manually or with a search API.
// It produces candidate places in data/raw/
async function discover(theme: string, region: string, count: number) {
  log('DISCOVER', `Theme: "${theme}", Region: "${region}", Count: ${count}`)

  const existingSlugs = getSlugs()
  const outputFile = path.join(RAW_DIR, `${theme}.json`)

  // Create a template for manual or API-driven discovery
  const template: CandidatePlace[] = Array.from({ length: count }, (_, i) => ({
    title: `[TODO: Place ${i + 1} - ${theme}]`,
    alternateNames: [],
    description: `[TODO: Description for ${theme} place ${i + 1} in ${region}]`,
    region: region,
    country: '[TODO]',
    keywords: [theme],
    sourceUrl: undefined,
    suggestedCategory: undefined,
  }))

  writeJSON(outputFile, {
    metadata: {
      theme,
      region,
      count,
      createdAt: new Date().toISOString(),
      status: 'template',
      existingSlugsCount: existingSlugs.size,
    },
    candidates: template,
  })

  log('DISCOVER', `Template created at ${outputFile}`)
  log('DISCOVER', `Next step: Fill in the candidates, then run: npx tsx scripts/pipeline.ts enrich --batch ${outputFile}`)
}

// ─── STEP 2: Enrich ───
// Takes raw candidates and produces enriched places
async function enrich(batchFile: string) {
  log('ENRICH', `Reading: ${batchFile}`)

  const data = readJSON<{ metadata: Record<string, unknown>; candidates: CandidatePlace[] }>(batchFile)
  const theme = (data.metadata?.theme as string) || path.basename(batchFile, '.json')

  const enriched: Partial<EnrichedPlace>[] = data.candidates.map((candidate, i) => {
    log('ENRICH', `Processing ${i + 1}/${data.candidates.length}: ${candidate.title}`)

    // Create enriched template — fill what we can from the candidate
    const slug = candidate.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    return {
      title: candidate.title,
      alternateNames: candidate.alternateNames || [],
      shortDescription: candidate.description?.slice(0, 200) || '[TODO]',
      fullStory: '[TODO: Write full story]',
      latitude: 0,
      longitude: 0,
      region: candidate.region || null,
      country: candidate.country || '[TODO]',
      continent: '[TODO]',
      locationPrecision: 'approximate' as const,
      geometryType: 'point' as const,
      categoryPrimary: candidate.suggestedCategory || 'legend',
      categorySecondary: [],
      tags: candidate.keywords || [],
      era: [],
      statusBadge: 'hidden_gem' as const,
      confidenceLevel: 'speculative' as const,
      evidenceType: [],
      sourceSummary: null,
      sourceLinks: candidate.sourceUrl ? [candidate.sourceUrl] : [],
      imageUrls: [],
      heroImageUrl: null,
      thumbnailUrl: null,
      travelInterestScore: 50,
      mysteryScore: 50,
      historicalScore: 50,
      architectureScore: 20,
      tourismScore: 40,
      localLegendScore: 60,
      isFeatured: false,
      isVerified: false,
      moderationState: 'review' as const,
      sources: [],
      images: [],
      _slug: slug,
    }
  })

  const outputFile = path.join(ENRICHED_DIR, `${theme}.json`)
  writeJSON(outputFile, {
    metadata: {
      ...data.metadata,
      enrichedAt: new Date().toISOString(),
      status: 'enriched',
      count: enriched.length,
    },
    places: enriched,
  })

  log('ENRICH', `Enriched ${enriched.length} places → ${outputFile}`)
  log('ENRICH', `Next: Review & fill TODOs, then run: npx tsx scripts/pipeline.ts qc --batch ${outputFile}`)
}

// ─── STEP 3: QC ───
// Validates enriched places against the schema
async function qc(batchFile: string) {
  log('QC', `Validating: ${batchFile}`)

  const data = readJSON<{ metadata: Record<string, unknown>; places: EnrichedPlace[] }>(batchFile)
  const results: { place: string; valid: boolean; errors: string[] }[] = []

  let passed = 0
  let failed = 0

  for (const place of data.places) {
    const result = EnrichedPlaceSchema.safeParse(place)
    if (result.success) {
      passed++
      results.push({ place: place.title, valid: true, errors: [] })
    } else {
      failed++
      const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      results.push({ place: place.title, valid: false, errors })
      log('QC', `FAIL: ${place.title} — ${errors.join('; ')}`)
    }
  }

  log('QC', `Results: ${passed} passed, ${failed} failed out of ${data.places.length}`)

  const reportFile = batchFile.replace('.json', '.qc-report.json')
  writeJSON(reportFile, { results, summary: { total: data.places.length, passed, failed } })

  if (failed === 0) {
    log('QC', `All clear! Run: npx tsx scripts/pipeline.ts approve --batch ${batchFile}`)
  } else {
    log('QC', `Fix the ${failed} failures, then re-run QC.`)
  }
}

// ─── STEP 4: Approve ───
// Moves validated places to approved
async function approve(batchFile: string) {
  log('APPROVE', `Approving: ${batchFile}`)

  const data = readJSON<{ metadata: Record<string, unknown>; places: EnrichedPlace[] }>(batchFile)
  const theme = (data.metadata?.theme as string) || path.basename(batchFile, '.json')

  // Re-validate before approving
  const validPlaces: EnrichedPlace[] = []
  for (const place of data.places) {
    const result = EnrichedPlaceSchema.safeParse(place)
    if (result.success) {
      validPlaces.push({ ...result.data, moderationState: 'approved' })
    } else {
      log('APPROVE', `Skipping invalid: ${place.title}`)
    }
  }

  const outputFile = path.join(APPROVED_DIR, `${theme}.json`)
  writeJSON(outputFile, {
    metadata: {
      ...data.metadata,
      approvedAt: new Date().toISOString(),
      status: 'approved',
      count: validPlaces.length,
    },
    places: validPlaces,
  })

  log('APPROVE', `Approved ${validPlaces.length} places → ${outputFile}`)
  log('APPROVE', `Next: npx tsx scripts/pipeline.ts seed --batch ${outputFile}`)
}

// ─── STEP 5: Seed ───
// Generates TypeScript seed file from approved places
async function seed(batchFile: string) {
  log('SEED', `Generating seed from: ${batchFile}`)

  const data = readJSON<{ metadata: Record<string, unknown>; places: EnrichedPlace[] }>(batchFile)
  const theme = (data.metadata?.theme as string) || path.basename(batchFile, '.json')
  const varName = `seed${theme.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Places`
  const filename = `seed-${theme}.ts`

  const existingSlugs = getSlugs()
  const nextId = existingSlugs.size + 1

  const entries = data.places.map((place, i) => {
    const slug = (place as Record<string, unknown>)._slug as string || place.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Skip if slug already exists
    if (existingSlugs.has(slug)) {
      log('SEED', `Skipping duplicate slug: ${slug}`)
      return null
    }

    const { sources, images, ...placeData } = place

    return `  {
    id: '${nextId + i}',
    slug: '${slug}',
    title: ${JSON.stringify(place.title)},
    alternateNames: ${JSON.stringify(place.alternateNames)},
    shortDescription: ${JSON.stringify(place.shortDescription)},
    fullStory: ${JSON.stringify(place.fullStory)},
    latitude: ${place.latitude},
    longitude: ${place.longitude},
    region: ${place.region ? JSON.stringify(place.region) : 'null'},
    country: ${JSON.stringify(place.country)},
    continent: ${JSON.stringify(place.continent)},
    locationPrecision: '${place.locationPrecision}',
    geometryType: '${place.geometryType}',
    categoryPrimary: '${place.categoryPrimary}',
    categorySecondary: ${JSON.stringify(place.categorySecondary)},
    tags: ${JSON.stringify(place.tags)},
    era: ${JSON.stringify(place.era)},
    statusBadge: '${place.statusBadge}',
    confidenceLevel: '${place.confidenceLevel}',
    evidenceType: ${JSON.stringify(place.evidenceType)},
    sourceSummary: ${place.sourceSummary ? JSON.stringify(place.sourceSummary) : 'null'},
    sourceLinks: ${JSON.stringify(place.sourceLinks)},
    imageUrls: ${JSON.stringify(place.imageUrls)},
    heroImageUrl: ${place.heroImageUrl ? JSON.stringify(place.heroImageUrl) : 'null'},
    thumbnailUrl: ${place.thumbnailUrl ? JSON.stringify(place.thumbnailUrl) : 'null'},
    travelInterestScore: ${place.travelInterestScore},
    mysteryScore: ${place.mysteryScore},
    historicalScore: ${place.historicalScore},
    architectureScore: ${place.architectureScore},
    tourismScore: ${place.tourismScore},
    localLegendScore: ${place.localLegendScore},
    isFeatured: ${place.isFeatured},
    isVerified: ${place.isVerified},
    moderationState: '${place.moderationState}',
  }`
  }).filter(Boolean)

  const tsContent = `import { PlaceEntry } from '@/types/places'

export const ${varName}: PlaceEntry[] = [
${entries.join(',\n')}
]
`

  const outputFile = path.resolve(__dirname, '../src/data', filename)
  fs.writeFileSync(outputFile, tsContent, 'utf-8')
  log('SEED', `Generated: ${outputFile} (${entries.length} places)`)
  log('SEED', `Don't forget to add the import to src/data/all-places.ts!`)
}

// ─── STEP: Status ───
function status() {
  console.log('\n=== Pipeline Status ===\n')

  for (const [label, dir] of [['RAW', RAW_DIR], ['ENRICHED', ENRICHED_DIR], ['APPROVED', APPROVED_DIR]]) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.includes('.qc-report'))
    console.log(`${label}: ${files.length} batch(es)`)
    for (const f of files) {
      const data = readJSON<{ metadata?: { status?: string; count?: number; theme?: string } }>(path.join(dir, f))
      const meta = data.metadata || {}
      console.log(`  - ${f} [${meta.status || '?'}] ${meta.count || '?'} places (theme: ${meta.theme || '?'})`)
    }
  }

  const slugs = getSlugs()
  console.log(`\nSEED FILES: ${slugs.size} total places in src/data/`)
  console.log()
}

// ─── CLI ───
const [,, command, ...args] = process.argv

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx !== -1 ? args[idx + 1] : undefined
}

async function main() {
  switch (command) {
    case 'discover': {
      const theme = getArg('theme') || 'untitled'
      const region = getArg('region') || 'World'
      const count = parseInt(getArg('count') || '10', 10)
      await discover(theme, region, count)
      break
    }
    case 'enrich': {
      const batch = getArg('batch')
      if (!batch) { console.error('Usage: pipeline enrich --batch <file>'); process.exit(1) }
      await enrich(batch)
      break
    }
    case 'qc': {
      const batch = getArg('batch')
      if (!batch) { console.error('Usage: pipeline qc --batch <file>'); process.exit(1) }
      await qc(batch)
      break
    }
    case 'approve': {
      const batch = getArg('batch')
      if (!batch) { console.error('Usage: pipeline approve --batch <file>'); process.exit(1) }
      await approve(batch)
      break
    }
    case 'seed': {
      const batch = getArg('batch')
      if (!batch) { console.error('Usage: pipeline seed --batch <file>'); process.exit(1) }
      await seed(batch)
      break
    }
    case 'status':
      status()
      break
    default:
      console.log(`
Usage: npx tsx scripts/pipeline.ts <command> [options]

Commands:
  discover  --theme <name> --region <region> --count <n>   Create discovery template
  enrich    --batch <file>                                  Enrich raw candidates
  qc        --batch <file>                                  Validate enriched places
  approve   --batch <file>                                  Move to approved
  seed      --batch <file>                                  Generate TypeScript seed
  status                                                    Show pipeline status
      `)
  }
}

main().catch(console.error)
