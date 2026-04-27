import axios from 'axios'

/**
 * Printful auth headers.
 *
 * Simplest setup: set only `PRINTFUL_API_KEY` and leave `PRINTFUL_STORE_ID` unset.
 * We then call `GET /stores` once (cached) and set `X-PF-Store-Id` by store name:
 * exact match on `PRINTFUL_STORE_NAME` (default `wsbtees`), else substring match,
 * else the only store if your account has exactly one. Multiple stores with no match
 * → no header (set numeric `PRINTFUL_STORE_ID` or a unique `PRINTFUL_STORE_NAME`).
 *
 * Optional `PRINTFUL_STORE_ID`: all digits → use as `X-PF-Store-Id` directly; otherwise
 * treat as a name slug and resolve via the same store list.
 */
const STORE_LIST_PATH = 'https://api.printful.com/stores'

/** Cache: match key (lowercase store name hint) → resolved numeric id or null */
const storeIdFromListCache = new Map<string, string | null | undefined>()

function preferredStoreName(): string {
  return (process.env.PRINTFUL_STORE_NAME || 'wsbtees').trim().toLowerCase()
}

function isNumericStoreId(value: string): boolean {
  return /^\d+$/.test(value.trim())
}

async function resolveStoreIdFromStoresList(apiKey: string, nameHint?: string): Promise<string | null> {
  const matchKey = (nameHint?.trim() || preferredStoreName()).toLowerCase()
  if (storeIdFromListCache.has(matchKey)) {
    const cached = storeIdFromListCache.get(matchKey)
    return cached === undefined ? null : cached
  }

  try {
    const res = await axios.get(STORE_LIST_PATH, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const stores = res.data?.result
    if (!Array.isArray(stores) || stores.length === 0) {
      storeIdFromListCache.set(matchKey, null)
      return null
    }

    const target = matchKey
    const norm = (s: { name?: string }) => String(s?.name || '').trim().toLowerCase()

    const exact = stores.find((s: { id?: unknown; name?: string }) => norm(s) === target)
    if (exact?.id != null && String(exact.id).length > 0) {
      const id = String(exact.id)
      storeIdFromListCache.set(matchKey, id)
      return id
    }

    const fuzzy = stores.find((s: { id?: unknown; name?: string }) => {
      const name = norm(s)
      return name.includes(target) || target.includes(name)
    })
    if (fuzzy?.id != null && String(fuzzy.id).length > 0) {
      const id = String(fuzzy.id)
      storeIdFromListCache.set(matchKey, id)
      return id
    }
    if (stores.length === 1 && stores[0]?.id != null) {
      const id = String(stores[0].id)
      storeIdFromListCache.set(matchKey, id)
      return id
    }

    storeIdFromListCache.set(matchKey, null)
    return null
  } catch {
    storeIdFromListCache.set(matchKey, null)
    return null
  }
}

export async function getPrintfulAuthHeaders(): Promise<Record<string, string>> {
  const key = process.env.PRINTFUL_API_KEY || ''
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
  }

  const raw = process.env.PRINTFUL_STORE_ID?.trim()

  if (raw && isNumericStoreId(raw)) {
    headers['X-PF-Store-Id'] = raw.trim()
    return headers
  }

  if (raw && !isNumericStoreId(raw)) {
    if (!key) return headers
    const resolved = await resolveStoreIdFromStoresList(key, raw)
    if (resolved) {
      headers['X-PF-Store-Id'] = resolved
    }
    return headers
  }

  if (!key) {
    return headers
  }

  const resolved = await resolveStoreIdFromStoresList(key)
  if (resolved) {
    headers['X-PF-Store-Id'] = resolved
  }
  return headers
}
