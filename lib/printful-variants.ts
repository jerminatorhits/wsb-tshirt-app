/**
 * Printful catalog product 71 = Bella + Canvas 3001 Unisex Staple T-Shirt.
 * Variant IDs from GET https://api.printful.com/products/71 (per color/size).
 * Do not change without re-fetching from the API; IDs are product-specific.
 */
export const PRINTFUL_PRODUCT_ID = 71

export type SizeKey = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL' | '5XL'

/** color (lowercase) -> size -> Printful variant_id for product 71 */
export const VARIANT_MAP: Record<string, Partial<Record<SizeKey, number>>> = {
  white: {
    XS: 9526,
    S: 4011,
    M: 4012,
    L: 4013,
    XL: 4014,
    '2XL': 4015,
    '3XL': 5294,
    '4XL': 5309,
    '5XL': 12872,
  },
  black: {
    XS: 9527,
    S: 4016,
    M: 4017,
    L: 4018,
    XL: 4019,
    '2XL': 4020,
    '3XL': 5295,
    '4XL': 5310,
    '5XL': 12871,
  },
  navy: {
    XS: 9546,
    S: 4111,
    M: 4112,
    L: 4113,
    XL: 4114,
    '2XL': 4115,
    '3XL': 12874,
    '4XL': 12875,
    '5XL': 12873,
  },
  /** Dark Grey Heather (product 71) */
  gray: {
    XS: 9564,
    S: 8460,
    M: 8461,
    L: 8462,
    XL: 8463,
    '2XL': 8464,
    '3XL': 8465,
    '4XL': 8466,
    '5XL': 12879,
  },
  red: {
    XS: 9552,
    S: 4141,
    M: 4142,
    L: 4143,
    XL: 4144,
    '2XL': 4145,
    '3XL': 5304,
    '4XL': 5319,
    '5XL': 12877,
  },
}

/** Variant ID for size M by color (for mockups / default size) */
export const VARIANT_ID_M_BY_COLOR: Record<string, number> = {
  white: 4012,
  black: 4017,
  navy: 4112,
  gray: 8461,
  red: 4142,
}

export function getVariantId(color: string, size: string): number | undefined {
  const key = color.toLowerCase()
  const sizes = VARIANT_MAP[key]
  if (!sizes) return undefined
  return sizes[size as SizeKey]
}
