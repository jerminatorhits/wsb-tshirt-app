import { NextRequest } from 'next/server'

type RateLimitOptions = {
  key: string
  windowMs: number
  max: number
}

type RateLimitResult = {
  ok: boolean
  retryAfterSeconds: number
}

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
let lastCleanupAt = 0

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

function maybeCleanup(now: number) {
  // Cleanup at most once per minute.
  if (now - lastCleanupAt < 60_000) return
  lastCleanupAt = now

  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) buckets.delete(key)
  })
}

export function checkRateLimit(request: NextRequest, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  maybeCleanup(now)

  const ip = getClientIp(request)
  const bucketKey = `${options.key}:${ip}`
  const existing = buckets.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    })
    return { ok: true, retryAfterSeconds: 0 }
  }

  if (existing.count >= options.max) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  buckets.set(bucketKey, existing)
  return { ok: true, retryAfterSeconds: 0 }
}
