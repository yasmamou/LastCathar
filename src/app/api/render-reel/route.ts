import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { allPlaces } from '@/data/all-places'

export const dynamic = 'force-dynamic'

// File d'attente de rendu. Le site (Vercel) crée/consulte les demandes ; un
// worker local (npm run render:worker) les rend et dépose la vidéo sur Vercel
// Blob. Le site ne rend rien lui-même (serverless = pas de navigateur).

type Lang = 'fr' | 'en'
const validSlug = (slug: string) => /^[a-z0-9-]+$/.test(slug) && allPlaces.some((p) => p.slug === slug)

// POST { slug, lang } — crée (ou réutilise) une demande de rendu
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const slug = body?.slug
  const lang: Lang = body?.lang === 'en' ? 'en' : 'fr'
  if (!slug || typeof slug !== 'string' || !validSlug(slug)) {
    return NextResponse.json({ error: 'Lieu invalide' }, { status: 400 })
  }

  const existing = await prisma.renderJob.findUnique({ where: { slug_lang: { slug, lang } } })

  // Déjà rendu → renvoie le lien
  if (existing?.status === 'done' && existing.videoUrl) {
    return NextResponse.json({ status: 'done', url: existing.videoUrl })
  }
  // En cours → ne relance pas
  if (existing?.status === 'rendering') {
    return NextResponse.json({ status: 'rendering' })
  }

  // Crée / remet en file d'attente
  const job = await prisma.renderJob.upsert({
    where: { slug_lang: { slug, lang } },
    create: { slug, lang, status: 'pending' },
    update: { status: 'pending', error: null },
  })
  return NextResponse.json({ status: job.status })
}

// GET ?slug&lang — état de la demande (polling)
export async function GET(request: Request) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug') || ''
  const lang: Lang = url.searchParams.get('lang') === 'en' ? 'en' : 'fr'
  if (!validSlug(slug)) return NextResponse.json({ status: 'idle' })

  const job = await prisma.renderJob.findUnique({ where: { slug_lang: { slug, lang } } })
  if (!job) return NextResponse.json({ status: 'idle' })
  return NextResponse.json({
    status: job.status,
    url: job.videoUrl ?? undefined,
    error: job.error ?? undefined,
  })
}
