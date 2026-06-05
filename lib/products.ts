/** Product catalog: Printful IDs, pricing, and fulfillment helpers. */

export type ProductType = 'shirt' | 'mug'

export type MugSizeKey = '11 oz' | '15 oz' | '20 oz'

export const MUG_SIZES: MugSizeKey[] = ['11 oz', '15 oz', '20 oz']

/** Printful catalog product 19 = White Glossy Mug */
export const PRINTFUL_MUG_PRODUCT_ID = 19

/** Printful variant IDs from GET /products/19 */
export const MUG_VARIANT_MAP: Record<MugSizeKey, number> = {
  '11 oz': 1320,
  '15 oz': 4830,
  '20 oz': 16586,
}

/** Mug sublimation print area specs from GET /mockup-generator/printfiles/19 */
export const MUG_PRINT_SPECS: Record<
  MugSizeKey,
  { areaWidth: number; areaHeight: number; placement: 'default' }
> = {
  '11 oz': { areaWidth: 2700, areaHeight: 1050, placement: 'default' },
  '15 oz': { areaWidth: 2700, areaHeight: 1140, placement: 'default' },
  '20 oz': { areaWidth: 3071, areaHeight: 1205, placement: 'default' },
}

export function isMugSize(size: string): size is MugSizeKey {
  return size === '11 oz' || size === '15 oz' || size === '20 oz'
}

export function getProductPricing(productType: ProductType): {
  basePrice: number
  shippingFlatRate: number
} {
  if (productType === 'mug') {
    return { basePrice: 17.99, shippingFlatRate: 4.99 }
  }
  return { basePrice: 24.99, shippingFlatRate: 4.99 }
}

export function parseProductType(value: string | null | undefined): ProductType {
  return value === 'mug' ? 'mug' : 'shirt'
}
