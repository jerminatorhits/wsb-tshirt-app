import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { PRINTFUL_PRODUCT_ID, VARIANT_ID_M_BY_COLOR } from '@/lib/printful-variants'
import { getPrintfulAuthHeaders } from '@/lib/printful-headers'

const CACHE_TTL_MS = 1000 * 60 * 60 * 12

const ALLOWED_COLORS = new Set(Object.keys(VARIANT_ID_M_BY_COLOR))

type CacheEntry = { url: string; at: number }
const cacheByColor = new Map<string, CacheEntry>()

export const dynamic = 'force-dynamic'

function pickPreviewUrlFromFiles(files: any[]): string | null {
  if (!Array.isArray(files)) return null
  const flat: string[] = []

  for (const file of files) {
    if (typeof file?.preview_url === 'string') flat.push(file.preview_url)
    if (typeof file?.thumbnail_url === 'string') flat.push(file.thumbnail_url)
    if (typeof file?.url === 'string') flat.push(file.url)
    if (typeof file?.image_url === 'string') flat.push(file.image_url)
    if (typeof file?.default_mockup_url === 'string') flat.push(file.default_mockup_url)
  }

  return flat.find((u) => u.includes('front') || u.includes('preview')) || flat[0] || null
}

function pickPreviewUrlFromVariant(variant: any): string | null {
  if (!variant) return null
  const direct = [
    variant?.image,
    variant?.image_url,
    variant?.default_image_url,
    variant?.default_mockup_url,
    variant?.preview_url,
    variant?.thumbnail_url,
  ].filter((v): v is string => typeof v === 'string' && v.length > 0)

  return (
    direct.find((u) => u.includes('front') || u.includes('preview')) ||
    direct[0] ||
    pickPreviewUrlFromFiles(variant.files || [])
  )
}

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get('color')?.toLowerCase() || 'white'
    const color = ALLOWED_COLORS.has(raw) ? raw : 'white'

    const now = Date.now()
    const hit = cacheByColor.get(color)
    if (hit && now - hit.at < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, blankShirtUrl: hit.url, cached: true, color })
    }

    const printfulApiKey = process.env.PRINTFUL_API_KEY
    if (!printfulApiKey) {
      return NextResponse.json(
        { success: false, error: 'PRINTFUL_API_KEY not configured' },
        { status: 400 }
      )
    }

    const variantId = VARIANT_ID_M_BY_COLOR[color as keyof typeof VARIANT_ID_M_BY_COLOR]

    const response = await axios.get(`https://api.printful.com/products/${PRINTFUL_PRODUCT_ID}`, {
      headers: await getPrintfulAuthHeaders(),
    })

    const result = response.data?.result
    const variants = result?.variants || []
    const targetVariant = variants.find((v: any) => Number(v.id) === variantId)

    let blankShirtUrl =
      pickPreviewUrlFromVariant(targetVariant) ||
      pickPreviewUrlFromFiles(result?.files || [])

    if (!blankShirtUrl && targetVariant?.id) {
      try {
        const variantResponse = await axios.get(`https://api.printful.com/products/variant/${targetVariant.id}`, {
          headers: await getPrintfulAuthHeaders(),
        })
        const vr = variantResponse.data?.result
        blankShirtUrl = pickPreviewUrlFromVariant(vr) || pickPreviewUrlFromFiles(vr?.files || [])
      } catch {
        // continue to fallbacks
      }
    }

    if (!blankShirtUrl && color === 'white' && process.env.PRINTFUL_BLANK_SHIRT_URL) {
      blankShirtUrl = process.env.PRINTFUL_BLANK_SHIRT_URL
    }

    if (!blankShirtUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Could not find a shirt preview for this color from Printful. Check PRINTFUL_API_KEY and catalog variant IDs.',
        },
        { status: 502 }
      )
    }

    cacheByColor.set(color, { url: blankShirtUrl, at: now })

    return NextResponse.json({
      success: true,
      blankShirtUrl,
      cached: false,
      color,
    })
  } catch (error: any) {
    console.error('Error fetching blank shirt preview:', error.response?.data || error.message)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blank shirt preview from Printful' },
      { status: 500 }
    )
  }
}
