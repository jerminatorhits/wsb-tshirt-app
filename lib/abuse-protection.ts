import { NextRequest } from 'next/server'

const BLOCKED_UA_SUBSTRINGS = [
  'sqlmap',
  'nikto',
  'nmap',
  'acunetix',
  'nessus',
  'dirbuster',
]

export type AbuseCheckResult = {
  ok: boolean
  reason?: string
}

/**
 * Lightweight abuse filtering (not a WAF replacement):
 * - blocks obvious scanner user agents
 * - enforces JSON content-type for state-changing API routes
 */
export function basicAbuseCheck(request: NextRequest): AbuseCheckResult {
  const ua = (request.headers.get('user-agent') || '').toLowerCase()
  if (ua) {
    for (const token of BLOCKED_UA_SUBSTRINGS) {
      if (ua.includes(token)) {
        return { ok: false, reason: `Blocked user-agent token: ${token}` }
      }
    }
  }

  if (request.method === 'POST') {
    const contentType = (request.headers.get('content-type') || '').toLowerCase()
    if (!contentType.includes('application/json')) {
      return { ok: false, reason: 'Unsupported content type (expected application/json)' }
    }
  }

  return { ok: true }
}
