import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { fulfillFromPaymentIntent } from '@/lib/fulfillment'
import { getRequestId, jsonWithRequestId, logEvent } from '@/lib/observability'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    logEvent('warn', 'webhook.stripe.missing_signature', { requestId })
    return jsonWithRequestId(
      { error: 'No signature' },
      requestId,
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err: any) {
    logEvent('error', 'webhook.stripe.invalid_signature', {
      requestId,
      error: err?.message || 'Webhook signature verification failed',
    })
    return jsonWithRequestId(
      { error: `Webhook Error: ${err.message}` },
      requestId,
      { status: 400 }
    )
  }

  logEvent('info', 'webhook.stripe.received', {
    requestId,
    eventType: event.type,
    eventId: event.id,
  })

  // Legacy checkout-session flow fulfillment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Fulfill the order
    try {
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id
      if (!paymentIntentId) return jsonWithRequestId({ received: true }, requestId)
      const result = await fulfillFromPaymentIntent(paymentIntentId)
      if (!result.success) {
        logEvent('error', 'webhook.stripe.checkout_session.fulfill_failed', {
          requestId,
          paymentIntentId,
          error: result.error,
          status: result.status,
        })
      }
    } catch (error: any) {
      logEvent('error', 'webhook.stripe.checkout_session.exception', {
        requestId,
        error: error?.message || 'Error fulfilling order from webhook',
      })
    }
  }

  // Primary PaymentIntent flow fallback (covers client drop-offs after payment succeeds).
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    try {
      const result = await fulfillFromPaymentIntent(paymentIntent.id)
      if (!result.success) {
        logEvent('error', 'webhook.stripe.payment_intent.fulfill_failed', {
          requestId,
          paymentIntentId: paymentIntent.id,
          error: result.error,
          status: result.status,
        })
      }
    } catch (error) {
      logEvent('error', 'webhook.stripe.payment_intent.exception', {
        requestId,
        error: (error as Error)?.message || 'Error fulfilling order from payment_intent.succeeded',
      })
    }
  }

  return jsonWithRequestId({ received: true }, requestId)
}

