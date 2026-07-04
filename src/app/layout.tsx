import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { PwaProvider } from '@/components/pwa/PwaProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Last Cathar — Treasures, Myths & Hidden Stories',
  description: 'Explore treasures, myths and hidden stories across the world on an immersive 3D globe.',
  applicationName: 'Last Cathar',
  appleWebApp: {
    capable: true,
    title: 'Last Cathar',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#05060d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
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
        <PwaProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PwaProvider>
      </body>
    </html>
  )
}
