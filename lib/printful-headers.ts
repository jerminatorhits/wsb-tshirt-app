/**
 * Auth headers for Printful REST calls.
 *
 * Prefer a **store-scoped** API key from the wsbtees store:
 * Printful Dashboard → Stores → **wsbtees** → API → generate key.
 * That key already targets wsbtees; no store id is required.
 *
 * If you use an account-level token instead, set `PRINTFUL_STORE_ID`
 * to the numeric store id for wsbtees (Dashboard → Store settings).
 */
export function getPrintfulAuthHeaders(): Record<string, string> {
  const key = process.env.PRINTFUL_API_KEY || ''
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
  }
  const storeId = process.env.PRINTFUL_STORE_ID?.trim()
  if (storeId) {
    headers['X-PF-Store-Id'] = storeId
  }
  return headers
}
