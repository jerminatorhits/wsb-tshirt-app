import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { basicAbuseCheck } from '@/lib/abuse-protection'
import { getRequestId, jsonWithRequestId, logEvent } from '@/lib/observability'

type ContactBody = {
  name?: string
  email?: string
  orderNumber?: string
  message?: string
  /** Honeypot — bots fill this; humans leave blank */
  company?: string
}

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
      key: 'contact',
      windowMs: 60_000,
      max: 5,
    })
    if (!rl.ok) {
      return jsonWithRequestId(
        { error: 'Too many messages. Please try again shortly.' },
        requestId,
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        }
      )
    }

    const body = (await request.json()) as ContactBody
    if (trim(body.company, 200)) {
      // Honeypot tripped — pretend success
      return jsonWithRequestId({ ok: true }, requestId)
    }

    const name = trim(body.name, 120)
    const email = trim(body.email, 200)
    const orderNumber = trim(body.orderNumber, 64)
    const message = trim(body.message, 4000)

    if (!name || !email || !message) {
      return jsonWithRequestId(
        { error: 'Name, email, and message are required.' },
        requestId,
        { status: 400 }
      )
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonWithRequestId({ error: 'Please enter a valid email.' }, requestId, { status: 400 })
    }

    const subject = orderNumber
      ? `stonkmugs support · ${orderNumber}`
      : 'stonkmugs support'
    const text = [
      `From: ${name} <${email}>`,
      orderNumber ? `Order: ${orderNumber}` : null,
      '',
      message,
    ]
      .filter(Boolean)
      .join('\n')

    const web3Key = process.env.WEB3FORMS_ACCESS_KEY?.trim()
    const resendKey = process.env.RESEND_API_KEY?.trim()
    const supportInbox = process.env.SUPPORT_INBOX?.trim()
    const resendFrom = process.env.RESEND_FROM?.trim() || 'onboarding@resend.dev'

    if (web3Key) {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: web3Key,
          subject,
          name,
          email,
          message: text,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string }
      if (!res.ok || data.success === false) {
        logEvent('error', 'contact.web3forms_failed', {
          requestId,
          error: data.message || res.statusText,
        })
        return jsonWithRequestId(
          { error: 'Could not send message. Please try again later.' },
          requestId,
          { status: 502 }
        )
      }
    } else if (resendKey && supportInbox) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [supportInbox],
          reply_to: email,
          subject,
          text,
        }),
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        logEvent('error', 'contact.resend_failed', { requestId, error: errText.slice(0, 200) })
        return jsonWithRequestId(
          { error: 'Could not send message. Please try again later.' },
          requestId,
          { status: 502 }
        )
      }
    } else {
      logEvent('warn', 'contact.not_configured', { requestId })
      return jsonWithRequestId(
        { error: 'Contact form is not configured yet.' },
        requestId,
        { status: 503 }
      )
    }

    logEvent('info', 'contact.sent', { requestId, hasOrder: Boolean(orderNumber) })
    return jsonWithRequestId({ ok: true }, requestId)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logEvent('error', 'contact.failed', { requestId, error: message })
    return jsonWithRequestId({ error: 'Could not send message.' }, requestId, { status: 500 })
  }
}
