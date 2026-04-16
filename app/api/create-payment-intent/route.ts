import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { validateShippingAddress } from '@/lib/validate-address'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const { amount, shipping, orderDetails } = await request.json()

    if (!amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Shipping info is optional for express checkout (Apple Pay/Google Pay provide it)
    const shippingData = shipping || {}

    // Validate address before creating PaymentIntent so we don't charge for unfulfillable orders
    if (shippingData.address || shippingData.zip) {
      const validation = validateShippingAddress(shippingData)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error: 'Stripe not configured. Add STRIPE_SECRET_KEY to .env file.',
        },
        { status: 400 }
      )
    }

    // Create Payment Intent with all payment methods enabled
    // This enables card, Apple Pay, Google Pay, and other available methods
    // Note: Link is disabled to avoid showing optional email/phone fields
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Already in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      // Explicitly disable Link to prevent optional fields from showing
      payment_method_configuration: undefined, // Use default config
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
      // Apple Pay, Google Pay, Link, and other express payment methods are automatically
      // available when automatic_payment_methods is enabled and the customer's device supports them
      // Note: We don't store imageUrl in metadata because it can be very large (base64 images)
      // The imageUrl will be retrieved from the design when fulfilling the order
      metadata: {
        shipping: JSON.stringify(shippingData),
        designId: orderDetails?.designId || '',
        title: orderDetails?.title || '',
        size: orderDetails?.size || '',
        color: orderDetails?.color || '',
        quantity: orderDetails?.quantity?.toString() || '1',
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to create payment intent',
      },
      { status: 500 }
    )
  }
}

