import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

/** Uses `searchParams` — must not be treated as static during `next build`. */
export const dynamic = 'force-dynamic'

const NASDAQ_TRADED_URL = 'https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqtraded.txt'
const CACHE_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours
const MAX_RESULTS = 12

type TickerRecord = {
  symbol: string
  name: string
}

let cachedTickers: TickerRecord[] = []
let cacheLoadedAt = 0

async function loadTickers(): Promise<TickerRecord[]> {
  const now = Date.now()
  if (cachedTickers.length > 0 && now - cacheLoadedAt < CACHE_TTL_MS) {
    return cachedTickers
  }

  const response = await fetch(NASDAQ_TRADED_URL, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })

  if (!response.ok) {
    throw new Error(`Failed to load symbols: ${response.status}`)
  }

  const raw = await response.text()
  const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean)

  // File format is pipe-delimited with header and footer lines.
  const parsed: TickerRecord[] = lines
    .slice(1)
    .filter((line) => !line.startsWith('File Creation Time'))
    .map((line) => line.split('|'))
    .filter((parts) => parts.length >= 4)
    .map((parts) => ({
      symbol: parts[1]?.trim().toUpperCase() || '',
      name: parts[2]?.trim() || '',
      isTestIssue: parts[3]?.trim() === 'Y',
    }))
    .filter((row) => row.symbol && row.name && !row.isTestIssue)
    .map(({ symbol, name }) => ({ symbol, name }))

  cachedTickers = parsed
  cacheLoadedAt = now
  return parsed
}

export async function GET(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, {
      key: 'ticker-search',
      windowMs: 60_000,
      max: 90,
    })
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: 'Too many search requests. Please slow down.', results: [] },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        }
      )
    }

    const query = request.nextUrl.searchParams.get('q')?.trim().toUpperCase() || ''
    if (query.length < 1) {
      return NextResponse.json({ success: true, results: [] })
    }

    const tickers = await loadTickers()

    const startsWithSymbol = tickers.filter((item) => item.symbol.startsWith(query))
    const startsWithName = tickers.filter(
      (item) => !item.symbol.startsWith(query) && item.name.toUpperCase().startsWith(query)
    )
    const includesName = tickers.filter(
      (item) =>
        !item.symbol.startsWith(query) &&
        !item.name.toUpperCase().startsWith(query) &&
        item.name.toUpperCase().includes(query)
    )

    const results = [...startsWithSymbol, ...startsWithName, ...includesName].slice(0, MAX_RESULTS)

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error('Ticker search failed:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search tickers', results: [] },
      { status: 500 }
    )
  }
}

