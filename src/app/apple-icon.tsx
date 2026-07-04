import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 180, height: 180 }

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 108,
            fontFamily: 'serif',
            fontWeight: 600,
            color: '#e2b650',
            letterSpacing: -6,
            textShadow: '0 0 40px rgba(226,182,80,0.5)',
          }}
        >
          LC
        </div>
      </div>
    ),
    { ...size },
  )
}
