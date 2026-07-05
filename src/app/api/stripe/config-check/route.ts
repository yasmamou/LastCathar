import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Reports which subscription plans are ready for checkout (Stripe price IDs are set).
// Used by /pricing to show a friendly banner when the site admin hasn't yet configured
// the Stripe products.
export async function GET() {
  return NextResponse.json({
    single: !!process.env.STRIPE_PRICE_SINGLE,
    pack10: !!process.env.STRIPE_PRICE_PACK_10,
    hasSecret: !!process.env.STRIPE_SECRET_KEY,
  })
}
