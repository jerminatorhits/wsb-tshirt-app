import { NextRequest, NextResponse } from 'next/server'
import { getCachedDesign, saveDesignToCache } from '@/lib/cache'
import { checkRateLimit } from '@/lib/rate-limit'
import { basicAbuseCheck } from '@/lib/abuse-protection'

// Pollinations.ai - Free AI Image Generator
// Get your API key at https://enter.pollinations.ai (sign in with GitHub)
// With API key: No rate limits! Without: ~60 second cooldown between requests

export async function POST(request: NextRequest) {
  const abuse = basicAbuseCheck(request)
  if (!abuse.ok) {
    return NextResponse.json(
      {
        success: false,
        error: 'Request blocked',
      },
      { status: 400 }
    )
  }

  const rl = checkRateLimit(request, {
    key: 'generate-design',
    windowMs: 60_000,
    max: 8,
  })
  if (!rl.ok) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many design generations. Please wait a moment and try again.',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      }
    )
  }

  const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY
  // Parse request body
  let topic = 'Trending Topic'
  
  try {
    const requestBody = await request.json()
    topic = requestBody.topic || topic
  } catch {
    // If parsing fails, use default topic
  }

  if (!topic || topic === 'Trending Topic') {
    return NextResponse.json(
      { error: 'Topic is required' },
      { status: 400 }
    )
  }

  // Check cache first - cached results bypass rate limits!
  const cachedDesign = await getCachedDesign(topic)
  if (cachedDesign) {
    return NextResponse.json({
      success: true,
      design: cachedDesign,
      provider: 'cached',
      fromCache: true,
    })
  }

  // Generate a prompt for the graphic design (NOT a t-shirt mockup)
  const designPrompt = `${topic}, graphic design artwork, bold modern streetwear style, vibrant colors, clean edges, standalone design for merchandise printing, no mockup, no clothing, white background`

  console.log('Generating image with Pollinations.ai...')
  console.log('API Key configured:', !!POLLINATIONS_API_KEY)
  console.log('Prompt:', designPrompt)
  
  if (!POLLINATIONS_API_KEY) {
    console.log('⚠️ No POLLINATIONS_API_KEY - using anonymous tier (rate limited)')
    console.log('Get your free API key at: https://enter.pollinations.ai')
  }

  try {
    // Pollinations.ai has a simple URL-based API
    const encodedPrompt = encodeURIComponent(designPrompt)
    
    // Add parameters for better quality
    const seed = Math.floor(Math.random() * 1000000)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`

    // Actually fetch the image to detect rate limits
    console.log('Fetching image from Pollinations...', POLLINATIONS_API_KEY ? '(with API key)' : '(anonymous)')
    
    // Build headers - include API key if available for no rate limits
    const headers: Record<string, string> = {}
    if (POLLINATIONS_API_KEY) {
      headers['Authorization'] = `Bearer ${POLLINATIONS_API_KEY}`
    }
    
    const imageResponse = await fetch(imageUrl, {
      headers,
      signal: AbortSignal.timeout(120000), // 2 minute timeout for generation
    })

    // Check for rate limit in response headers or text
    const contentType = imageResponse.headers.get('content-type') || ''
    
    // If it's not an image, it might be a rate limit error
    if (!contentType.includes('image')) {
      const errorText = await imageResponse.text()
      console.log('Non-image response:', errorText)
      
      // Try to extract wait time from error message
      const waitMatch = errorText.match(/after (\d+) seconds/i)
      const waitSeconds = waitMatch ? parseInt(waitMatch[1]) : 60
      
      return NextResponse.json({
        success: false,
        error: 'Rate limited by Pollinations',
        rateLimited: true,
        waitSeconds: waitSeconds,
        message: `Pollinations.ai rate limit - please wait ${waitSeconds} seconds. Get a free API key at enter.pollinations.ai to remove limits!`,
        needsApiKey: !POLLINATIONS_API_KEY,
      }, { status: 429 })
    }

    // Check if response is actually an error image (Pollinations returns images with error text)
    // We'll check the response size - error images are typically small
    const imageBuffer = await imageResponse.arrayBuffer()
    
    // If the image is very small (< 10KB), it might be an error placeholder
    if (imageBuffer.byteLength < 10000) {
      // Try to detect if this is a rate limit by checking the raw bytes for text
      const text = new TextDecoder().decode(imageBuffer.slice(0, 500))
      if (text.includes('too many requests') || text.includes('rate limit')) {
        const waitMatch = text.match(/after (\d+) seconds/i)
        const waitSeconds = waitMatch ? parseInt(waitMatch[1]) : 60
        
        return NextResponse.json({
          success: false,
          error: 'Rate limited by Pollinations',
          rateLimited: true,
          waitSeconds: waitSeconds,
          message: `Pollinations.ai rate limit - please wait ${waitSeconds} seconds.`,
        }, { status: 429 })
      }
    }

    // Convert to base64 for caching
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const dataUrl = `data:${contentType};base64,${base64Image}`
    
    console.log('Pollinations.ai success! Image size:', imageBuffer.byteLength, 'bytes')

    const design = {
      id: `design-${Date.now()}`,
      topic,
      imageUrl: dataUrl, // Store as base64 data URL for reliable caching
      prompt: designPrompt,
      createdAt: new Date().toISOString(),
      provider: 'pollinations',
    }

    // Save to cache for future use
    await saveDesignToCache(design)

    return NextResponse.json({
      success: true,
      design,
      provider: 'pollinations',
    })
  } catch (error: any) {
    console.error('Pollinations.ai error:', error)
    
    // Check if it's a timeout error
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Image generation timed out',
        details: 'Pollinations.ai took too long to respond. Please try again.',
      }, { status: 504 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate image with Pollinations.ai',
      details: error.message,
    }, { status: 500 })
  }
}
