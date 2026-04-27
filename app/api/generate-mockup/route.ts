import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { PRINTFUL_PRODUCT_ID, VARIANT_ID_M_BY_COLOR } from '@/lib/printful-variants'
import { getPrintfulAuthHeaders } from '@/lib/printful-headers'
import { checkRateLimit } from '@/lib/rate-limit'
import { basicAbuseCheck } from '@/lib/abuse-protection'

// Product 71 = Bella + Canvas 3001 Unisex Staple T-Shirt
const TSHIRT_PRODUCT_ID = PRINTFUL_PRODUCT_ID

export async function POST(request: NextRequest) {
  try {
    const abuse = basicAbuseCheck(request)
    if (!abuse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request blocked',
          mockupUrl: null,
        },
        { status: 400 }
      )
    }

    const rl = checkRateLimit(request, {
      key: 'generate-mockup',
      windowMs: 60_000,
      max: 10,
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

    const { imageUrl, color = 'white' } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    const printfulApiKey = process.env.PRINTFUL_API_KEY

    if (!printfulApiKey) {
      // Return a message if Printful is not configured
      return NextResponse.json({
        success: false,
        error: 'Printful API key not configured. Add PRINTFUL_API_KEY to your .env file to generate product mockups.',
        mockupUrl: null,
      })
    }

    const variantId = VARIANT_ID_M_BY_COLOR[color] ?? VARIANT_ID_M_BY_COLOR.white

    // Handle base64 images - need to upload first
    let finalImageUrl = imageUrl
    if (imageUrl.startsWith('data:')) {
      try {
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        })
        const uploadData = await uploadResponse.json()
        if (uploadData.success && uploadData.imageUrl) {
          finalImageUrl = uploadData.imageUrl
        } else {
          throw new Error(uploadData.error || 'Failed to upload image')
        }
      } catch (uploadError: any) {
        return NextResponse.json({
          success: false,
          error: 'Failed to upload image for mockup: ' + uploadError.message,
          mockupUrl: null,
        })
      }
    }

    // Create mockup generation task
    const taskResponse = await axios.post(
      'https://api.printful.com/mockup-generator/create-task/' + TSHIRT_PRODUCT_ID,
      {
        variant_ids: [variantId],
        format: 'jpg',
        files: [
          {
            placement: 'front',
            image_url: finalImageUrl,
            position: {
              area_width: 1800,
              area_height: 2400,
              width: 1800,
              height: 1800,
              top: 300,
              left: 0,
            },
          },
        ],
      },
      {
        headers: {
          ...getPrintfulAuthHeaders(),
          'Content-Type': 'application/json',
        },
      }
    )

    const taskKey = taskResponse.data?.result?.task_key

    if (!taskKey) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create mockup task',
        mockupUrl: null,
      })
    }

    // Poll for task completion (max 30 seconds)
    let mockupUrl = null
    let attempts = 0
    const maxAttempts = 15

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds between polls
      
      const statusResponse = await axios.get(
        `https://api.printful.com/mockup-generator/task?task_key=${taskKey}`,
        {
          headers: getPrintfulAuthHeaders(),
        }
      )

      const status = statusResponse.data?.result?.status

      if (status === 'completed') {
        const mockups = statusResponse.data?.result?.mockups
        if (mockups && mockups.length > 0) {
          // Get the first mockup URL
          mockupUrl = mockups[0]?.mockup_url || mockups[0]?.extra?.[0]?.url
        }
        break
      } else if (status === 'failed') {
        return NextResponse.json({
          success: false,
          error: 'Mockup generation failed',
          mockupUrl: null,
        })
      }

      attempts++
    }

    if (!mockupUrl) {
      return NextResponse.json({
        success: false,
        error: 'Mockup generation timed out',
        mockupUrl: null,
      })
    }

    return NextResponse.json({
      success: true,
      mockupUrl,
      variantId,
      color,
    })
  } catch (error: any) {
    console.error('Error generating mockup:', error)
    console.error('Error response:', error.response?.data)
    
    // Check for rate limit errors from Printful
    const errorMessage = error.response?.data?.result || error.message || 'Failed to generate mockup'
    const errorString = JSON.stringify(error.response?.data || error.message || '')
    
    // Check if it's a rate limit error
    if (errorString.includes('too many requests') || errorString.includes('rate limit') || error.response?.status === 429) {
      // Try to extract wait time from error message
      const waitMatch = errorString.match(/after (\d+) seconds/i) || errorString.match(/(\d+) seconds/i)
      const waitSeconds = waitMatch ? parseInt(waitMatch[1]) : 60
      
      return NextResponse.json({
        success: false,
        error: 'You\'ve recently sent too many requests. Please try again after ' + waitSeconds + ' seconds.',
        rateLimited: true,
        waitSeconds: waitSeconds,
        mockupUrl: null,
      }, { status: 429 })
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      mockupUrl: null,
    })
  }
}

