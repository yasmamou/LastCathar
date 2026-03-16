import { NextRequest, NextResponse } from 'next/server'
import { allPlaces } from '@/data/all-places'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.toLowerCase()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const results = allPlaces
    .filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.alternateNames.some((n) => n.toLowerCase().includes(q)) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    )
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      categoryPrimary: p.categoryPrimary,
      confidenceLevel: p.confidenceLevel,
      region: p.region,
      country: p.country,
    }))

  return NextResponse.json({ results })
}
