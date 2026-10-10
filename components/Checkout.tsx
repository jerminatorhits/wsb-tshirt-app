'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { GeneratedDesign, ColorOption } from '@/lib/merch'
import { getProductPricing, SHIRT_SIZES, type ProductType } from '@/lib/products'
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
  productType: ProductType
  selectedColor: ColorOption
  orderSize: string
  onOrderSizeChange: (size: string) => void
  quantity: number
  onQuantityChange?: (quantity: number) => void
  className?: string
  /** When true, skip the order step; parent handles size/qty on preview step. */
  wizardMode?: boolean
  wizardStep?: 'shipping' | 'payment'
  onWizardStepChange?: (step: 'shipping' | 'payment') => void
  onWizardBack?: () => void
  onTaxUpdate?: (tax: number, total: number | null) => void
  embedded?: boolean
}

type WizardStep = 'order' | 'shipping' | 'payment'

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'order', label: 'Order' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment', label: 'Payment' },
]

export default function Checkout({
  design,
  designTitle,
  productType,
  selectedColor,
  orderSize,
  onOrderSizeChange,
  quantity,
  onQuantityChange,
  className = '',
  wizardMode = false,
  wizardStep,
  onWizardStepChange,
  onWizardBack,
  onTaxUpdate,
  embedded = false,
}: CheckoutProps) {
  const isMug = productType === 'mug'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showShippingForm, setShowShippingForm] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState<string | null>(null)
  const [chargedTotal, setChargedTotal] = useState<number | null>(null)
  const [succeededPaymentIntentId, setSucceededPaymentIntentId] = useState<string | null>(null)
  /** After card succeeds — replace payment UI with loading until order-success loads. */
  const [completingCheckout, setCompletingCheckout] = useState(false)
  const [step, setStep] = useState<WizardStep>(wizardMode ? 'shipping' : 'order')

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

  const { basePrice, shippingFlatRate: shippingCost } = getProductPricing(productType)
  const [estimatedTax, setEstimatedTax] = useState(0)
  const subtotal = basePrice * quantity
  const totalPrice = (subtotal + shippingCost + estimatedTax).toFixed(2)

  useEffect(() => {
    setEstimatedTax(0)
    setChargedTotal(null)
    onTaxUpdate?.(0, null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset totals when order inputs change
  }, [quantity, orderSize, selectedColor.value, productType])
  const isFulfillmentRetry = Boolean(succeededPaymentIntentId)

  useEffect(() => {
    if (!wizardMode || !wizardStep) return
    setStep(wizardStep)
    if (wizardStep === 'payment') {
      setShowPaymentForm(true)
    } else {
      setShowPaymentForm(false)
      setPaymentIntentClientSecret(null)
      setChargedTotal(null)
    }
  }, [wizardMode, wizardStep])

  useEffect(() => {
    if (isFulfillmentRetry) {
      setStep('shipping')
      onWizardStepChange?.('shipping')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fulfillment retry is one-way
  }, [isFulfillmentRetry])

  useEffect(() => {
    if (showPaymentForm && !isFulfillmentRetry && !wizardMode) {
      setStep('payment')
    }
  }, [showPaymentForm, isFulfillmentRetry, wizardMode])

  /**
   * PaymentIntent metadata stores `imageUrl` at creation time. If the on-page design refreshes
   * (fonts loaded, option fields updated) after the PI was created, checkout could charge for
   * art that no longer matches the preview. Drop the client secret and send the user back to
   * shipping so "Complete order" re-creates the PI with the latest image.
   */
  const lockedDesignKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!paymentIntentClientSecret || !showPaymentForm) {
      lockedDesignKeyRef.current = null
      return
    }
    const key = `${design.id}|${design.topic}|${design.imageUrl}|${productType}`
    if (lockedDesignKeyRef.current === null) {
      lockedDesignKeyRef.current = key
      return
    }
    if (lockedDesignKeyRef.current !== key) {
      lockedDesignKeyRef.current = null
      setPaymentIntentClientSecret(null)
      setChargedTotal(null)
      setEstimatedTax(0)
      setShowPaymentForm(false)
      setStep('shipping')
      onWizardStepChange?.('shipping')
      setError('Design was updated. Continue from shipping to refresh payment with the latest print file.')
    }
  }, [design.id, design.topic, design.imageUrl, productType, paymentIntentClientSecret, showPaymentForm, onWizardStepChange])

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
            size: orderSize,
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
  }, [design.id, design.imageUrl, designTitle, orderSize, selectedColor.value, quantity, productType])

  const goBackToOrder = () => {
    setError(null)
    setShippingSubmitAttempted(false)
    if (wizardMode) {
      onWizardBack?.()
      return
    }
    setStep('order')
  }

  const goToShipping = () => {
    setError(null)
    setShippingSubmitAttempted(false)
    setStep('shipping')
    onWizardStepChange?.('shipping')
  }

  const goBackToShipping = () => {
    setError(null)
    setShippingSubmitAttempted(false)
    setShowPaymentForm(false)
    setPaymentIntentClientSecret(null)
    setChargedTotal(null)
    setStep('shipping')
    onWizardStepChange?.('shipping')
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
          shipping: shippingInfo,
          orderDetails: {
            designId: design.id,
            productType,
            imageUrl: design.imageUrl,
            title: designTitle,
            size: orderSize,
            color: selectedColor.value,
            quantity,
          },
        }),
      })
      const data = await response.json()
      if (data.clientSecret) {
        if (data.amounts) {
          const taxFromServer = Number(data.amounts.taxCents || 0) / 100
          const totalFromServer = Number(data.amounts.totalCents || 0) / 100
          setEstimatedTax(taxFromServer)
          setChargedTotal(totalFromServer)
          onTaxUpdate?.(taxFromServer, totalFromServer)
        }
        setPaymentIntentClientSecret(data.clientSecret)
        setStep('payment')
        onWizardStepChange?.('payment')
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
    setCompletingCheckout(true)

    // First successful charge: fulfillment runs from the Stripe `payment_intent.succeeded` webhook only.
    // Calling `/api/fulfill-order` here too races the webhook; both see empty `printfulOrderId` metadata
    // and create duplicate Printful orders. Retry-after-failure still uses the client fulfill path.
    const isRetryAfterFulfillmentFailure =
      succeededPaymentIntentId != null && paymentIntentId === succeededPaymentIntentId

    if (!isRetryAfterFulfillmentFailure) {
      // Immediate navigate — no "Payment successful…" interstitial.
      window.location.assign('/order-success?payment_intent=' + paymentIntentId)
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
          size: orderSize,
          color: selectedColor.value,
          productType,
          quantity,
          shipping: finalShippingInfo,
        }),
      })
      const data = await response.json()
      if (data.success) {
        window.location.assign('/order-success?payment_intent=' + paymentIntentId)
        return
      } else {
        const errorMsg = data.error || 'Payment succeeded but order fulfillment failed. Please contact support.'
        setError(errorMsg)
        setLoading(false)
        setSucceededPaymentIntentId(paymentIntentId)
        setStep('shipping')
        onWizardStepChange?.('shipping')
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
    setCompletingCheckout(false)
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  const panelClass = embedded ? '' : 'rh-panel'
  const primaryBtnClass = 'rh-btn-primary'
  const secondaryBtnClass = 'rh-btn-secondary'
  const sizeActiveClass = 'rh-toggle-active'
  const sizeInactiveClass = 'rh-toggle-inactive'
  const inputClass = 'rh-input'

  return (
    <div className={`${panelClass} ${className}`.trim()}>
      {!embedded && !wizardMode && <h2 className="text-base font-medium text-neutral-900">Checkout</h2>}

      {!isFulfillmentRetry && !wizardMode && (
        <p className="mt-1 text-sm text-neutral-500">
          Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex]?.label}
        </p>
      )}

      {error && !isFulfillmentRetry && step !== 'payment' && (
        <div className={`rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 ${embedded ? '' : 'mt-4'}`} role="alert">
          <p className="text-sm font-medium text-red-900">{error}</p>
        </div>
      )}

      <div className={embedded ? '' : 'mt-5'}>
        {step === 'order' && !isFulfillmentRetry && !wizardMode && (
          <div className="space-y-5">
            {!isMug && (
              <div>
                <label className="rh-label">Size</label>
                <div className="grid grid-cols-4 gap-2">
                  {SHIRT_SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onOrderSizeChange(s)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        orderSize === s ? sizeActiveClass : sizeInactiveClass
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="rh-label">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onQuantityChange?.(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-9 w-9 rounded-lg border border-neutral-200 text-neutral-700 hover:border-neutral-400 disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-8 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => onQuantityChange?.(quantity + 1)}
                  disabled={quantity >= 10}
                  className="h-9 w-9 rounded-lg border border-neutral-200 text-neutral-700 hover:border-neutral-400 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
            <div className="space-y-1 text-sm text-neutral-700">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Shipping</span>
                <span>{shippingCost <= 0 ? 'Included' : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tax</span>
                <span>${estimatedTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-semibold text-neutral-900">
                <span>Total</span>
                <span>${totalPrice}</span>
              </div>
            </div>
            <button type="button" onClick={goToShipping} className={primaryBtnClass}>
              Continue
            </button>
          </div>
        )}

        {step === 'shipping' && showShippingForm && (
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
              <div className="rounded-lg bg-amber-50 px-3 py-2">
                <p className="text-sm text-amber-800">
                  Payment succeeded. Update your address if needed, then resubmit. You will not be charged again.
                </p>
              </div>
            )}
            {!wizardMode && (
              <div className="space-y-1 text-sm text-neutral-700">
                <p className="text-neutral-500">
                  {isMug ? `Mug · ${orderSize}` : `${orderSize} · ${selectedColor.name}`} · Qty {quantity}
                </p>
                <div className="flex justify-between font-medium text-neutral-900">
                  <span>Total</span>
                  <span>${totalPrice}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                name="shipping-name"
                autoComplete="name"
                placeholder="Full name"
                value={shippingInfo.name}
                onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                className={inputClass}
              />
              <input
                type="email"
                name="shipping-email"
                autoComplete="email"
                placeholder="Email"
                value={shippingInfo.email}
                onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                className={inputClass}
              />
              <input
                type="text"
                name="shipping-address"
                autoComplete="street-address"
                placeholder="Address"
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                className={`col-span-2 ${inputClass}`}
              />
              <input
                type="text"
                name="shipping-city"
                autoComplete="address-level2"
                placeholder="City"
                value={shippingInfo.city}
                onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                className={inputClass}
              />
              <input
                type="text"
                name="shipping-state"
                autoComplete="address-level1"
                placeholder="State"
                value={shippingInfo.state}
                onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                className={inputClass}
              />
              <input
                type="text"
                name="shipping-zip"
                autoComplete="postal-code"
                placeholder="ZIP"
                value={shippingInfo.zip}
                onChange={(e) => setShippingInfo({ ...shippingInfo, zip: e.target.value })}
                className={inputClass}
              />
              <select
                name="shipping-country"
                autoComplete="country"
                value={shippingInfo.country}
                onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                className={inputClass}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </div>
            {shippingSubmitAttempted && !shippingValidation.valid && (
              <p className="text-sm font-medium text-red-900" role="status" aria-live="polite">
                {shippingValidation.error}
              </p>
            )}
            {error && isFulfillmentRetry && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5" role="alert">
                <p className="text-sm font-medium text-red-900">{error}</p>
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
                className={primaryBtnClass}
              >
                {loading ? 'Submitting…' : 'Submit address'}
              </button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                {!wizardMode && (
                  <button type="button" onClick={goBackToOrder} className={`${secondaryBtnClass} sm:w-auto sm:px-6`}>
                    Back
                  </button>
                )}
                <button type="submit" disabled={loading} className={primaryBtnClass}>
                  {loading ? '…' : 'Continue to payment'}
                </button>
              </div>
            )}
          </form>
        )}

        {step === 'payment' && showPaymentForm && !isFulfillmentRetry && (
          <div className="space-y-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pb-4">
            {completingCheckout ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-16 text-center">
                <div
                  className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900"
                  role="status"
                  aria-label="Processing"
                />
                <p className="text-base font-semibold text-neutral-900">Processing your order…</p>
                <p className="mt-1 text-sm text-neutral-500">Hang tight — this only takes a moment.</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>
                      {isMug ? 'Mug' : 'Tee'}
                      {quantity > 1 ? ` × ${quantity}` : ''}
                    </span>
                    <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-1.5 flex justify-between text-neutral-600">
                    <span>Shipping</span>
                    <span className="tabular-nums">
                      {shippingCost <= 0 ? 'Included' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="mt-1.5 flex justify-between text-neutral-600">
                    <span>Tax</span>
                    <span className="tabular-nums">${estimatedTax.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
                    <span>Total</span>
                    <span className="tabular-nums">${totalPrice}</span>
                  </div>
                </div>
                {showPaymentForm && !succeededPaymentIntentId && (
                  <>
                    {paymentIntentClientSecret && stripePromise ? (
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret: paymentIntentClientSecret,
                          appearance: {
                            theme: 'stripe',
                            variables: {
                              colorPrimary: '#171717',
                              colorBackground: '#ffffff',
                              colorText: '#171717',
                              colorDanger: '#DC2626',
                              borderRadius: '8px',
                            },
                          },
                        }}
                      >
                        <PaymentOptions
                          clientSecret={paymentIntentClientSecret}
                          amount={chargedTotal ?? parseFloat(totalPrice)}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                          orderDetails={{
                            designId: design.id,
                            productType,
                            imageUrl: design.imageUrl,
                            title: designTitle,
                            size: orderSize,
                            color: selectedColor.value,
                            quantity,
                          }}
                          shippingInfo={shippingInfo}
                          disabled={loading}
                        />
                      </Elements>
                    ) : (
                      <div className="rounded-lg bg-white px-3 py-4">
                        <div className="flex items-center gap-3">
                          <svg
                            className="h-4 w-4 animate-spin text-neutral-700"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                          <p className="text-sm text-neutral-500">Loading payment…</p>
                        </div>
                        {!stripePromise && (
                          <p className="mt-2 text-sm text-neutral-400">
                            Stripe is not configured in this environment.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
                {!wizardMode && (
                  <button
                    type="button"
                    onClick={goBackToShipping}
                    disabled={loading}
                    className={secondaryBtnClass}
                  >
                    Back
                  </button>
                )}
              </>
            )}
          </div>
        )}

      </div>

    </div>
  )
}
