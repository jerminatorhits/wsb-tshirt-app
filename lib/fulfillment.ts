import Stripe from 'stripe'
import axios from 'axios'
import { getVariantId } from '@/lib/printful-variants'
import { getPrintfulAuthHeaders } from '@/lib/printful-headers'
import { validateShippingAddress } from '@/lib/validate-address'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

type ShippingInfo = {
  name: string
  email: string
  address: string
  city: string
  state: string
  zip: string
  country: string
}

type OrderInfo = {
  designId: string
  imageUrl: string
  title: string
  size: string
  color: string
  quantity: number
}

type FulfillResult =
  | { success: true; orderId: string; alreadyFulfilled: boolean }
  | { success: false; status: number; error: string }

function parseShipping(metadataShipping?: string | null): ShippingInfo | null {
  if (!metadataShipping) return null
  try {
    return JSON.parse(metadataShipping) as ShippingInfo
  } catch {
    return null
  }
}

function getOrderInfoFromPaymentIntent(paymentIntent: Stripe.PaymentIntent): OrderInfo | null {
  const md = paymentIntent.metadata || {}
  const quantity = Number(md.quantity || '1')
  if (!md.designId || !md.imageUrl || !md.title || !md.size || !md.color || !Number.isFinite(quantity)) {
    return null
  }
  return {
    designId: md.designId,
    imageUrl: md.imageUrl,
    title: md.title,
    size: md.size,
    color: md.color,
    quantity: Math.max(1, Math.floor(quantity)),
  }
}

function getShippingFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  overrideShipping?: ShippingInfo
): ShippingInfo | null {
  if (overrideShipping) return overrideShipping
  const fromMetadata = parseShipping(paymentIntent.metadata?.shipping)
  if (fromMetadata) return fromMetadata

  const fromIntent = paymentIntent.shipping
  if (!fromIntent?.address) return null
  return {
    name: fromIntent.name || '',
    email: '',
    address: fromIntent.address.line1 || '',
    city: fromIntent.address.city || '',
    state: fromIntent.address.state || '',
    zip: fromIntent.address.postal_code || '',
    country: fromIntent.address.country || 'US',
  }
}

async function resolveImageUrl(imageUrl: string): Promise<{ success: true; imageUrl: string } | { success: false; error: string }> {
  if (!imageUrl.startsWith('data:')) {
    return { success: true, imageUrl }
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const uploadResponse = await fetch(`${baseUrl}/api/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    })
    const uploadData = await uploadResponse.json()
    if (uploadData.success && uploadData.imageUrl) {
      return { success: true, imageUrl: uploadData.imageUrl }
    }
    return { success: false, error: uploadData.error || 'Failed to upload image' }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to upload image' }
  }
}

export async function fulfillFromPaymentIntent(
  paymentIntentId: string,
  overrideShipping?: ShippingInfo
): Promise<FulfillResult> {
  if (!paymentIntentId) {
    return { success: false, status: 400, error: 'Payment Intent ID is required' }
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { success: false, status: 500, error: 'Stripe not configured' }
  }
  if (!process.env.PRINTFUL_API_KEY) {
    return { success: false, status: 500, error: 'Printful API key not configured' }
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (paymentIntent.status !== 'succeeded') {
    return { success: false, status: 400, error: `Payment status is ${paymentIntent.status}` }
  }

  const existingOrderId = paymentIntent.metadata?.printfulOrderId
  if (existingOrderId) {
    return { success: true, orderId: existingOrderId, alreadyFulfilled: true }
  }

  const orderInfo = getOrderInfoFromPaymentIntent(paymentIntent)
  if (!orderInfo) {
    return { success: false, status: 400, error: 'Payment metadata missing required order details' }
  }

  const shipping = getShippingFromPaymentIntent(paymentIntent, overrideShipping)
  if (!shipping) {
    return { success: false, status: 400, error: 'Shipping address is required for fulfillment' }
  }
  const validation = validateShippingAddress(shipping)
  if (!validation.valid) {
    return { success: false, status: 400, error: validation.error || 'Invalid shipping address' }
  }

  const variantId = getVariantId(orderInfo.color, orderInfo.size)
  if (variantId === undefined) {
    return {
      success: false,
      status: 400,
      error: `Variant not found for size ${orderInfo.size} and color ${orderInfo.color}`,
    }
  }

  const imageResult = await resolveImageUrl(orderInfo.imageUrl)
  if (!imageResult.success) {
    return { success: false, status: 500, error: imageResult.error }
  }

  // Another fulfillment path (e.g. webhook) may have finished while we resolved the image.
  const paymentIntentFresh = await stripe.paymentIntents.retrieve(paymentIntentId)
  const concurrentOrderId = paymentIntentFresh.metadata?.printfulOrderId
  if (concurrentOrderId) {
    return { success: true, orderId: String(concurrentOrderId), alreadyFulfilled: true }
  }

  try {
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
            quantity: orderInfo.quantity,
            files: [
              {
                type: 'front',
                url: imageResult.imageUrl,
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
          ...(await getPrintfulAuthHeaders()),
          'Content-Type': 'application/json',
        },
      }
    )

    const orderId = orderResponse.data?.result?.id
    if (!orderId) {
      return { success: false, status: 500, error: 'Failed to create order in Printful' }
    }

    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        ...paymentIntent.metadata,
        printfulOrderId: String(orderId),
        fulfillmentStatus: 'fulfilled',
      },
    })

    return { success: true, orderId: String(orderId), alreadyFulfilled: false }
  } catch (error: any) {
    const data = error?.response?.data
    let errorMessage = 'Failed to fulfill order'
    if (data?.result && typeof data.result === 'string') errorMessage = data.result
    else if (typeof data?.error === 'string') errorMessage = data.error
    else if (data?.error?.message) errorMessage = data.error.message
    else if (data?.message) errorMessage = data.message
    else if (error?.message) errorMessage = error.message

    if (/store_id/i.test(errorMessage) && !process.env.PRINTFUL_STORE_ID?.trim()) {
      errorMessage +=
        ' Add PRINTFUL_STORE_ID (numeric store id from Printful → wsbtees → Store settings) to Vercel, or use a store-scoped API key from that store.'
    }

    return { success: false, status: error?.response?.status || 500, error: errorMessage }
  }
}
