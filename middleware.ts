import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Old share links hit `/?t=TSLA…` — send them to the ticker generator. */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== '/') return NextResponse.next()

  const params = request.nextUrl.searchParams
  if (!params.get('t') && !params.get('product') && !params.get('mode')) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = '/create'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: '/',
}
