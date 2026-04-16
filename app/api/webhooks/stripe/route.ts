import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import axios from 'axios'
import { getVariantId } from '@/lib/printful-variants'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
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
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Fulfill the order
    try {
      const { designId, imageUrl, title, size, color, quantity, shipping: shippingStr } = session.metadata || {}
      
      if (!imageUrl || !title || !size || !color || !quantity || !shippingStr) {
        console.error('Missing order details in session metadata')
        return NextResponse.json({ received: true })
      }

      const shipping = JSON.parse(shippingStr)
      const printfulApiKey = process.env.PRINTFUL_API_KEY

      if (!printfulApiKey) {
        console.error('Printful API key not configured')
        return NextResponse.json({ received: true })
      }

      // Handle base64 images
      let finalImageUrl = imageUrl
      if (imageUrl.startsWith('data:')) {
        try {
          const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl }),
          })
          const uploadData = await uploadResponse.json()
          if (uploadData.success && uploadData.imageUrl) {
            finalImageUrl = uploadData.imageUrl
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
        }
      }

      // Get variant ID (product 71 Bella + Canvas 3001)
      const variantId = getVariantId(color, size)
      if (variantId === undefined) {
        console.error(`Variant not found for ${size} ${color}`)
        return NextResponse.json({ received: true })
      }

      // Create Printful order
      await axios.post(
        'https://api.printful.com/orders',
        {
          recipient: {
            name: shipping.name,
            email: shipping.email,
            address1: shipping.address,
            city: shipping.city,
            state_code: shipping.state,
            country_code: shipping.country,
            zip: shipping.zip,
          },
          items: [
            {
              variant_id: variantId,
              quantity: parseInt(quantity),
              files: [
                {
                  type: 'front',
                  url: finalImageUrl,
                  position: {
                    area_width: 1800,
                    area_height: 2400,
                    width: 1800,
                    height: 1800,
                    top: 300,
                    left: 0,
                  },
                },
              ],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${printfulApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      console.log('Order fulfilled successfully via webhook')
    } catch (error: any) {
      console.error('Error fulfilling order from webhook:', error)
    }
  }

  return NextResponse.json({ received: true })
}

