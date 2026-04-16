'use client'

import { useState, useEffect } from 'react'
import { GeneratedDesign, COLORS, ColorOption } from '@/app/page'
import PaymentForm from './PaymentForm'
import ExpressCheckout from './ExpressCheckout'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
  : null

interface CheckoutProps {
  design: GeneratedDesign
  designTitle: string
  selectedColor: ColorOption
  onColorChange: (color: ColorOption) => void
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']

export default function Checkout({ design, designTitle, selectedColor, onColorChange }: CheckoutProps) {
  const [size, setSize] = useState('M')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showShippingForm, setShowShippingForm] = useState(true) // Show shipping form automatically
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState<string | null>(null)
  /** Set when payment succeeded but fulfill-order failed; allows resubmit with corrected address without confirming payment again */
  const [succeededPaymentIntentId, setSucceededPaymentIntentId] = useState<string | null>(null)
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  })

  // Pricing with margin
  const baseCost = 12.00 // Your cost from Printful
  const markup = 1.5 // 50% markup
  const basePrice = baseCost * markup // Your selling price
  const shippingCost = 4.99
  const subtotal = basePrice * quantity
  const totalPrice = (subtotal + shippingCost).toFixed(2)

  // Initialize checkout when component mounts
  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        // Create the product/checkout session
        const response = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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

  const handleCompleteOrder = async () => {
    setError(null)
    // Validate address before showing payment so we don't charge for unfulfillable orders
    if (showShippingForm && (shippingInfo.address || shippingInfo.zip)) {
      setLoading(true)
      try {
        const res = await fetch('/api/validate-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shippingInfo),
        })
        const data = await res.json()
        if (!data.valid) {
          setError(data.error || 'Please correct your address.')
          setLoading(false)
          return
        }
      } catch {
        setError('Could not validate address. Please try again.')
        setLoading(false)
        return
      }
      setLoading(false)
    }
    setShowPaymentForm(true)
    // Create a single PaymentIntent only when user continues to payment (one order in Stripe)
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

    try {
      // Use shipping info from payment method (Apple Pay/Google Pay) if available, otherwise use form data
      const finalShippingInfo = paymentShippingInfo || shippingInfo

      // Fulfill the order
      const response = await fetch('/api/fulfill-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        // Redirect to success page after a short delay
        setTimeout(() => {
          window.location.href = '/order-success?payment_intent=' + paymentIntentId
        }, 2000)
      } else {
        const errorMsg = data.error || 'Payment succeeded but order fulfillment failed. Please contact support.'
        setError(errorMsg)
        setLoading(false)
        setSucceededPaymentIntentId(paymentIntentId) // Payment already succeeded; next submit should only retry fulfillment
        handlePaymentError(errorMsg)
        console.error('Fulfillment error:', errorMsg)
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Payment succeeded but order fulfillment failed. Please contact support.'
      setError(errorMsg)
      console.error('Fulfillment error:', err)
      setLoading(false)
      // Also call handlePaymentError to reset PaymentForm's loading state
      handlePaymentError(errorMsg)
    }
  }

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg)
    setLoading(false)
    // Also reset payment form if it's showing
    // The PaymentForm will reset its own loading state when onError is called
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        🛒 Checkout
      </h2>

      <div className="space-y-6">
        {/* Size Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Size
          </label>
          <div className="grid grid-cols-4 gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  size === s
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div className="flex gap-3">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => onColorChange(c)}
                className={`w-12 h-12 rounded-full border-4 transition-all ${
                  selectedColor.value === c.value
                    ? 'border-blue-600 scale-110 shadow-lg'
                    : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Selected: {selectedColor.name}
          </p>
        </div>

        {/* Quantity Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              −
            </button>
            <span className="text-xl font-semibold text-gray-900 dark:text-white w-12 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              disabled={quantity >= 10}
              className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Price Summary */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 dark:text-gray-400">Price per item</span>
            <span className="text-gray-900 dark:text-white font-semibold">${basePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 dark:text-gray-400">Quantity</span>
            <span className="text-gray-900 dark:text-white">{quantity}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 dark:text-gray-400">Shipping</span>
            <span className="text-gray-900 dark:text-white">${shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-blue-600 dark:text-blue-400">${totalPrice}</span>
          </div>
        </div>

        {/* Express Checkout - only after "Continue to Payment"; hidden when resubmitting after fulfillment failure */}
        {showPaymentForm && !succeededPaymentIntentId && (
          paymentIntentClientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret: paymentIntentClientSecret }}>
              <ExpressCheckout
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
                clientSecret={paymentIntentClientSecret}
                disabled={loading}
              />
            </Elements>
          ) : (
            <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              {loading ? 'Preparing payment...' : !paymentIntentClientSecret && !error ? 'Loading payment options...' : null}
              {!stripePromise && 'Stripe not configured'}
            </div>
          )
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Shipping Form */}
        {showShippingForm && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white uppercase tracking-wide text-sm mb-4">
              Shipping Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Full Name"
                value={shippingInfo.name}
                onChange={(e) => setShippingInfo({...shippingInfo, name: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="email"
                placeholder="Email"
                value={shippingInfo.email}
                onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Address"
                value={shippingInfo.address}
                onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                className="col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="City"
                value={shippingInfo.city}
                onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="State"
                value={shippingInfo.state}
                onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="ZIP Code"
                value={shippingInfo.zip}
                onChange={(e) => setShippingInfo({...shippingInfo, zip: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                value={shippingInfo.country}
                onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>
        )}

        {/* After payment succeeded but fulfillment failed: show corrected-address resubmit (no payment form) */}
        {succeededPaymentIntentId && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Payment was successful. Update your address above if needed, then click below to resubmit your order. You will not be charged again.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handlePaymentSuccess(succeededPaymentIntentId, shippingInfo)}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit corrected address'
              )}
            </button>
          </div>
        )}

        {/* Payment Form (only when payment has not already succeeded and we have a single clientSecret) */}
        {showPaymentForm && paymentIntentClientSecret && !paymentSuccess && !succeededPaymentIntentId && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Information</h3>
            {!showShippingForm && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                💡 Using Apple Pay or Google Pay? Your shipping address will be automatically filled from your payment method!
              </p>
            )}
            {/* Show error prominently if it exists */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Order Fulfillment Error</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <PaymentForm
              amount={parseFloat(totalPrice)}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              shippingInfo={shippingInfo}
              orderDetails={{
                designId: design.id,
                imageUrl: design.imageUrl,
                title: designTitle,
                size,
                color: selectedColor.value,
                quantity,
              }}
              clientSecret={paymentIntentClientSecret}
              submitDisabled={loading}
            />
          </div>
        )}

        {/* Checkout Button */}
        {!showPaymentForm && (
          <div className="space-y-3">
            <button
              onClick={handleCompleteOrder}
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                '💳 Continue to Payment'
              )}
            </button>
          </div>
        )}

        {paymentSuccess && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200 text-center">
              ✓ Payment successful! Processing your order...
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Secure payment powered by Stripe. Your order will be fulfilled by Printful.
        </p>
      </div>
    </div>
  )
}

