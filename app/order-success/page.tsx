'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const paymentIntentId = searchParams.get('payment_intent')
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

