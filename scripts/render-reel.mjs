// Génère la vidéo verticale (Instagram/TikTok) d'une ville.
// Usage : npm run reel -- <slug>       (ex. npm run reel -- petra-cite-rose)
import { execSync } from 'child_process'
import { mkdirSync } from 'fs'

const slug = process.argv[2] || 'cite-de-carcassonne'
mkdirSync('out', { recursive: true })
const out = `out/reel-${slug}.mp4`
const props = JSON.stringify({ placeSlug: slug })

console.log(`→ Rendu du reel « ${slug} » …`)
execSync(
  `npx remotion render remotion/index.tsx CityReel "${out}" --props='${props}'`,
  { stdio: 'inherit' },
)
console.log(`\n✓ Vidéo prête : ${out}`)
