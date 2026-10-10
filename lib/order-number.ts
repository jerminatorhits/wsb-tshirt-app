/** Customer-facing confirmation codes stored on Stripe PaymentIntent metadata. */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1 for readability

export function generateOrderNumber(): string {
  const bytes = new Uint8Array(6)
  // Node 20+ / browsers: Web Crypto. Fallback keeps API routes working in older runtimes.
  const c = globalThis.crypto
  if (c?.getRandomValues) {
    c.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  let body = ''
  for (let i = 0; i < bytes.length; i++) {
    body += ALPHABET[bytes[i]! % ALPHABET.length]
  }
  return `WSB-${body}`
}

export function normalizeOrderNumber(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (cleaned.startsWith('WSB-')) return cleaned
  if (/^[A-Z0-9]{6}$/.test(cleaned)) return `WSB-${cleaned}`
  return cleaned
}

export function isValidOrderNumberFormat(orderNumber: string): boolean {
  return /^WSB-[A-Z0-9]{6}$/.test(normalizeOrderNumber(orderNumber))
}
