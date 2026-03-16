import { useState, useEffect } from 'react'
import { fetchWikipediaImages, WikiImage } from '@/lib/wikipedia'

interface UsePlaceImagesOptions {
  sourceLinks: string[]
  heroImageUrl: string | null
  imageUrls: string[]
}

export function useWikipediaImages({ sourceLinks, heroImageUrl, imageUrls }: UsePlaceImagesOptions) {
  const [images, setImages] = useState<WikiImage[]>([])
  const [loading, setLoading] = useState(false)

  // Build a stable key for the effect
  const key = sourceLinks.join(',') + '|' + (heroImageUrl || '') + '|' + imageUrls.join(',')

  useEffect(() => {
    let cancelled = false

    // Start with manual images (always first, they're curated)
    const manual: WikiImage[] = []
    if (heroImageUrl) {
      manual.push({ url: heroImageUrl, thumb: heroImageUrl, title: 'Photo', attribution: 'Wikimedia Commons' })
    }
    for (const url of imageUrls) {
      if (url !== heroImageUrl) {
        manual.push({ url, thumb: url, title: 'Photo', attribution: 'Wikimedia Commons' })
      }
    }

    // If we have manual images, show them immediately
    if (manual.length > 0) {
      setImages(manual)
    }

    // Then fetch Wikipedia images in background
    const wikiLink = sourceLinks.find((l) => l.includes('wikipedia.org'))
    if (!wikiLink) {
      if (manual.length === 0) setImages([])
      return
    }

    setLoading(true)
    fetchWikipediaImages(sourceLinks).then((wikiImages) => {
      if (cancelled) return

      // Merge: manual first, then Wikipedia (deduplicated)
      const seen = new Set(manual.map((m) => m.thumb))
      const merged = [...manual]
      for (const img of wikiImages) {
        if (!seen.has(img.thumb)) {
          seen.add(img.thumb)
          merged.push(img)
        }
      }
      setImages(merged.slice(0, 6))
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return { images, loading }
}
