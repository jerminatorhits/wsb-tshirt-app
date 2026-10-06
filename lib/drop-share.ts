/** Shareable drop links + post-checkout flex helpers. */

export const DROP_SHARE_STORAGE_KEY = 'wsb-last-drop-share'

export type DropSharePayload = {
  url: string
  topic: string
  productLabel: string
}

export type DropShareInput = {
  ticker: string
  expressionMode: 'price' | 'option'
  numberValue: string
  optionType: 'CALL' | 'PUT'
  selectedExpiration: string
  selectedStrike: string
  colorValue: string
  layout: string
  scale: number
  inkMode: 'auto' | 'light' | 'dark'
  productType: string
}

export function buildDropShareSearchParams(input: DropShareInput): URLSearchParams {
  const params = new URLSearchParams()
  const ticker = input.ticker.trim().toUpperCase()
  if (ticker) params.set('t', ticker)
  params.set('mode', input.expressionMode)
  if (input.expressionMode === 'price') {
    if (input.numberValue.trim()) params.set('p', input.numberValue.trim())
  } else {
    params.set('ot', input.optionType)
    if (input.selectedExpiration) params.set('exp', input.selectedExpiration)
    if (input.selectedStrike) params.set('strike', input.selectedStrike)
  }
  if (input.colorValue) params.set('color', input.colorValue)
  params.set('layout', input.layout)
  params.set('scale', String(input.scale))
  params.set('ink', input.inkMode)
  params.set('product', input.productType)
  return params
}

export function buildDropShareUrl(
  origin: string,
  pathname: string,
  input: DropShareInput
): string {
  const params = buildDropShareSearchParams(input)
  return `${origin}${pathname}?${params.toString()}`
}

export function saveDropShareForCheckout(payload: DropSharePayload) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(DROP_SHARE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function loadDropShareAfterOrder(): DropSharePayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(DROP_SHARE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DropSharePayload
    if (!parsed?.url || !parsed?.topic) return null
    return parsed
  } catch {
    return null
  }
}

export function dropShareText(topic: string, url: string): string {
  return `Printed my conviction: ${topic}\n${url}`
}
