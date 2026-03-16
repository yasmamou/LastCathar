import { NextRequest, NextResponse } from 'next/server'
import { allPlaces } from '@/data/all-places'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const confidence = searchParams.get('confidence')
  const query = searchParams.get('q')
  const featured = searchParams.get('featured')

  let places = [...allPlaces]

  if (category) places = places.filter((p) => p.categoryPrimary === category)
  if (confidence) places = places.filter((p) => p.confidenceLevel === confidence)
  if (featured === 'true') places = places.filter((p) => p.isFeatured)
  if (query) {
    const q = query.toLowerCase()
    places = places.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.shortDescription.toLowerCase().includes(q),
    )
  }

  return NextResponse.json({ places, total: places.length })
}
