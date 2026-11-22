/**
 * Crash-week launch promo: free US shipping through the live drop window.
 * Keeps first-purchase friction low without a coupon code.
 */

export const CRASH_WEEK_PROMO_ENDS = '2026-12-01T23:59:59-08:00'
export const CRASH_WEEK_PROMO_LABEL = 'Free US shipping through Dec 1'

export function isCrashWeekFreeShipping(now = new Date()): boolean {
  return now.getTime() <= new Date(CRASH_WEEK_PROMO_ENDS).getTime()
}

/** Shipping cents after promo (0 during crash week). */
export function applyShippingPromo(shippingCents: number, now = new Date()): number {
  if (isCrashWeekFreeShipping(now) && shippingCents > 0) return 0
  return shippingCents
}
