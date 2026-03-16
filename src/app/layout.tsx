import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Last Cathar — Treasures, Myths & Hidden Stories',
  description: 'Explore treasures, myths and hidden stories across the world on an immersive 3D globe.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="/cesium/Widgets/widgets.css"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
