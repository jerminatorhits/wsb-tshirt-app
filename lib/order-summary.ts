import type Stripe from 'stripe'
import { parseProductType } from '@/lib/products'

export type OrderSummary = {
  orderNumber: string | null
  paymentIntentId: string
  paymentIntentShort: string
  status: 'succeeded' | string
  fulfillmentStatus: string
  printfulOrderId: string | null
  isDryRun: boolean
  item: {
    title: string
    productType: 'shirt' | 'mug'
    productLabel: string
    size: string
    color: string
    quantity: number
    imageUrl: string | null
  }
  amounts: {
    totalCents: number
    currency: string
    totalDisplay: string
    subtotalCents: number | null
    shippingCents: number | null
    taxCents: number | null
  }
  shipping: {
    name: string
    email: string
    city: string
    state: string
    country: string
    /** City, ST line for display — street omitted on public pages. */
    localityLine: string
  } | null
}

type ShippingMeta = {
  name?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

function parseShippingMeta(raw?: string | null): ShippingMeta | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as ShippingMeta
  } catch {
    return null
  }
}

function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase() || 'USD',
    }).format(cents / 100)
  } catch {
    return `$${(cents / 100).toFixed(2)}`
  }
}

/** Build a customer-safe order summary from a Stripe PaymentIntent. */
export function buildOrderSummaryFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent
): OrderSummary {
  const md = paymentIntent.metadata || {}
  const productType = parseProductType(md.productType)
  const quantity = Math.max(1, Math.floor(Number(md.quantity || '1') || 1))
  const printfulOrderId = md.printfulOrderId || null
  const shippingMeta = parseShippingMeta(md.shipping)

  const fromIntent = paymentIntent.shipping
  const name = shippingMeta?.name || fromIntent?.name || ''
  const email = shippingMeta?.email || ''
  const city = shippingMeta?.city || fromIntent?.address?.city || ''
  const state = shippingMeta?.state || fromIntent?.address?.state || ''
  const country = shippingMeta?.country || fromIntent?.address?.country || 'US'

  const localityParts = [city, state].filter(Boolean)
  const localityLine = localityParts.length
    ? `${localityParts.join(', ')}${country && country !== 'US' ? ` · ${country}` : ''}`
    : country || ''

  const totalCents = paymentIntent.amount || 0
  const currency = paymentIntent.currency || 'usd'
  const subtotalCents = md.subtotalCents != null ? Number(md.subtotalCents) : null
  const shippingCents = md.shippingCents != null ? Number(md.shippingCents) : null
  const taxCents = md.taxCents != null ? Number(md.taxCents) : null

  return {
    orderNumber: md.orderNumber || null,
    paymentIntentId: paymentIntent.id,
    paymentIntentShort: paymentIntent.id.slice(-8).toUpperCase(),
    status: paymentIntent.status,
    fulfillmentStatus: md.fulfillmentStatus || 'pending',
    printfulOrderId,
    isDryRun: Boolean(printfulOrderId?.startsWith('dry-run-') || md.fulfillmentStatus === 'dry_run'),
    item: {
      title: md.title || 'Custom merch',
      productType,
      productLabel: productType === 'mug' ? 'Mug' : 'Tee',
      size: md.size || '',
      color: md.color || '',
      quantity,
      imageUrl: md.imageUrl?.startsWith('http') ? md.imageUrl : null,
    },
    amounts: {
      totalCents,
      currency,
      totalDisplay: formatMoney(totalCents, currency),
      subtotalCents: Number.isFinite(subtotalCents as number) ? (subtotalCents as number) : null,
      shippingCents: Number.isFinite(shippingCents as number) ? (shippingCents as number) : null,
      taxCents: Number.isFinite(taxCents as number) ? (taxCents as number) : null,
    },
    shipping:
      name || email || localityLine
        ? {
            name,
            email,
            city,
            state,
            country,
            localityLine,
          }
        : null,
  }
}

export function emailsMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}
