import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkRateLimit } from '@/lib/rate-limit'
import { basicAbuseCheck } from '@/lib/abuse-protection'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

// Pricing configuration
const BASE_COST = 12.00 // Your cost from Printful (approximate)
const MARKUP_PERCENTAGE = 1.5 // 50% markup = 1.5x
const SHIPPING_COST = 4.99

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
  try {
    const abuse = basicAbuseCheck(request)
    if (!abuse.ok) {
      return NextResponse.json(
        { success: false, error: 'Request blocked' },
        { status: 400 }
      )
    }

    const rl = checkRateLimit(request, {
      key: 'create-payment',
      windowMs: 60_000,
      max: 12,
    })
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: 'Too many payment attempts. Please try again shortly.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        }
      )
    }

    const { designId, imageUrl, title, size, color, quantity, shipping } = await request.json()

    if (!designId || !imageUrl || !title || !size || !color || !quantity || !shipping) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe not configured. Add STRIPE_SECRET_KEY to .env file.',
        },
        { status: 400 }
      )
    }

    // Calculate pricing with margin
    const itemCost = BASE_COST * MARKUP_PERCENTAGE // Your selling price per item
    const subtotal = itemCost * quantity
    const shippingTotal = SHIPPING_COST
    const total = subtotal + shippingTotal

    const metadataImageUrl = await normalizeImageUrlForMetadata(imageUrl)

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title,
              description: `Custom T-shirt - ${size}, ${color}`,
              images: metadataImageUrl.startsWith('http') ? [metadataImageUrl] : [],
            },
            unit_amount: Math.round(itemCost * 100), // Convert to cents
          },
          quantity: quantity,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Shipping',
            },
            unit_amount: Math.round(shippingTotal * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?canceled=true`,
      payment_intent_data: {
        metadata: {
          designId,
          imageUrl: metadataImageUrl,
          title,
          size,
          color,
          quantity: quantity.toString(),
          shipping: JSON.stringify(shipping),
          fulfillmentStatus: 'pending',
        },
      },
      metadata: {
        designId,
        imageUrl: metadataImageUrl,
        title,
        size,
        color,
        quantity: quantity.toString(),
        shipping: JSON.stringify(shipping),
        fulfillmentStatus: 'pending',
      },
      customer_email: shipping.email,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'],
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
    })
  } catch (error: any) {
    console.error('Error creating payment session:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create payment session',
      },
      { status: 500 }
    )
  }
}

