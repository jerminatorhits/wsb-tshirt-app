'use client'

import { useState, useEffect, useMemo } from 'react'
import { GeneratedDesign, ColorOption } from '@/lib/merch'
import { validateShippingAddress } from '@/lib/validate-address'
import PaymentOptions from './PaymentOptions'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface CheckoutProps {
  design: GeneratedDesign
  designTitle: string
  selectedColor: ColorOption
  className?: string
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']

type WizardStep = 'order' | 'shipping' | 'payment'

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'order', label: 'Order' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment', label: 'Pay' },
]

export default function Checkout({ design, designTitle, selectedColor, className = '' }: CheckoutProps) {
  const [size, setSize] = useState('M')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showShippingForm, setShowShippingForm] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState<string | null>(null)
  const [succeededPaymentIntentId, setSucceededPaymentIntentId] = useState<string | null>(null)
  const [step, setStep] = useState<WizardStep>('order')

  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  })
  /** After user tries to continue, show field validation (button stays enabled until then). */
  const [shippingSubmitAttempted, setShippingSubmitAttempted] = useState(false)

  const shippingValidation = useMemo(
    () => validateShippingAddress(shippingInfo),
    [shippingInfo]
  )

  const baseCost = 12.0
  const markup = 1.5
  const basePrice = baseCost * markup
  const shippingCost = 4.99
  const subtotal = basePrice * quantity
  const totalPrice = (subtotal + shippingCost).toFixed(2)

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const isFulfillmentRetry = Boolean(succeededPaymentIntentId)

  useEffect(() => {
    if (isFulfillmentRetry) {
      setStep('shipping')
    }
  }, [isFulfillmentRetry])

  useEffect(() => {
    if (showPaymentForm && !isFulfillmentRetry) {
      setStep('payment')
    }
  }, [showPaymentForm, isFulfillmentRetry])

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        const response = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            designId: design.id,
            imageUrl: design.imageUrl,
            title: designTitle,
            size,
            color: selectedColor.value,
            quantity,
          }),
        })
        const data = await response.json()
        if (!data.success) {
          console.error('Failed to initialize checkout:', data.error)
        }
      } catch (err) {
        console.error('Error initializing checkout:', err)
      }
    }
    initializeCheckout()
  }, [design.id, design.imageUrl, designTitle, size, selectedColor.value, quantity])

  const goBackToOrder = () => {
    setError(null)
    setShippingSubmitAttempted(false)
    setStep('order')
  }

  const goToShipping = () => {
    setError(null)
    setShippingSubmitAttempted(false)
    setStep('shipping')
  }

  const goBackToShipping = () => {
    setError(null)
    setShippingSubmitAttempted(false)
    setShowPaymentForm(false)
    setPaymentIntentClientSecret(null)
    setStep('shipping')
  }

  const handleCompleteOrder = async () => {
    setError(null)
    const clientValidation = validateShippingAddress(shippingInfo)
    if (!clientValidation.valid) {
      setShippingSubmitAttempted(true)
      return
    }
    setShowPaymentForm(true)
    setLoading(true)
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(parseFloat(totalPrice) * 100),
          shipping: shippingInfo,
          orderDetails: {
            designId: design.id,
            imageUrl: design.imageUrl,
            title: designTitle,
            size,
            color: selectedColor.value,
            quantity,
          },
        }),
      })
      const data = await response.json()
      if (data.clientSecret) {
        setPaymentIntentClientSecret(data.clientSecret)
        setStep('payment')
      } else {
        setError(data.error || 'Could not initialize payment. Please try again.')
      }
    } catch (err) {
      setError('Could not initialize payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string, paymentShippingInfo?: any) => {
    setLoading(true)
    setError(null)

    // First successful charge: fulfillment runs from the Stripe `payment_intent.succeeded` webhook only.
    // Calling `/api/fulfill-order` here too races the webhook; both see empty `printfulOrderId` metadata
    // and create duplicate Printful orders. Retry-after-failure still uses the client fulfill path.
    const isRetryAfterFulfillmentFailure =
      succeededPaymentIntentId != null && paymentIntentId === succeededPaymentIntentId

    if (!isRetryAfterFulfillmentFailure) {
      setPaymentSuccess(true)
      setLoading(false)
      setTimeout(() => {
        window.location.href = '/order-success?payment_intent=' + paymentIntentId
      }, 1200)
      return
    }

    try {
      const finalShippingInfo = paymentShippingInfo || shippingInfo
      const response = await fetch('/api/fulfill-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          designId: design.id,
          imageUrl: design.imageUrl,
          title: designTitle,
          size,
          color: selectedColor.value,
          quantity,
          shipping: finalShippingInfo,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setPaymentSuccess(true)
        setLoading(false)
        setTimeout(() => {
          window.location.href = '/order-success?payment_intent=' + paymentIntentId
        }, 2000)
      } else {
        const errorMsg = data.error || 'Payment succeeded but order fulfillment failed. Please contact support.'
        setError(errorMsg)
        setLoading(false)
        setSucceededPaymentIntentId(paymentIntentId)
        setStep('shipping')
        handlePaymentError(errorMsg)
        console.error('Fulfillment error:', errorMsg)
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Payment succeeded but order fulfillment failed. Please contact support.'
      setError(errorMsg)
      console.error('Fulfillment error:', err)
      setLoading(false)
      handlePaymentError(errorMsg)
    }
  }

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg)
    setLoading(false)
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg shadow-black/30 lg:h-full lg:min-h-0 ${className}`}
    >
      <h2 className="mb-4 shrink-0 text-xl font-black uppercase tracking-wide text-zinc-100">🛒 Secure the bag</h2>

      {!isFulfillmentRetry && !paymentSuccess && (
        <nav aria-label="Checkout steps" className="mb-6 shrink-0">
          <ol className="flex items-center justify-center gap-1 sm:gap-2">
            {STEPS.map((s, i) => {
              const active = stepIndex === i
              const done = stepIndex > i
              return (
                <li key={s.id} className="flex items-center">
                  {i > 0 && <span className="mx-1 text-zinc-600 sm:mx-2">→</span>}
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide sm:text-sm ${
                      active
                        ? 'text-emerald-400'
                        : done
                          ? 'text-zinc-500'
                          : 'text-zinc-600'
                    }`}
                  >
                    {i + 1}. {s.label}
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>
      )}

      {error && !isFulfillmentRetry && step !== 'payment' && (
        <div className="mb-4 shrink-0 rounded-lg border border-rose-500/40 bg-rose-950/40 p-3">
          <p className="text-sm text-rose-200">{error}</p>
        </div>
      )}

      <div className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1">
        {step === 'order' && !isFulfillmentRetry && (
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Size</label>
              <div className="grid grid-cols-4 gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                      size === s
                        ? 'border-emerald-500 bg-emerald-500/15 font-semibold text-emerald-300'
                        : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Quantity</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-10 w-10 rounded-lg border-2 border-zinc-600 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  −
                </button>
                <span className="w-12 text-center text-xl font-semibold text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= 10}
                  className="h-10 w-10 rounded-lg border-2 border-zinc-600 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
            <div className="border-t border-zinc-700 pt-4 text-sm text-zinc-300">
              <div className="mb-1 flex justify-between">
                <span className="text-zinc-500">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="mb-2 flex justify-between">
                <span className="text-zinc-500">Shipping</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-700 pt-2 text-lg font-bold text-emerald-400">
                <span className="text-white">Total</span>
                <span>${totalPrice}</span>
              </div>
            </div>
              <button
              type="button"
              onClick={goToShipping}
                className="w-full rounded-lg bg-gradient-to-r from-emerald-600 via-lime-500 to-emerald-600 px-6 py-3.5 font-bold uppercase tracking-wide text-zinc-950 shadow-lg shadow-emerald-900/25"
            >
              Continue to shipping
            </button>
          </div>
        )}

        {step === 'shipping' && showShippingForm && !paymentSuccess && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!shippingValidation.valid) {
                setShippingSubmitAttempted(true)
                return
              }
              void handleCompleteOrder()
            }}
            noValidate
          >
            {isFulfillmentRetry && (
              <div className="mb-2 rounded-lg border border-amber-500/40 bg-amber-950/30 p-4">
                <p className="text-sm text-amber-200">
                  Payment was successful. Update your address if needed, then resubmit. You will not be charged again.
                </p>
              </div>
            )}
            <p className="text-xs text-zinc-500">
              {size} · {selectedColor.name} · Qty {quantity} · <span className="text-emerald-400/90">${totalPrice}</span>
            </p>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Shipping</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <input
                type="text"
                name="shipping-name"
                autoComplete="name"
                placeholder="Full Name"
                value={shippingInfo.name}
                onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2.5 text-white placeholder-zinc-500"
              />
              <input
                type="email"
                name="shipping-email"
                autoComplete="email"
                placeholder="Email"
                value={shippingInfo.email}
                onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2.5 text-white placeholder-zinc-500"
              />
              <input
                type="text"
                name="shipping-address"
                autoComplete="street-address"
                placeholder="Address"
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                className="col-span-2 rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2.5 text-white placeholder-zinc-500"
              />
              <input
                type="text"
                name="shipping-city"
                autoComplete="address-level2"
                placeholder="City"
                value={shippingInfo.city}
                onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2.5 text-white placeholder-zinc-500"
              />
              <input
                type="text"
                name="shipping-state"
                autoComplete="address-level1"
                placeholder="State (e.g. CA)"
                value={shippingInfo.state}
                onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2.5 text-white placeholder-zinc-500"
              />
              <input
                type="text"
                name="shipping-zip"
                autoComplete="postal-code"
                placeholder="ZIP"
                value={shippingInfo.zip}
                onChange={(e) => setShippingInfo({ ...shippingInfo, zip: e.target.value })}
                className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2.5 text-white placeholder-zinc-500"
              />
              <select
                name="shipping-country"
                autoComplete="country"
                value={shippingInfo.country}
                onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2.5 text-white"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </div>
            {shippingSubmitAttempted && !shippingValidation.valid && (
              <p className="text-sm text-amber-200/90" role="status" aria-live="polite">
                {shippingValidation.error}
              </p>
            )}
            {error && isFulfillmentRetry && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3">
                <p className="text-sm text-rose-200">{error}</p>
              </div>
            )}
            {isFulfillmentRetry && succeededPaymentIntentId ? (
              <button
                type="button"
                onClick={() => {
                  if (!shippingValidation.valid) {
                    setShippingSubmitAttempted(true)
                    return
                  }
                  void handlePaymentSuccess(succeededPaymentIntentId, shippingInfo)
                }}
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-emerald-600 via-lime-500 to-emerald-600 px-6 py-4 font-bold text-zinc-950 shadow-md transition hover:shadow-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Submitting…' : 'Submit corrected address'}
              </button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={goBackToOrder}
                  className="w-full rounded-lg border border-zinc-600 py-3 font-semibold text-zinc-200 transition hover:bg-zinc-800 sm:w-auto sm:px-6"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex-1 rounded-lg bg-gradient-to-r from-emerald-600 via-lime-500 to-emerald-600 py-3.5 font-black uppercase tracking-wide text-zinc-950 shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? '…' : 'Continue to payment'}
                </button>
              </div>
            )}
          </form>
        )}

        {step === 'payment' && showPaymentForm && !isFulfillmentRetry && !paymentSuccess && (
          <div className="space-y-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pb-4">
            <p className="text-xs text-zinc-500">
              {size} · {selectedColor.name} · {shippingInfo.city || '…'} → <span className="text-emerald-400/90">${totalPrice}</span>
            </p>
            {error && (
              <div className="rounded-lg border border-rose-500/50 bg-rose-950/40 p-3">
                <p className="text-sm text-rose-200">{error}</p>
              </div>
            )}
            {showPaymentForm && !succeededPaymentIntentId && (
              <>
                {paymentIntentClientSecret && stripePromise ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: paymentIntentClientSecret,
                      appearance: {
                        theme: 'night',
                        variables: {
                          colorPrimary: '#34d399',
                          colorBackground: '#18181b',
                          colorText: '#fafafa',
                          colorDanger: '#f87171',
                          borderRadius: '8px',
                        },
                      },
                    }}
                  >
                    <PaymentOptions
                      clientSecret={paymentIntentClientSecret}
                      amount={parseFloat(totalPrice)}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      orderDetails={{
                        designId: design.id,
                        imageUrl: design.imageUrl,
                        title: designTitle,
                        size,
                        color: selectedColor.value,
                        quantity,
                      }}
                      shippingInfo={shippingInfo}
                      disabled={loading}
                    />
                  </Elements>
                ) : (
                  <div className="mb-2 rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
                    <div className="flex items-center gap-3">
                      <svg
                        className="h-4 w-4 animate-spin text-emerald-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      <p className="text-sm text-zinc-300">
                        {loading
                          ? 'Preparing secure payment…'
                          : !paymentIntentClientSecret && !error
                            ? 'Loading payment form…'
                            : 'Loading payment form…'}
                      </p>
                    </div>
                    {!stripePromise && (
                      <p className="mt-2 text-xs text-amber-300/90">Stripe is not configured in this environment.</p>
                    )}
                  </div>
                )}
              </>
            )}
            <button
              type="button"
              onClick={goBackToShipping}
              disabled={loading}
              className="w-full rounded-lg border border-zinc-600 py-3 font-semibold text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
          </div>
        )}

        {paymentSuccess && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-4 text-center text-sm font-semibold text-emerald-200">
            Payment successful! Processing your order…
          </div>
        )}
      </div>

    </div>
  )
}
