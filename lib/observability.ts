import { NextRequest, NextResponse } from 'next/server'

type LogLevel = 'info' | 'warn' | 'error'

type LogMeta = Record<string, unknown>

export function getRequestId(request: NextRequest): string {
  const fromHeader = request.headers.get('x-request-id')?.trim()
  if (fromHeader) return fromHeader
  try {
    return crypto.randomUUID()
  } catch {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }
}

export function logEvent(level: LogLevel, event: string, meta: LogMeta = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...meta,
  }
  const line = JSON.stringify(payload)
  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
  }
}

export function jsonWithRequestId(
  body: unknown,
  requestId: string,
  init?: ResponseInit
) {
  const headers = new Headers(init?.headers)
  headers.set('x-request-id', requestId)
  return NextResponse.json(body, { ...init, headers })
}
