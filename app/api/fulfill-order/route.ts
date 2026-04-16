import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import axios from 'axios'
import { getVariantId } from '@/lib/printful-variants'
import { validateShippingAddress } from '@/lib/validate-address'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, designId, imageUrl, title, size, color, quantity, shipping } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      )
    }

    if (!designId || !imageUrl || !title || !size || !color || !quantity || !shipping) {
      return NextResponse.json(
        { error: 'Missing order details' },
        { status: 400 }
      )
    }

    // Validate address before calling Printful (avoids charge + unfulfillable order)
    const validation = validateShippingAddress(shipping)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    const printfulApiKey = process.env.PRINTFUL_API_KEY

    if (!printfulApiKey) {
      return NextResponse.json(
        { error: 'Printful API key not configured' },
        { status: 500 }
      )
    }

    // Get variant ID (product 71 Bella + Canvas 3001)
    const variantId = getVariantId(color, size)
    if (variantId === undefined) {
      return NextResponse.json(
        { error: `Variant not found for size ${size} and color ${color}` },
        { status: 400 }
      )
    }

    // Handle base64 images - upload to hosting if needed
    const isDataUrl = imageUrl.startsWith('data:')
    let finalImageUrl = imageUrl

    if (isDataUrl) {
      try {
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        })
        const uploadData = await uploadResponse.json()
        if (uploadData.success && uploadData.imageUrl) {
          finalImageUrl = uploadData.imageUrl
        } else {
          throw new Error(uploadData.error || 'Failed to upload image')
        }
      } catch (uploadError: any) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to upload image: ' + uploadError.message,
          },
          { status: 500 }
        )
      }
    }

    // Create order in Printful
    const orderResponse = await axios.post(
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
            quantity: parseInt(quantity.toString()),
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

    const orderId = orderResponse.data?.result?.id

    if (!orderId) {
      return NextResponse.json(
        { error: 'Failed to create order in Printful' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId,
      printfulOrderId: orderId,
      message: 'Order fulfilled successfully!',
    })
  } catch (error: any) {
    console.error('Error fulfilling order:', error)
    console.error('Error response data:', error.response?.data)
    
    // Extract error message from Printful API response
    let errorMessage = 'Failed to fulfill order'
    
    if (error.response?.data) {
      const errorData = error.response.data
      
      // Printful returns errors in different formats
      // Check for result field first (common format: { code: 400, result: "error message" })
      if (errorData.result && typeof errorData.result === 'string') {
        errorMessage = errorData.result
      } else if (errorData.error) {
        // Sometimes error is an object with a message
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error
        } else if (errorData.error.message) {
          errorMessage = errorData.error.message
        }
      } else if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.result?.message) {
        errorMessage = errorData.result.message
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: error.response?.status || 500 }
    )
  }
}
