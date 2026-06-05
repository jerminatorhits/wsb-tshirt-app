import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getPrintfulAuthHeaders } from '@/lib/printful-headers'
import {
  MUG_VARIANT_MAP,
  PRINTFUL_MUG_PRODUCT_ID,
  isMugSize,
  parseProductType,
  type MugSizeKey,
} from '@/lib/products'
import { PRINTFUL_PRODUCT_ID, VARIANT_ID_M_BY_COLOR } from '@/lib/printful-variants'

function pickPreviewUrlFromVariant(variant: {
  image?: string
  image_url?: string
  default_image_url?: string
  default_mockup_url?: string
  preview_url?: string
  thumbnail_url?: string
  files?: Array<{ preview_url?: string; thumbnail_url?: string; url?: string }>
}): string | null {
  const flat = [
    variant?.image,
    variant?.image_url,
    variant?.default_image_url,
    variant?.default_mockup_url,
    variant?.preview_url,
    variant?.thumbnail_url,
  ].filter(Boolean) as string[]

  for (const file of variant.files || []) {
    if (file.preview_url) flat.push(file.preview_url)
    if (file.thumbnail_url) flat.push(file.thumbnail_url)
    if (file.url) flat.push(file.url)
  }

  return flat[0] || null
}

export async function GET(request: NextRequest) {
  try {
    if (!process.env.PRINTFUL_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Printful API key not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productType = parseProductType(searchParams.get('product'))
    const color = (searchParams.get('color') || 'white').toLowerCase()
    const sizeParam = searchParams.get('size') || (productType === 'mug' ? '11 oz' : 'M')

    const productId = productType === 'mug' ? PRINTFUL_MUG_PRODUCT_ID : PRINTFUL_PRODUCT_ID
    let variantId: number | undefined

    if (productType === 'mug') {
      const mugSize = isMugSize(sizeParam) ? sizeParam : ('11 oz' as MugSizeKey)
      variantId = MUG_VARIANT_MAP[mugSize]
    } else {
      variantId =
        VARIANT_ID_M_BY_COLOR[color as keyof typeof VARIANT_ID_M_BY_COLOR] ?? VARIANT_ID_M_BY_COLOR.white
    }

    const response = await axios.get(`https://api.printful.com/products/${productId}`, {
      headers: await getPrintfulAuthHeaders(),
    })

    const variants = response.data?.result?.variants || []
    const targetVariant = variants.find((v: { id: number }) => Number(v.id) === variantId)
    let blankUrl = pickPreviewUrlFromVariant(targetVariant || {})

    if (!blankUrl && targetVariant?.id) {
      try {
        const variantResponse = await axios.get(
          `https://api.printful.com/products/variant/${targetVariant.id}`,
          { headers: await getPrintfulAuthHeaders() }
        )
        blankUrl = pickPreviewUrlFromVariant(variantResponse.data?.result?.variant || {})
      } catch {
        /* fall through */
      }
    }

    if (!blankUrl) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not find a ${productType} preview from Printful.`,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      blankProductUrl: blankUrl,
      productType,
      variantId,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load product mockup'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
