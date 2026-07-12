import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { existsSync, mkdirSync, statSync } from 'fs'
import path from 'path'
import { allPlaces } from '@/data/all-places'
import { buildReelContent } from '@/lib/reel-content'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Rendu vidéo local uniquement (nécessite un navigateur + le CLI Remotion + les
// voix Piper). Impossible sur Vercel (serverless).
const RENDERABLE = !process.env.VERCEL

const REELS_DIR = path.join(process.cwd(), 'public', 'reels')
const AUDIO_DIR = path.join(REELS_DIR, 'audio')

type Lang = 'fr' | 'en'
type JobStatus = 'rendering' | 'done' | 'error'
const jobs = new Map<string, { status: JobStatus; url?: string; error?: string }>()

const key = (slug: string, lang: Lang) => `${slug}.${lang}`
const outFile = (slug: string, lang: Lang) => path.join(REELS_DIR, `${slug}.${lang}.mp4`)
const publicUrl = (slug: string, lang: Lang) => `/reels/${slug}.${lang}.mp4`
const validSlug = (slug: string) => /^[a-z0-9-]+$/.test(slug) && allPlaces.some((p) => p.slug === slug)

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

async function doRender(slug: string, lang: Lang) {
  const k = key(slug, lang)
  try {
    const place = allPlaces.find((p) => p.slug === slug)!
    const { narration } = buildReelContent(place, lang)

    // 1) Voix (Piper — mêmes voix que les audioguides)
    mkdirSync(AUDIO_DIR, { recursive: true })
    const audioAbs = path.join(AUDIO_DIR, `${slug}.${lang}.m4a`)
    const audioRel = `reels/audio/${slug}.${lang}.m4a` // relatif à public/ pour staticFile
    const gen = await run('python3', ['scripts/gen-narration.py', lang, audioAbs], narration)
    if (gen.code !== 0 || !existsSync(audioAbs)) {
      jobs.set(k, { status: 'error', error: 'Voix: ' + gen.stderr.slice(-300) })
      return
    }
    const dur = await audioDuration(audioAbs)

    // 2) Rendu vidéo avec la voix + durée calée
    mkdirSync(REELS_DIR, { recursive: true })
    const props = JSON.stringify({ placeSlug: slug, lang, narrationSrc: audioRel, durationInSeconds: dur })
    const render = await run('npx', [
      'remotion', 'render', 'remotion/index.tsx', 'CityReel', outFile(slug, lang),
      `--props=${props}`, '--log=error',
    ])
    if (render.code === 0 && existsSync(outFile(slug, lang))) {
      jobs.set(k, { status: 'done', url: publicUrl(slug, lang) })
    } else {
      jobs.set(k, { status: 'error', error: render.stderr.slice(-400) || `Échec (code ${render.code})` })
    }
  } catch (e) {
    jobs.set(k, { status: 'error', error: String(e) })
  }
}

export async function POST(request: Request) {
  if (!RENDERABLE) {
    return NextResponse.json({ error: 'Rendu disponible uniquement sur le générateur local.' }, { status: 501 })
  }
  const body = await request.json().catch(() => null)
  const slug = body?.slug
  const lang: Lang = body?.lang === 'en' ? 'en' : 'fr'
  if (!slug || typeof slug !== 'string' || !validSlug(slug)) {
    return NextResponse.json({ error: 'Lieu invalide' }, { status: 400 })
  }

  if (existsSync(outFile(slug, lang))) {
    return NextResponse.json({ status: 'done', url: publicUrl(slug, lang) })
  }
  if (jobs.get(key(slug, lang))?.status === 'rendering') {
    return NextResponse.json({ status: 'rendering' })
  }

  jobs.set(key(slug, lang), { status: 'rendering' })
  void doRender(slug, lang) // async, suivi via GET
  return NextResponse.json({ status: 'rendering' })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug') || ''
  const lang: Lang = url.searchParams.get('lang') === 'en' ? 'en' : 'fr'
  if (!validSlug(slug)) return NextResponse.json({ status: 'idle' })
  if (existsSync(outFile(slug, lang))) {
    return NextResponse.json({ status: 'done', url: publicUrl(slug, lang), renderable: RENDERABLE, sizeBytes: statSync(outFile(slug, lang)).size })
  }
  return NextResponse.json({ ...(jobs.get(key(slug, lang)) ?? { status: 'idle' }), renderable: RENDERABLE })
}
