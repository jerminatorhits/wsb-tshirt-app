import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import FormData from 'form-data'
import { getVariantId } from '@/lib/printful-variants'
import { getPrintfulAuthHeaders } from '@/lib/printful-headers'

export async function POST(request: NextRequest) {
  try {
    const { designId, imageUrl, title, size, color, quantity, shipping } = await request.json()

    if (!designId || !imageUrl || !title || !size || !color || !quantity || !shipping) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const printfulApiKey = process.env.PRINTFUL_API_KEY

    if (!printfulApiKey) {
      return NextResponse.json({
        success: true,
        orderUrl: '#',
        message: 'Printful API key not configured. In production, this would create a real order.',
        orderId: `demo-order-${Date.now()}`,
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

    // Handle base64 images - Printful requires HTTP URLs for orders
    const isDataUrl = imageUrl.startsWith('data:')
    let finalImageUrl = imageUrl
    
    // If it's a base64 image, upload it to a hosting service first
    if (isDataUrl) {
      try {
        // Upload base64 image to get an HTTP URL
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl }),
        })

        const uploadData = await uploadResponse.json()
        
        if (uploadData.success && uploadData.imageUrl) {
          finalImageUrl = uploadData.imageUrl
          console.log('Image uploaded to hosting service:', finalImageUrl)
        } else {
          // Upload failed - return error with helpful message
          const errorMsg = uploadData?.error || 'Failed to upload image to hosting service'
          return NextResponse.json(
            {
              success: false,
              error: errorMsg + '. Make sure IMGBB_API_KEY is set in your .env file. Get a free key at https://api.imgbb.com/',
              needsImageHosting: true,
              solution: 'Get free ImgBB API key from https://api.imgbb.com/ and add to .env',
            },
            { status: 400 }
          )
        }
      } catch (uploadError: any) {
        console.error('Error uploading image:', uploadError)
        
        // Extract error message
        const errorMsg = uploadError.message || 'Failed to upload image to hosting service'
        
        return NextResponse.json(
          {
            success: false,
            error: errorMsg + '. Make sure IMGBB_API_KEY is set in your .env file. Get a free key at https://api.imgbb.com/',
            needsImageHosting: true,
            solution: 'Get free ImgBB API key from https://api.imgbb.com/ and add to .env',
          },
          { status: 400 }
        )
      }
    }

    // Create order directly in Printful
    // Printful requires files to be an array, and each file needs proper structure
    const orderPayload: any = {
      recipient: {
        name: shipping.name,
        email: shipping.email,
        address1: shipping.address,
        city: shipping.city,
        state_code: shipping.state,
        country_code: shipping.country,
        zip: shipping.zip,
      },
      items: [
        {
          variant_id: variantId,
          quantity: quantity,
        },
      ],
    }

    // Add files array to the item - Printful requires this format
    if (finalImageUrl && finalImageUrl.startsWith('http')) {
      orderPayload.items[0].files = [
        {
          type: 'front',
          url: finalImageUrl,
          position: {
            area_width: 1800,
            area_height: 2400,
            width: 1800,
            height: 1800,
            top: 300,
            left: 0,
          },
        },
      ]
    } else {
      // If we still have base64, we can't proceed
      return NextResponse.json(
        {
          success: false,
          error: 'Image URL is not valid. Please try generating a new design with OpenAI (DALL-E) which provides direct URLs.',
          needsImageHosting: true,
        },
        { status: 400 }
      )
    }

    console.log('Creating order with payload:', JSON.stringify(orderPayload, null, 2))

    const orderResponse = await axios.post(
      'https://api.printful.com/orders',
      orderPayload,
      {
        headers: {
          ...getPrintfulAuthHeaders(),
          'Content-Type': 'application/json',
        },
      }
    )

    const orderId = orderResponse.data?.result?.id

    if (!orderId) {
      return NextResponse.json(
        { error: 'Failed to create order in Printful' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderUrl: `https://www.printful.com/dashboard/orders/${orderId}`,
      message: 'Order created successfully! You will receive a confirmation email.',
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    
    if (!process.env.PRINTFUL_API_KEY) {
      return NextResponse.json({
        success: true,
        orderUrl: '#',
        message: 'Printful API key not configured. Configure it to enable real orders.',
        orderId: `demo-${Date.now()}`,
      })
    }

    // Better error handling
    const errorMessage = error.response?.data?.result?.message || 
                        error.response?.data?.error?.message ||
                        error.response?.data?.error ||
                        error.message || 
                        'Failed to create order'
    
    console.error('Order creation error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: errorMessage,
    })

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        needsImageHosting: errorMessage.includes('file') || errorMessage.includes('image'),
      },
      { status: error.response?.status || 500 }
    )
  }
}

