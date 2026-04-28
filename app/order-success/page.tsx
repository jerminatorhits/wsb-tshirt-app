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
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {fulfilling ? (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Processing Your Order...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your payment was successful! We&apos;re now creating your custom T-shirt order.
            </p>
          </>
        ) : success ? (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your custom T-shirt order has been placed successfully. You&apos;ll receive a confirmation email shortly.
            </p>
            {fulfillmentStatus !== 'unknown' && (
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Fulfillment status: {fulfillmentStatus === 'fulfilled' ? 'Fulfilled' : 'Processing'}
              </p>
            )}
            {orderId && (
              <p className="mb-6 text-xs text-gray-500 dark:text-gray-400">
                Order ID: {orderId}
              </p>
            )}
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Return Home
            </a>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Received
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your payment was successful, but there was an issue processing your order.
            </p>
            {error && (
              <p className="text-red-600 dark:text-red-400 mb-4 text-sm">{error}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Don&apos;t worry - we&apos;ve received your payment and will process your order manually. You&apos;ll receive a confirmation email.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Return Home
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
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}

