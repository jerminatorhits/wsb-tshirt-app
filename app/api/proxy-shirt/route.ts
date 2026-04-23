import { NextRequest, NextResponse } from 'next/server'

/** Same-origin shirt bitmap for canvas tinting (avoids tainted canvas from cross-origin drawImage). */
function isAllowedShirtAssetUrl(raw: string): boolean {
  const manual = process.env.PRINTFUL_BLANK_SHIRT_URL
  if (manual && raw === manual) return true

  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return false
  }
  if (u.protocol !== 'https:') return false
  const h = u.hostname.toLowerCase()
  if (h === 'files.cdn.printful.com') return true
  if (h === 'printful.com' || h.endsWith('.printful.com')) return true
  return false
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')
  if (!raw || !isAllowedShirtAssetUrl(raw)) {
    return NextResponse.json({ error: 'Invalid or disallowed image URL' }, { status: 400 })
  }

  try {
    const upstream = await fetch(raw, {
      headers: { 'User-Agent': 'WSB-Shirt-Lab/1.0' },
      next: { revalidate: 3600 },
    })
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream image request failed' }, { status: 502 })
    }
    const contentType = upstream.headers.get('content-type') || 'image/png'
    const buf = await upstream.arrayBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    console.error('proxy-shirt:', e)
    return NextResponse.json({ error: 'Could not fetch image' }, { status: 502 })
  }
}
