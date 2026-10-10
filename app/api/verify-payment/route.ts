import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { assertStripeKeysSafeForRuntime } from '@/lib/env-safety'
import { buildOrderSummaryFromPaymentIntent } from '@/lib/order-summary'

assertStripeKeysSafeForRuntime()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    assertStripeKeysSafeForRuntime()
    const { paymentIntentId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment Intent ID is required' }, { status: 400 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({
        success: false,
        error: `Payment status: ${paymentIntent.status}`,
      })
    }

    const order = buildOrderSummaryFromPaymentIntent(paymentIntent)

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      fulfillmentStatus: order.fulfillmentStatus,
      printfulOrderId: order.printfulOrderId,
      order,
    })
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to verify payment',
      },
      { status: 500 }
    )
  }
}
