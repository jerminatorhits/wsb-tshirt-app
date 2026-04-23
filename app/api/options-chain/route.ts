import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

/** Uses `searchParams` — must not be treated as static during `next build`. */
export const dynamic = 'force-dynamic'

const CBOE_OPTIONS_URL = 'https://cdn.cboe.com/api/global/delayed_quotes/options'

interface ParsedOptionSymbol {
  expirationUnix: number
  optionType: 'CALL' | 'PUT'
  strike: number
}

function parseOccOptionSymbol(symbol: string): ParsedOptionSymbol | null {
  const match = symbol.match(/^([A-Z]+)(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/)
  if (!match) return null

  const [, , yy, mm, dd, cp, strikeRaw] = match
  const year = 2000 + Number(yy)
  const month = Number(mm) - 1
  const day = Number(dd)
  const strike = Number(strikeRaw) / 1000

  if (!Number.isFinite(strike)) return null

  const expirationUnix = Math.floor(Date.UTC(year, month, day) / 1000)
  return {
    expirationUnix,
    optionType: cp === 'C' ? 'CALL' : 'PUT',
    strike,
  }
}

export async function GET(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, {
      key: 'options-chain',
      windowMs: 60_000,
      max: 60,
    })
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: 'Too many market-data requests. Please try again shortly.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        }
      )
    }

    const ticker = request.nextUrl.searchParams.get('ticker')?.trim().toUpperCase()
    const expiration = request.nextUrl.searchParams.get('expiration')

    if (!ticker || !/^[A-Z]{1,6}$/.test(ticker)) {
      return NextResponse.json(
        { success: false, error: 'Valid ticker is required' },
        { status: 400 }
      )
    }

    const url = `${CBOE_OPTIONS_URL}/${ticker}.json`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch options data' },
        { status: 502 }
      )
    }

    const data = await response.json()
    const rawOptions: Array<{ option?: string }> = data?.data?.options || []
    if (!rawOptions.length) {
      return NextResponse.json(
        { success: false, error: `No options data found for ${ticker}` },
        { status: 404 }
      )
    }

    const byExpiration = new Map<number, { call: Set<number>; put: Set<number> }>()

    for (const row of rawOptions) {
      if (!row.option) continue
      const parsed = parseOccOptionSymbol(row.option)
      if (!parsed) continue

      if (!byExpiration.has(parsed.expirationUnix)) {
        byExpiration.set(parsed.expirationUnix, { call: new Set<number>(), put: new Set<number>() })
      }
      const entry = byExpiration.get(parsed.expirationUnix)!
      if (parsed.optionType === 'CALL') entry.call.add(parsed.strike)
      else entry.put.add(parsed.strike)
    }

    const expirationDates = Array.from(byExpiration.keys()).sort((a, b) => a - b)
    if (!expirationDates.length) {
      return NextResponse.json(
        { success: false, error: `No parsable options data found for ${ticker}` },
        { status: 404 }
      )
    }

    const requestedExpiration = expiration ? Number(expiration) : NaN
    const nowUnix = Math.floor(Date.now() / 1000)
    const selectedExpiration =
      Number.isFinite(requestedExpiration) && byExpiration.has(requestedExpiration)
        ? requestedExpiration
        : expirationDates.find((d) => d >= nowUnix) || expirationDates[0]

    const selected = byExpiration.get(selectedExpiration)!
    const toSortedArray = (set: Set<number>) => Array.from(set).sort((a, b) => a - b)

    return NextResponse.json({
      success: true,
      ticker,
      expirationDates,
      selectedExpiration,
      strikes: {
        call: toSortedArray(selected.call),
        put: toSortedArray(selected.put),
      },
    })
  } catch (error: any) {
    console.error('Error fetching options chain:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch options chain' },
      { status: 500 }
    )
  }
}

