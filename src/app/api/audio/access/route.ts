import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AUDIO_PASS } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// GET /api/audio/access — does the signed-in user have the audio pass?
// `configured` tells the client whether the paywall can be paid at all.
export async function GET() {
  const configured = !!AUDIO_PASS.priceId
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false, hasAccess: false, configured })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { audioAccess: true },
  })
  return NextResponse.json({
    authenticated: true,
    hasAccess: !!user?.audioAccess,
    configured,
  })
}
