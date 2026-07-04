import { ImageResponse } from 'next/og'

export const runtime = 'edge'

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
          background: 'radial-gradient(circle at 30% 30%, #1a1e33 0%, #05060d 70%)',
          borderRadius: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 300,
            fontFamily: 'serif',
            fontWeight: 600,
            color: '#e2b650',
            letterSpacing: -16,
            textShadow: '0 0 80px rgba(226,182,80,0.5)',
          }}
        >
          LC
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  )
}
