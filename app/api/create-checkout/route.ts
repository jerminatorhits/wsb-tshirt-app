import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import FormData from 'form-data'
import { getVariantId } from '@/lib/printful-variants'

export async function POST(request: NextRequest) {
  try {
    const { designId, imageUrl, title, size, color, quantity } = await request.json()

    if (!designId || !imageUrl || !title || !size || !color || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const printfulApiKey = process.env.PRINTFUL_API_KEY

    if (!printfulApiKey) {
      // Return a demo checkout URL for testing
      return NextResponse.json({
        success: true,
        checkoutUrl: '#',
        message: 'Printful API key not configured. In production, this would create a real checkout.',
        productId: `product-${Date.now()}`,
      })
    }

    // Get variant ID (product 71 Bella + Canvas 3001)
    const variantId = getVariantId(color, size)
    if (variantId === undefined) {
      return NextResponse.json(
        { error: `Variant not found for size ${size} and color ${color}` },
        { status: 400 }
      )
    }

    // For checkout, we don't need to create a product first
    // We'll create the order directly when the user completes checkout
    // This avoids the base64 image issue with product creation
    
    // Check if image is base64 and warn user
    const isDataUrl = imageUrl.startsWith('data:')
    if (isDataUrl) {
      // Base64 images will be handled in create-order endpoint
      // For now, just return success so user can proceed to shipping form
    }
    
    // Return product info for checkout (order will be created in create-order endpoint)
    return NextResponse.json({
      success: true,
      checkoutUrl: null, // We'll handle checkout on the frontend
      productId: null, // Not needed for direct orders
      variantId,
      productData: {
        name: title,
        imageUrl, // Keep original URL - will handle in create-order
        variantId,
        size,
        color,
        quantity,
        price: 24.99,
      },
      message: 'Product ready for checkout',
      isBase64: isDataUrl,
    })
  } catch (error: any) {
    console.error('Error creating checkout:', error)
    
    // If Printful API fails, return a demo URL
    if (!process.env.PRINTFUL_API_KEY) {
      return NextResponse.json({
        success: true,
        checkoutUrl: '#',
        message: 'Printful API key not configured. Configure it to enable real checkout.',
        productId: `demo-${Date.now()}`,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create checkout',
      },
      { status: 500 }
    )
  }
}

