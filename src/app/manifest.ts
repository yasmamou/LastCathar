import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Last Cathar — Treasures, Myths & Hidden Stories',
    short_name: 'Last Cathar',
    description:
      'Explorez trésors, mythes et histoires cachées à travers le monde sur un globe 3D immersif.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#05060d',
    theme_color: '#05060d',
    lang: 'fr',
    dir: 'ltr',
    categories: ['education', 'travel', 'entertainment'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Mode Chercheur',
        short_name: 'Chercheur',
        description: "Reprendre l'épopée cathare",
        url: '/?chercheur=1',
      },
      {
        name: 'Vitrines',
        short_name: 'Vitrines',
        description: 'Découvrir les offres marchandes',
        url: '/pricing',
      },
    ],
  }
}
