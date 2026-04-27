import axios from 'axios'

/**
 * Printful auth headers.
 *
 * **Store-scoped API key** (created under Stores → wsbtees → API): often works
 * with `Authorization` only; we may still add `X-PF-Store-Id` after resolving.
 *
 * **Account-level private token**: endpoints need `X-PF-Store-Id`.
 * - Set `PRINTFUL_STORE_ID` to your **numeric** store id (best), or
 * - Set `PRINTFUL_STORE_ID` to a **store name / slug** (e.g. `wsbtees`); we resolve
 *   the numeric id via `GET https://api.printful.com/stores`, or
 * - Leave it unset and we match `PRINTFUL_STORE_NAME` (default `wsbtees`) or the only store.
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
    const byName = stores.find((s: { id?: unknown; name?: string }) => {
      const name = String(s?.name || '').trim().toLowerCase()
      return name === target || name.includes(target) || target.includes(name)
    })
    if (byName?.id != null && String(byName.id).length > 0) {
      const id = String(byName.id)
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
