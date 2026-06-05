import { NextRequest, NextResponse } from 'next/server'
import { generatePrintfulMockup } from '@/lib/printful-mockup'
import { parseProductType } from '@/lib/products'
import { checkRateLimit } from '@/lib/rate-limit'
import { basicAbuseCheck } from '@/lib/abuse-protection'

export async function POST(request: NextRequest) {
  try {
    const abuse = basicAbuseCheck(request)
    if (!abuse.ok) {
      return NextResponse.json(
        { success: false, error: 'Request blocked', mockupUrl: null },
        { status: 400 }
      )
    }

    const rl = checkRateLimit(request, {
      key: 'generate-mockup',
      windowMs: 60_000,
      max: 12,
    })
    if (!rl.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many mockup requests. Please wait a moment and try again.',
          mockupUrl: null,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        }
      )
    }

    const body = await request.json()
    const { imageUrl, color = 'white', size, productType: rawProductType } = body
    const productType = parseProductType(rawProductType)

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const result = await generatePrintfulMockup({
      imageUrl,
      productType,
      color,
      size,
      appBaseUrl: process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          mockupUrl: null,
          rateLimited: result.rateLimited,
          waitSeconds: result.waitSeconds,
        },
        { status: result.rateLimited ? 429 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mockupUrl: result.mockupUrl,
      variantId: result.variantId,
      productType: result.productType,
      color,
      size: size || (productType === 'mug' ? '11 oz' : 'M'),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate mockup'
    console.error('Error generating mockup:', error)
    return NextResponse.json({ success: false, error: message, mockupUrl: null })
  }
}
