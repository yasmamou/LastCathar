import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Maskable icons: content must stay within the 80% safe zone (centered)
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#05060d',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 220,
            fontFamily: 'serif',
            fontWeight: 600,
            color: '#e2b650',
            letterSpacing: -12,
            textShadow: '0 0 60px rgba(226,182,80,0.5)',
          }}
        >
          LC
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  )
}
