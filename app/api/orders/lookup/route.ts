import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { assertStripeKeysSafeForRuntime } from '@/lib/env-safety'
import { checkRateLimit } from '@/lib/rate-limit'
import { isValidOrderNumberFormat, normalizeOrderNumber } from '@/lib/order-number'
import { buildOrderSummaryFromPaymentIntent, emailsMatch } from '@/lib/order-summary'

assertStripeKeysSafeForRuntime()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    assertStripeKeysSafeForRuntime()

    const rl = checkRateLimit(request, {
      key: 'orders-lookup',
      windowMs: 60_000,
      max: 10,
    })
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: 'Too many lookups. Try again shortly.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const orderNumber = normalizeOrderNumber(String(body.orderNumber || ''))
    const email = String(body.email || '').trim()

    if (!isValidOrderNumberFormat(orderNumber)) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid order number (e.g. WSB-7K4M2Q).' },
        { status: 400 }
      )
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Enter the email used at checkout.' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'Orders unavailable' }, { status: 500 })
    }

    const result = await stripe.paymentIntents.search({
      query: `metadata['orderNumber']:'${orderNumber}'`,
      limit: 5,
    })

    const match = result.data.find((pi) => {
      if (pi.status !== 'succeeded') return false
      try {
        const shipping = JSON.parse(pi.metadata?.shipping || '{}') as { email?: string }
        return emailsMatch(shipping.email || '', email)
      } catch {
        return false
      }
    })

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: 'No order found for that number and email. Check both and try again.',
        },
        { status: 404 }
      )
    }

    const order = buildOrderSummaryFromPaymentIntent(match)
    return NextResponse.json({ success: true, order })
  } catch (error: any) {
    console.error('Order lookup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Could not look up order',
      },
      { status: 500 }
    )
  }
}
