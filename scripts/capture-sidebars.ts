/**
 * Capture screenshots of the PlaceDetailPanel sidebar for each place in an epic.
 * Usage: npx tsx scripts/capture-sidebars.ts <epic-id>
 * Output: out/sidebars/<epic-id>/<slug>.png
 */
import { chromium } from 'playwright'
import { EPICS } from '../src/data/epics'
import { allPlaces } from '../src/data/all-places'
import * as fs from 'fs'
import * as path from 'path'

const SITE_URL = 'https://last-cathar.vercel.app'
const epicId = process.argv[2] || 'croisade-cathare'

async function main() {
  const epic = EPICS.find(e => e.id === epicId)
  if (!epic) {
    console.error(`Epic "${epicId}" not found. Available: ${EPICS.map(e => e.id).join(', ')}`)
    process.exit(1)
  }

  const outDir = path.join('out', 'sidebars', epicId)
  fs.mkdirSync(outDir, { recursive: true })

  console.log(`Capturing ${epic.places.length} sidebars for "${epic.title}"...`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  })

  for (let i = 0; i < epic.places.length; i++) {
    const ep = epic.places[i]
    const place = allPlaces.find(p => p.slug === ep.slug)
    if (!place) {
      console.log(`  [${i + 1}/${epic.places.length}] SKIP: ${ep.slug} (not found)`)
      continue
    }

    console.log(`  [${i + 1}/${epic.places.length}] ${place.title}...`)

    // Fresh page for each place to avoid state issues
    const page = await context.newPage()

    try {
      // Load the site
      await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 60000 })
      await page.waitForTimeout(5000) // wait for intro animation

      // Click on the search bar
      const searchInput = page.locator('input[type="text"]').first()
      await searchInput.waitFor({ timeout: 10000 })
      await searchInput.click()
      await page.waitForTimeout(500)

      // Type the place title to search
      const searchTerm = place.title.length > 20 ? place.title.slice(0, 20) : place.title
      await searchInput.fill(searchTerm)
      await page.waitForTimeout(1500) // wait for results

      // Click the search result
      const resultItem = page.locator(`text="${place.title}"`).first()
      if (await resultItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await resultItem.click()
      } else {
        // Try shorter search
        await searchInput.fill(place.title.split(' ').slice(0, 2).join(' '))
        await page.waitForTimeout(1500)
        const resultItem2 = page.locator(`text="${place.title}"`).first()
        if (await resultItem2.isVisible({ timeout: 3000 }).catch(() => false)) {
          await resultItem2.click()
        } else {
          console.log(`    ✗ Could not find "${place.title}" in search`)
          await page.close()
          continue
        }
      }

      // Wait for sidebar panel to fully render
      await page.waitForTimeout(3000)

      // The sidebar is the panel on the right — find the scrollable panel
      // PlaceDetailPanel has class "overflow-y-auto" and is the glass panel
      const sidebar = page.locator('.overflow-y-auto').last()

      if (await sidebar.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sidebar.screenshot({
          path: path.join(outDir, `${ep.slug}.png`),
        })
        console.log(`    ✓ Saved ${ep.slug}.png`)
      } else {
        // Try full page screenshot as fallback, crop right side
        console.log(`    ✗ Sidebar not found, taking right-panel screenshot`)
        await page.screenshot({
          path: path.join(outDir, `${ep.slug}.png`),
          clip: { x: 1500, y: 0, width: 420, height: 1080 },
        })
        console.log(`    ~ Saved ${ep.slug}.png (cropped)`)
      }
    } catch (err) {
      console.log(`    ✗ Error: ${(err as Error).message}`)
    }

    await page.close()
  }

  await browser.close()
  console.log(`\nDone! Screenshots saved in ${outDir}/`)
}

main().catch(console.error)
