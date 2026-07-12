// Worker de rendu (tourne en LOCAL) : lit les demandes en attente créées par le
// site Vercel, génère la voix + la vidéo, et dépose le MP4 sur Vercel Blob.
// Usage : npm run render:worker
import { readFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'
import { spawn } from 'child_process'

// Charge .env.local (DATABASE_URL, BLOB_READ_WRITE_TOKEN) avant Prisma
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'
import { allPlaces } from '../src/data/all-places'
import { buildReelContent } from '../src/lib/reel-content'

const prisma = new PrismaClient()
const REELS_DIR = path.join(process.cwd(), 'public', 'reels')
const AUDIO_DIR = path.join(REELS_DIR, 'audio')

function run(cmd: string, args: string[], input?: string): Promise<{ code: number; stderr: string; stdout: string }> {
  return new Promise((resolve) => {
    const c = spawn(cmd, args, { cwd: process.cwd(), env: process.env })
    let stderr = '', stdout = ''
    c.stderr?.on('data', (d) => (stderr += d.toString()))
    c.stdout?.on('data', (d) => (stdout += d.toString()))
    if (input !== undefined) { c.stdin?.write(input); c.stdin?.end() }
    c.on('close', (code) => resolve({ code: code ?? 1, stderr, stdout }))
    c.on('error', (e) => resolve({ code: 1, stderr: String(e), stdout }))
  })
}

async function audioDuration(file: string): Promise<number> {
  const r = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file])
  const d = parseFloat(r.stdout.trim())
  return Number.isFinite(d) ? d : 22
}

async function renderAndUpload(slug: string, lang: 'fr' | 'en'): Promise<string> {
  const place = allPlaces.find((p) => p.slug === slug)
  if (!place) throw new Error('Lieu inconnu')
  const { narration } = buildReelContent(place, lang)

  // 1) Voix Piper
  mkdirSync(AUDIO_DIR, { recursive: true })
  const audioAbs = path.join(AUDIO_DIR, `${slug}.${lang}.m4a`)
  const audioRel = `reels/audio/${slug}.${lang}.m4a`
  const gen = await run('python3', ['scripts/gen-narration.py', lang, audioAbs], narration)
  if (gen.code !== 0 || !existsSync(audioAbs)) throw new Error('voix: ' + gen.stderr.slice(-200))
  const dur = await audioDuration(audioAbs)

  // 2) Rendu vidéo
  mkdirSync(REELS_DIR, { recursive: true })
  const outFile = path.join(REELS_DIR, `${slug}.${lang}.mp4`)
  const props = JSON.stringify({ placeSlug: slug, lang, narrationSrc: audioRel, durationInSeconds: dur })
  const render = await run('npx', ['remotion', 'render', 'remotion/index.tsx', 'CityReel', outFile, `--props=${props}`, '--log=error'])
  if (render.code !== 0 || !existsSync(outFile)) throw new Error('rendu: ' + render.stderr.slice(-300))

  // 3) Dépose sur Vercel Blob (lien public permanent)
  const data = readFileSync(outFile)
  const blob = await put(`reels/${slug}.${lang}.mp4`, data, {
    access: 'public',
    contentType: 'video/mp4',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  return blob.url
}

async function loop() {
  console.log('🎬 Worker de rendu démarré. En attente de demandes…')
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const job = await prisma.renderJob.findFirst({ where: { status: 'pending' }, orderBy: { createdAt: 'asc' } })
    if (!job) {
      await new Promise((r) => setTimeout(r, 3000))
      continue
    }
    await prisma.renderJob.update({ where: { id: job.id }, data: { status: 'rendering' } })
    console.log(`▶ Rendu ${job.slug} (${job.lang})…`)
    try {
      const url = await renderAndUpload(job.slug, job.lang as 'fr' | 'en')
      await prisma.renderJob.update({ where: { id: job.id }, data: { status: 'done', videoUrl: url, error: null } })
      console.log(`✓ Terminé : ${url}`)
    } catch (e) {
      await prisma.renderJob.update({ where: { id: job.id }, data: { status: 'error', error: String(e).slice(0, 500) } })
      console.log(`✗ Échec : ${String(e).slice(0, 200)}`)
    }
  }
}

loop().catch((e) => { console.error(e); process.exit(1) })
