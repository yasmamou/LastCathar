// Guides audio narrés (voix grave, générés via scripts/generate-audio-guides.sh)
// Fichiers servis depuis public/audio-guides/<slug>.m4a

export interface AudioGuide {
  slug: string
  file: string
  title: string
  // Durée approximative en secondes (affichage avant metadata)
  duration: number
}

const GUIDES: AudioGuide[] = [
  {
    slug: 'cite-de-carcassonne',
    file: '/audio-guides/cite-de-carcassonne.m4a',
    title: 'La cité aux 52 tours',
    duration: 60,
  },
  {
    slug: 'chateau-de-montsegur',
    file: '/audio-guides/chateau-de-montsegur.m4a',
    title: 'Le dernier bûcher',
    duration: 57,
  },
  {
    slug: 'chateau-de-peyrepertuse',
    file: '/audio-guides/chateau-de-peyrepertuse.m4a',
    title: 'La Carcassonne céleste',
    duration: 60,
  },
  {
    slug: 'chateau-de-queribus',
    file: '/audio-guides/chateau-de-queribus.m4a',
    title: 'Le dernier refuge',
    duration: 59,
  },
  {
    slug: 'minerve',
    file: '/audio-guides/minerve.m4a',
    title: 'La mémoire de l\'eau et du feu',
    duration: 63,
  },
  {
    slug: 'rennes-le-chateau',
    file: '/audio-guides/rennes-le-chateau.m4a',
    title: 'Le secret de l\'abbé Saunière',
    duration: 77,
  },
]

const GUIDE_MAP = new Map(GUIDES.map((g) => [g.slug, g]))

export function getAudioGuide(slug: string): AudioGuide | undefined {
  return GUIDE_MAP.get(slug)
}
