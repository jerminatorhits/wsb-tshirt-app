/**
 * Light guardrails for the ticker generator.
 * Tickers are short symbols; block obvious personal-name / slur attempts.
 */

const BLOCKED_EXACT = new Set(
  [
    'JENSEN',
    'HUANG',
    'ELON',
    'MUSK',
    'TRUMP',
    'BIDEN',
    'PUTIN',
    'HITLER',
    'NIGGER',
    'NIGGA',
    'FAGGOT',
    'RETARD',
  ].map((s) => s.toUpperCase())
)

/** Keep A–Z / 0–9 only, max 6 chars (standard ticker shape). */
export function sanitizeTickerInput(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
}

export function isBlockedTicker(symbol: string): boolean {
  const s = sanitizeTickerInput(symbol)
  if (!s) return false
  if (BLOCKED_EXACT.has(s)) return true
  // Block multi-token personal names jammed without spaces (rare at 6 chars)
  return false
}

export function tickerGuardMessage(symbol: string): string | null {
  const s = sanitizeTickerInput(symbol)
  if (!s) return 'Enter a ticker symbol.'
  if (isBlockedTicker(s)) return 'That text isn’t allowed. Use a stock ticker (e.g. TSLA).'
  return null
}
