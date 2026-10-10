import type { ProductType } from '@/lib/products'
import type { SloganLayout } from '@/lib/slogan-design'
import { ALL_MUG_PRODUCTS } from '@/lib/mug-catalog'

/** One SKU — print art is rendered client-side from `lines`. */
export type DropProduct = {
  id: string
  slug: string
  /** Display title on the storefront */
  title: string
  /** One-line context under the title — why this piece exists */
  blurb: string
  /** Print lines (already cased for the mug) */
  lines: string[]
  /** Distinct composition so SKUs don’t share one template */
  layout: SloganLayout
  productType: ProductType
  size: string
}

export type DropCollection = {
  id: string
  slug: string
  title: string
  /** Section eyebrow — e.g. "Live drops" */
  label: string
  blurb: string
  products: DropProduct[]
}

/**
 * Full live catalog (top 10 first, then the rest of the bank).
 * Edit `lib/mug-catalog.ts` to add/remove slogans — no weekly cadence.
 */
export const CURRENT_DROP: DropCollection = {
  id: 'live',
  slug: 'live',
  title: 'Live drops',
  label: 'Live drops',
  blurb: 'Limited drops. Printed to order.',
  products: ALL_MUG_PRODUCTS,
}

/** Brand colophon stamped into the print file. */
export function dropCollectibleMark(_drop: DropCollection = CURRENT_DROP): string {
  return 'STONKMUGS'
}

export function findDropProduct(slug: string): { drop: DropCollection; product: DropProduct } | null {
  const product = CURRENT_DROP.products.find((p) => p.slug === slug)
  if (!product) return null
  return { drop: CURRENT_DROP, product }
}

export function allDropProductSlugs(): string[] {
  return CURRENT_DROP.products.map((p) => p.slug)
}
