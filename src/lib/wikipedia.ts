const WIKI_API = 'https://fr.wikipedia.org/w/api.php'

export interface WikiImage {
  url: string
  thumb: string
  title: string
  attribution: string
}

function extractPageTitle(url: string): string | null {
  try {
    const match = url.match(/wikipedia\.org\/wiki\/(.+)$/)
    if (match) return decodeURIComponent(match[1])
  } catch {}
  return null
}

async function fetchMainImage(title: string, size = 800): Promise<WikiImage | null> {
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'pageimages',
    format: 'json',
    pithumbsize: String(size),
    origin: '*',
  })

  try {
    const res = await fetch(`${WIKI_API}?${params}`)
    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = Object.values(pages)[0] as any
    if (!page?.thumbnail?.source) return null
    return {
      url: page.thumbnail.source,
      thumb: page.thumbnail.source,
      title: page.title || title.replace(/_/g, ' '),
      attribution: 'Wikimedia Commons',
    }
  } catch {
    return null
  }
}

async function fetchPageImages(title: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'images',
    format: 'json',
    imlimit: '30',
    origin: '*',
  })

  try {
    const res = await fetch(`${WIKI_API}?${params}`)
    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = Object.values(pages)[0] as any
    const images: string[] = (page?.images || [])
      .map((img: { title: string }) => img.title as string)
      .filter((name: string) => {
        const lower = name.toLowerCase()
        // Only keep actual photos (jpg/jpeg/png)
        if (!lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.png')) return false
        // Exclude generic/irrelevant images
        const exclude = [
          'icon', 'logo', 'flag', 'commons', 'pictogram', 'disambig',
          'map', 'blason', 'coat_of_arms', 'armoiries', 'carte',
          'france_location', 'locator', 'red_pog', 'blue_pog',
          'increase', 'decrease', 'steady', 'arrow', 'button',
          'wiki', 'edit', 'medal', 'ribbon', 'star', 'crystal',
          'arc_de_triomphe', 'tour_eiffel', 'paris', 'louvre',
        ]
        return !exclude.some((ex) => lower.includes(ex))
      })
    return images.slice(0, 8)
  } catch {
    return []
  }
}

async function getImageUrl(fileName: string, width = 800): Promise<WikiImage | null> {
  const params = new URLSearchParams({
    action: 'query',
    titles: fileName,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: String(width),
    format: 'json',
    origin: '*',
  })

  try {
    const res = await fetch(`${WIKI_API}?${params}`)
    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = Object.values(pages)[0] as any
    const info = page?.imageinfo?.[0]
    if (!info) return null

    const meta = info.extmetadata || {}
    const artist = meta.Artist?.value?.replace(/<[^>]+>/g, '') || 'Wikimedia Commons'

    // Check image dimensions — skip tiny images (icons, thumbnails)
    const w = meta.ImageWidth?.value ? parseInt(meta.ImageWidth.value) : 999
    if (w < 200) return null

    return {
      url: info.url,
      thumb: info.thumburl || info.url,
      title: fileName.replace('File:', '').replace(/\.[^.]+$/, '').replace(/_/g, ' '),
      attribution: artist,
    }
  } catch {
    return null
  }
}

/**
 * Fetch relevant images for a place from its Wikipedia source links.
 * Manual images (heroImageUrl, imageUrls) should be added by the caller.
 */
export async function fetchWikipediaImages(sourceLinks: string[]): Promise<WikiImage[]> {
  const wikiLink = sourceLinks.find((l) => l.includes('wikipedia.org'))
  if (!wikiLink) return []

  const title = extractPageTitle(wikiLink)
  if (!title) return []

  // Fetch main image + page images in parallel
  const [mainImage, imageNames] = await Promise.all([
    fetchMainImage(title),
    fetchPageImages(title),
  ])

  // Resolve URLs for page images
  const resolved = await Promise.all(imageNames.map((name) => getImageUrl(name)))
  const images = resolved.filter((img): img is WikiImage => img !== null)

  // Deduplicate by URL
  const seen = new Set<string>()
  const unique: WikiImage[] = []

  if (mainImage) {
    seen.add(mainImage.thumb)
    unique.push(mainImage)
  }

  for (const img of images) {
    if (!seen.has(img.thumb)) {
      seen.add(img.thumb)
      unique.push(img)
    }
  }

  return unique.slice(0, 5)
}
