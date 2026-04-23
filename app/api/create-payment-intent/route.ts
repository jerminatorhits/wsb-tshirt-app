import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { validateShippingAddress } from '@/lib/validate-address'
import { checkRateLimit } from '@/lib/rate-limit'
import { getRequestId, jsonWithRequestId, logEvent } from '@/lib/observability'
import { basicAbuseCheck } from '@/lib/abuse-protection'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

async function normalizeImageUrlForMetadata(imageUrl: string): Promise<string> {
  if (!imageUrl || !imageUrl.startsWith('data:')) return imageUrl || ''

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const uploadResponse = await fetch(`${baseUrl}/api/upload-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  })
  const uploadData = await uploadResponse.json()
  if (!uploadData?.success || !uploadData?.imageUrl) {
    throw new Error(uploadData?.error || 'Failed to upload image')
  }
  return String(uploadData.imageUrl)
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  try {
    logEvent('info', 'payment_intent.create.requested', { requestId, route: '/api/create-payment-intent' })
    const abuse = basicAbuseCheck(request)
    if (!abuse.ok) {
      logEvent('warn', 'payment_intent.create.abuse_blocked', { requestId, reason: abuse.reason })
      return jsonWithRequestId({ error: 'Request blocked' }, requestId, { status: 400 })
    }
    const rl = checkRateLimit(request, {
      key: 'create-payment-intent',
      windowMs: 60_000,
      max: 20,
    })
    if (!rl.ok) {
      logEvent('warn', 'payment_intent.create.rate_limited', {
        requestId,
        retryAfterSeconds: rl.retryAfterSeconds,
      })
      return jsonWithRequestId(
        { error: 'Too many payment attempts. Please try again shortly.' },
        requestId,
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        }
      )
    }

    const { amount, shipping, orderDetails } = await request.json()

    if (!amount) {
      return jsonWithRequestId(
        { error: 'Missing required fields' },
        requestId,
        { status: 400 }
      )
    }

    // Shipping may be empty when wallets collect it later; if any field is set, require a full valid address
    const shippingData = shipping || {}
    const hasAnyShipping = ['name', 'email', 'address', 'city', 'state', 'zip'].some(
      (k) => (shippingData as Record<string, string>)[k]?.toString().trim()
    )
    if (hasAnyShipping) {
      const validation = validateShippingAddress(shippingData)
      if (!validation.valid) {
        return jsonWithRequestId(
          { error: validation.error },
          requestId,
          { status: 400 }
        )
      }
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonWithRequestId(
        {
          error: 'Stripe not configured. Add STRIPE_SECRET_KEY to .env file.',
        },
        requestId,
        { status: 400 }
      )
    }

    const metadataImageUrl = await normalizeImageUrlForMetadata(orderDetails?.imageUrl || '')

    // Create a card-only PaymentIntent for the card form.
    // Apple Pay / Google Pay are still supported through Payment Request (wallet tokens map to card).
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Already in cents
      currency: 'usd',
      payment_method_types: ['card'],
      // Request shipping address from Apple Pay/Google Pay
      // This allows express payment methods to provide shipping info automatically
      // Only include shipping if we have address data, otherwise let Apple Pay/Google Pay provide it
      ...(shippingData.address ? {
        shipping: {
          address: {
            line1: shippingData.address || '',
            city: shippingData.city || '',
            state: shippingData.state || '',
            postal_code: shippingData.zip || '',
            country: shippingData.country || 'US',
          },
          name: shippingData.name || '',
        },
      } : {}),
      // Note: We don't store imageUrl in metadata because it can be very large (base64 images)
      // The imageUrl will be retrieved from the design when fulfilling the order
      metadata: {
        shipping: JSON.stringify(shippingData),
        designId: orderDetails?.designId || '',
        imageUrl: metadataImageUrl,
        title: orderDetails?.title || '',
        size: orderDetails?.size || '',
        color: orderDetails?.color || '',
        quantity: orderDetails?.quantity?.toString() || '1',
        fulfillmentStatus: 'pending',
      },
    })

    logEvent('info', 'payment_intent.create.succeeded', {
      requestId,
      paymentIntentId: paymentIntent.id,
      amount,
    })
    return jsonWithRequestId(
      {
        clientSecret: paymentIntent.client_secret,
      },
      requestId
    )
  } catch (error: any) {
    logEvent('error', 'payment_intent.create.failed', {
      requestId,
      error: error?.message || 'Unknown error',
    })
    return jsonWithRequestId(
      {
        error: error.message || 'Failed to create payment intent',
      },
      requestId,
      { status: 500 }
    )
  }
}

