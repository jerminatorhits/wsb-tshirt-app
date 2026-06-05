import { getVariantId } from '@/lib/printful-variants'
import {
  MUG_PRINT_SPECS,
  MUG_VARIANT_MAP,
  isMugSize,
  type MugSizeKey,
  type ProductType,
} from '@/lib/products'

export type PrintfulOrderFile = {
  type: string
  url: string
  position: {
    area_width: number
    area_height: number
    width: number
    height: number
    top: number
    left: number
  }
}

const SHIRT_FRONT_FILE = {
  type: 'front',
  position: {
    area_width: 1800,
    area_height: 2400,
    width: 1800,
    height: 1800,
    top: 300,
    left: 0,
  },
} as const

function mugPrintFile(imageUrl: string, size: MugSizeKey): PrintfulOrderFile {
  const spec = MUG_PRINT_SPECS[size]
  const side = Math.min(spec.areaWidth, spec.areaHeight)
  const left = Math.round((spec.areaWidth - side) / 2)
  return {
    type: spec.placement,
    url: imageUrl,
    position: {
      area_width: spec.areaWidth,
      area_height: spec.areaHeight,
      width: side,
      height: side,
      top: 0,
      left,
    },
  }
}

export function getPrintfulVariantId(
  productType: ProductType,
  color: string,
  size: string
): number | undefined {
  if (productType === 'mug') {
    if (!isMugSize(size)) return undefined
    return MUG_VARIANT_MAP[size]
  }
  return getVariantId(color, size)
}

export function buildPrintfulOrderFiles(
  productType: ProductType,
  imageUrl: string,
  size: string
): PrintfulOrderFile[] {
  if (productType === 'mug') {
    if (!isMugSize(size)) {
      throw new Error(`Invalid mug size: ${size}`)
    }
    return [mugPrintFile(imageUrl, size)]
  }
  return [{ ...SHIRT_FRONT_FILE, url: imageUrl }]
}
