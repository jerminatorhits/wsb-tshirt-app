import { NextRequest, NextResponse } from 'next/server'
import { validateShippingAddress } from '@/lib/validate-address'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateShippingAddress(body)
    return NextResponse.json({
      valid: validation.valid,
      error: validation.error,
    })
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Invalid request.' },
      { status: 400 }
    )
  }
}
