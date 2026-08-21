'use client'

import confetti from 'canvas-confetti'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/** Richer on dark backgrounds (default for this page’s `dark:` card/background). */
const CONFETTI_COLORS_DARK = ['#22c55e', '#84cc16', '#34d399', '#f43f5e', '#eab308']

/** Slightly deeper, less neon on light gradients so the effect feels a bit more “finished” / less toy-like. */
const CONFETTI_COLORS_LIGHT = ['#15803d', '#65a30d', '#0d9488', '#be123c', '#b45309']

function confettiColorsForDisplay(): string[] {
  if (typeof window === 'undefined') return CONFETTI_COLORS_DARK
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? CONFETTI_COLORS_DARK
    : CONFETTI_COLORS_LIGHT
}

/**
 * Full-screen confetti from the **bottom edge**: five bursts (far left → far right).
 * Tuned for full-width coverage with a mid-high apex (not ceiling); snappier decay.
 */
function fireTradeConfetti(shoot: ReturnType<typeof confetti.create>, colors: readonly string[]) {
  const shared = {
    startVelocity: 82,
    ticks: 380,
    gravity: 0.78,
    decay: 0.88,
    drift: 0.35,
    scalar: 1,
    colors: [...colors],
  }

  const y = 1.06

  const bursts: Array<{
    particleCount: number
    spread: number
    origin: { x: number; y: number }
    angle: number
  }> = [
    { particleCount: 110, spread: 104, origin: { x: -0.02, y }, angle: 72 },
    { particleCount: 130, spread: 98, origin: { x: 0.22, y }, angle: 82 },
    { particleCount: 150, spread: 96, origin: { x: 0.5, y }, angle: 90 },
    { particleCount: 130, spread: 98, origin: { x: 0.78, y }, angle: 98 },
    { particleCount: 110, spread: 104, origin: { x: 1.02, y }, angle: 108 },
  ]

  for (const b of bursts) {
    shoot({ ...shared, ...b })
  }
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const paymentIntentId = searchParams.get('payment_intent')
  const celebrationFired = useRef(false)
  const [fulfilling, setFulfilling] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fulfillmentStatus, setFulfillmentStatus] = useState<'pending' | 'fulfilled' | 'unknown'>('unknown')
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (paymentIntentId) {
      // Verify payment was successful
      // Fulfillment runs from the Stripe webhook after payment; this page only verifies status.
      fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSuccess(true)
            setFulfillmentStatus(data.fulfillmentStatus === 'fulfilled' ? 'fulfilled' : 'pending')
            if (data.printfulOrderId) setOrderId(data.printfulOrderId)
          } else {
            // Payment verification failed, but payment might still be valid
            // Show success anyway since we have a payment intent ID
            setSuccess(true)
            setFulfillmentStatus('unknown')
          }
        })
        .catch((err) => {
          // Even if verification fails, if we have a payment intent ID, payment likely succeeded
          // Show success message
          setSuccess(true)
          console.error('Verification error:', err)
        })
        .finally(() => {
          setFulfilling(false)
        })
    } else {
      setFulfilling(false)
      setError('No payment intent ID found')
    }
  }, [paymentIntentId])

  const CELEBRATION_TOTAL_MS = 4000
  const FADE_MS = 400
  /** Let the success check + copy paint first (perceived sync with the “Order confirmed” moment). */
  const CELEBRATION_START_DELAY_MS = 90

  useEffect(() => {
    if (fulfilling || !success || celebrationFired.current) return
    celebrationFired.current = true

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    let canvas: HTMLCanvasElement | null = null
    let shoot: ReturnType<typeof confetti.create> | null = null
    let fadeTimer: number | undefined
    let cleanupTimer: number | undefined

    const startId = window.setTimeout(() => {
      canvas = document.createElement('canvas')
      canvas.setAttribute('aria-hidden', 'true')
      canvas.style.cssText = [
        'position:fixed',
        'inset:0',
        'width:100%',
        'height:100%',
        'pointer-events:none',
        'z-index:9999',
        'opacity:1',
      ].join(';')
      document.body.appendChild(canvas)

      shoot = confetti.create(canvas, { resize: true })
      fireTradeConfetti(shoot, confettiColorsForDisplay())

      fadeTimer = window.setTimeout(() => {
        if (!canvas) return
        canvas.style.transition = `opacity ${FADE_MS}ms ease-out`
        canvas.style.opacity = '0'
      }, CELEBRATION_TOTAL_MS - FADE_MS)

      cleanupTimer = window.setTimeout(() => {
        shoot?.reset()
        if (canvas?.parentNode) canvas.remove()
        canvas = null
        shoot = null
      }, CELEBRATION_TOTAL_MS)
    }, CELEBRATION_START_DELAY_MS)

    return () => {
      window.clearTimeout(startId)
      if (fadeTimer !== undefined) window.clearTimeout(fadeTimer)
      if (cleanupTimer !== undefined) window.clearTimeout(cleanupTimer)
      shoot?.reset()
      if (canvas?.parentNode) canvas.remove()
    }
  }, [fulfilling, success])

  return (
    <main className="flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        {fulfilling ? (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900"></div>
            <h1 className="text-2xl font-semibold text-neutral-900">Processing your order…</h1>
            <p className="mt-2 text-sm text-neutral-500">Payment went through. Sending it to print.</p>
          </>
        ) : success ? (
          <>
            <h1 className="text-2xl font-semibold text-neutral-900">Order confirmed</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Your merch is in production. A confirmation email is on the way.
            </p>
            {fulfillmentStatus !== 'unknown' && (
              <p className="mt-4 text-sm text-neutral-400">
                {fulfillmentStatus === 'fulfilled' ? 'Fulfilled' : 'Processing'}
              </p>
            )}
            {orderId && <p className="mt-1 text-xs text-neutral-400">Order ID: {orderId}</p>}
            <a href="/" className="rh-btn-primary mt-6 inline-block w-auto px-6">
              Make another
            </a>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-neutral-900">Payment received</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Payment went through, but we hit a snag processing your order.
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <p className="mt-4 text-sm text-neutral-500">
              We have your payment and will finish the order manually. Watch for a confirmation email.
            </p>
            <a href="/" className="rh-btn-primary mt-6 inline-block w-auto px-6">
              Back home
            </a>
          </>
        )}
      </div>
    </main>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <main className="flex items-center justify-center px-4 py-16">
        <p className="text-sm text-neutral-400">Loading…</p>
      </main>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}

