import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { basicAbuseCheck } from '@/lib/abuse-protection'
import { getRequestId, jsonWithRequestId, logEvent } from '@/lib/observability'

function trim(s: unknown, max: number): string {
  return String(s ?? '')
    .trim()
    .slice(0, max)
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  try {
    const abuse = basicAbuseCheck(request)
    if (!abuse.ok) {
      return jsonWithRequestId({ error: 'Request blocked' }, requestId, { status: 400 })
    }

    const rl = checkRateLimit(request, {
      key: 'notify',
      windowMs: 60_000,
      max: 8,
    })
    if (!rl.ok) {
      return jsonWithRequestId(
        { error: 'Too many signups. Please try again shortly.' },
        requestId,
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        }
      )
    }

    const body = (await request.json()) as { email?: string; company?: string }
    if (trim(body.company, 200)) {
      return jsonWithRequestId({ ok: true }, requestId)
    }

    const email = trim(body.email, 200)
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonWithRequestId({ error: 'Please enter a valid email.' }, requestId, { status: 400 })
    }

    const web3Key = process.env.WEB3FORMS_ACCESS_KEY?.trim()
    if (!web3Key) {
      logEvent('warn', 'notify.not_configured', { requestId })
      return jsonWithRequestId(
        { error: 'Signup is not configured yet.' },
        requestId,
        { status: 503 }
      )
    }

    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: web3Key,
        subject: 'stonkmugs · drop notify signup',
        email,
        message: `Drop notify signup\nEmail: ${email}`,
      }),
    })
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string }
    if (!res.ok || data.success === false) {
      logEvent('error', 'notify.web3forms_failed', {
        requestId,
        error: data.message || res.statusText,
      })
      return jsonWithRequestId(
        { error: 'Could not save your email. Please try again later.' },
        requestId,
        { status: 502 }
      )
    }

    logEvent('info', 'notify.subscribed', { requestId })
    return jsonWithRequestId({ ok: true }, requestId)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logEvent('error', 'notify.failed', { requestId, error: message })
    return jsonWithRequestId({ error: 'Could not save your email.' }, requestId, { status: 500 })
  }
}
