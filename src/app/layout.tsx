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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#05060d" />
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
