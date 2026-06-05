import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

/**
 * Upload base64 image to ImgBB (free image hosting)
 * ImgBB accepts base64 directly, making it perfect for Stability AI images
 */
export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl || !imageUrl.startsWith('data:')) {
      return NextResponse.json(
        { error: 'Invalid image URL. Expected base64 data URL.' },
        { status: 400 }
      )
    }

    const base64Data = imageUrl.split(',')[1]

    const imgbbApiKey = process.env.IMGBB_API_KEY

    if (!imgbbApiKey || imgbbApiKey === 'your_imgbb_api_key_here') {
      return NextResponse.json(
        {
          success: false,
          error:
            "ImgBB API key not configured. Get a free API key at https://api.imgbb.com/ (it's free!). Then add IMGBB_API_KEY=your_key to your .env file.",
          needsImageHosting: true,
          solution: 'Get free ImgBB API key from https://api.imgbb.com/',
        },
        { status: 400 }
      )
    }

    try {
      const formData = new URLSearchParams()
      formData.append('key', imgbbApiKey)
      formData.append('image', base64Data)

      const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const hostedUrl = imgbbResponse.data?.data?.url

      if (hostedUrl) {
        return NextResponse.json({
          success: true,
          imageUrl: hostedUrl,
          hostingService: 'imgbb',
        })
      }
      throw new Error('No URL returned from ImgBB')
    } catch (uploadError: unknown) {
      const err = uploadError as { response?: { data?: { error?: { message?: string } } }; message?: string }
      console.error('ImgBB upload error:', err.response?.data || err.message)

      const errorMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to upload image to ImgBB'

      return NextResponse.json(
        {
          success: false,
          error: `ImgBB upload failed: ${errorMsg}. Please check your API key.`,
          needsImageHosting: true,
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('Error in upload-image:', error)
    const message = error instanceof Error ? error.message : 'Failed to process image upload'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
