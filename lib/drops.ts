import type { ProductType } from '@/lib/products'
import type { SloganLayout } from '@/lib/slogan-design'
import { ALL_MUG_PRODUCTS } from '@/lib/mug-catalog'
import { ARCHIVED_MUG_PRODUCTS } from '@/lib/mug-catalog-archive'

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
  /**
   * When this drop stops being buyable (ISO datetime).
   * Real scarcity — extend or replace when you ship the next batch.
   */
  endsAt?: string
  products: DropProduct[]
}

/**
 * Live drop for the Nov 2026 crash / AI unwind week.
 * Prior slogans: `lib/mug-catalog-archive.ts`.
 * Update `endsAt` when you open the next window.
 */
export const CURRENT_DROP: DropCollection = {
  id: 'crash-week-2026-11',
  slug: 'crash-week',
  title: 'Crash week',
  label: 'Crash week',
  blurb: 'Correction. Nasdaq red. AI trade melted. Print the pain.',
  // Through Cyber Monday (PT)
  endsAt: '2026-12-01T23:59:59-08:00',
  products: ALL_MUG_PRODUCTS,
}

/** Brand colophon stamped into the print file. */
export function dropCollectibleMark(_drop: DropCollection = CURRENT_DROP): string {
  return 'STONKMUGS'
}

export function findDropProduct(slug: string): { drop: DropCollection; product: DropProduct } | null {
  const live = CURRENT_DROP.products.find((p) => p.slug === slug)
  if (live) return { drop: CURRENT_DROP, product: live }

  // Old shared links still resolve to archived art (buy if drop still live window)
  const archived = ARCHIVED_MUG_PRODUCTS.find((p) => p.slug === slug)
  if (archived) {
    return {
      drop: {
        ...CURRENT_DROP,
        id: 'archive',
        slug: 'archive',
        title: 'Archive',
        label: 'Archive',
        blurb: 'From a previous drop.',
        products: [archived],
      },
      product: archived,
    }
  }
  return null
}

export function allDropProductSlugs(): string[] {
  const seen = new Set<string>()
  const slugs: string[] = []
  for (const p of [...CURRENT_DROP.products, ...ARCHIVED_MUG_PRODUCTS]) {
    if (seen.has(p.slug)) continue
    seen.add(p.slug)
    slugs.push(p.slug)
  }
  return slugs
}
