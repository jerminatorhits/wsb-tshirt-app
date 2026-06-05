import axios from 'axios'
import { buildPrintfulOrderFiles, getPrintfulVariantId } from '@/lib/printful-print-files'
import { getPrintfulAuthHeaders } from '@/lib/printful-headers'
import {
  PRINTFUL_MUG_PRODUCT_ID,
  parseProductType,
  type ProductType,
} from '@/lib/products'
import { PRINTFUL_PRODUCT_ID } from '@/lib/printful-variants'

export type GenerateMockupInput = {
  imageUrl: string
  productType?: ProductType
  color?: string
  size?: string
  appBaseUrl?: string
}

export type GenerateMockupResult =
  | { success: true; mockupUrl: string; variantId: number; productType: ProductType }
  | { success: false; error: string; rateLimited?: boolean; waitSeconds?: number }

type MockupExtra = { option?: string; title?: string; url?: string }
type MockupEntry = { mockup_url?: string; extra?: MockupExtra[] }

function printfulProductId(productType: ProductType): number {
  return productType === 'mug' ? PRINTFUL_MUG_PRODUCT_ID : PRINTFUL_PRODUCT_ID
}

function pickMockupUrl(mockups: MockupEntry[] | undefined): string | null {
  const mockup = mockups?.[0]
  if (!mockup) return null
  const frontView = mockup.extra?.find(
    (e) => e.option === 'Front view' || e.title === 'Front view'
  )
  return frontView?.url || mockup.mockup_url || null
}

async function ensurePublicImageUrl(imageUrl: string, appBaseUrl: string): Promise<string> {
  if (!imageUrl.startsWith('data:')) return imageUrl

  const uploadResponse = await fetch(`${appBaseUrl}/api/upload-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  })
  const uploadData = await uploadResponse.json()
  if (uploadData.success && uploadData.imageUrl) {
    return uploadData.imageUrl as string
  }
  throw new Error(uploadData.error || 'Failed to upload design for mockup')
}

function parseRateLimit(error: unknown): { rateLimited: boolean; waitSeconds: number } {
  const err = error as { response?: { status?: number; data?: unknown }; message?: string }
  const errorString = JSON.stringify(err.response?.data || err.message || '')
  if (
    err.response?.status === 429 ||
    errorString.includes('too many requests') ||
    errorString.includes('rate limit')
  ) {
    const waitMatch = errorString.match(/after (\d+) seconds/i) || errorString.match(/(\d+) seconds/i)
    return { rateLimited: true, waitSeconds: waitMatch ? parseInt(waitMatch[1], 10) : 60 }
  }
  return { rateLimited: false, waitSeconds: 0 }
}

/** Upload design (if needed), create a Printful mockup task, poll, and return preview URL. */
export async function generatePrintfulMockup(input: GenerateMockupInput): Promise<GenerateMockupResult> {
  const productType = parseProductType(input.productType)
  const color = (input.color || 'white').toLowerCase()
  const size = input.size || (productType === 'mug' ? '11 oz' : 'M')
  const appBaseUrl = input.appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!input.imageUrl) {
    return { success: false, error: 'Image URL is required' }
  }

  if (!process.env.PRINTFUL_API_KEY) {
    return { success: false, error: 'Printful API key not configured.' }
  }

  const variantId = getPrintfulVariantId(productType, color, size)
  if (!variantId) {
    return {
      success: false,
      error: `No Printful variant for ${productType} (${size}${productType === 'shirt' ? ` / ${color}` : ''})`,
    }
  }

  let finalImageUrl: string
  try {
    finalImageUrl = await ensurePublicImageUrl(input.imageUrl, appBaseUrl)
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to upload design for mockup',
    }
  }

  const orderFiles = buildPrintfulOrderFiles(productType, finalImageUrl, size)
  const productId = printfulProductId(productType)

  try {
    const taskResponse = await axios.post(
      `https://api.printful.com/mockup-generator/create-task/${productId}`,
      {
        variant_ids: [variantId],
        format: 'jpg',
        files: orderFiles.map((file) => ({
          placement: file.type,
          image_url: file.url,
          position: file.position,
        })),
      },
      {
        headers: {
          ...(await getPrintfulAuthHeaders()),
          'Content-Type': 'application/json',
        },
      }
    )

    const taskKey = taskResponse.data?.result?.task_key as string | undefined
    if (!taskKey) {
      return { success: false, error: 'Failed to create Printful mockup task' }
    }

    const maxAttempts = 15
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const statusResponse = await axios.get(
        `https://api.printful.com/mockup-generator/task?task_key=${taskKey}`,
        { headers: await getPrintfulAuthHeaders() }
      )

      const status = statusResponse.data?.result?.status as string | undefined
      if (status === 'completed') {
        const mockupUrl = pickMockupUrl(statusResponse.data?.result?.mockups)
        if (mockupUrl) {
          return { success: true, mockupUrl, variantId, productType }
        }
        return { success: false, error: 'Printful mockup completed without image URL' }
      }
      if (status === 'failed') {
        return { success: false, error: 'Printful mockup generation failed' }
      }
    }

    return { success: false, error: 'Printful mockup generation timed out' }
  } catch (error: unknown) {
    const { rateLimited, waitSeconds } = parseRateLimit(error)
    if (rateLimited) {
      return {
        success: false,
        error: `Too many mockup requests. Try again in ${waitSeconds} seconds.`,
        rateLimited: true,
        waitSeconds,
      }
    }
    const err = error as { response?: { data?: { result?: string } }; message?: string }
    return {
      success: false,
      error: err.response?.data?.result || err.message || 'Failed to generate mockup',
    }
  }
}
