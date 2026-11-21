import { getProductPricing, type ProductType } from '@/lib/products'

/** Shared storefront copy so Buy / About / Shipping stay aligned. */
export const PROCESSING_COPY = '2–5 business days'
export const US_DELIVERY_COPY = '3–7 business days after production'
export const TRUST_LINE = '2–5 business days to make · 3–7 to deliver in the US'

/** Order by this date (inclusive) for a realistic Christmas delivery window. */
export const CHRISTMAS_ORDER_BY = '2026-12-10'
export const CHRISTMAS_ORDER_BY_LABEL = 'Dec 10'

export function formatPriceWithShipping(productType: ProductType): string {
  const { basePrice, shippingFlatRate } = getProductPricing(productType)
  return `$${basePrice.toFixed(2)} + $${shippingFlatRate.toFixed(2)} shipping`
}

export function formatShippingOnly(productType: ProductType): string {
  const { shippingFlatRate } = getProductPricing(productType)
  return `+ $${shippingFlatRate.toFixed(2)} shipping`
}

export function isBeforeChristmasCutoff(now = new Date()): boolean {
  // End of Dec 10 local (America/Los_Angeles-ish shop) — use date string compare UTC noon-safe
  const cutoff = new Date(`${CHRISTMAS_ORDER_BY}T23:59:59-08:00`)
  return now.getTime() <= cutoff.getTime()
}
