'use client'

import { useState, useEffect } from 'react'
import { useStripe } from '@stripe/react-stripe-js'

interface ExpressCheckoutProps {
  amount: number
  onSuccess: (paymentIntentId: string, shippingInfo: any) => void
  onError: (error: string) => void
  orderDetails: {
    designId: string
    imageUrl: string
    title: string
    size: string
    color: string
    quantity: number
  }
  clientSecret: string | null
  /** When true, keep buttons disabled (e.g. fulfillment in progress); prevents double-submit */
  disabled?: boolean
}

export default function ExpressCheckout({ 
  amount, 
  onSuccess, 
  onError, 
  orderDetails,
  clientSecret,
  disabled: disabledByParent = false,
}: ExpressCheckoutProps) {
  const stripe = useStripe()
  const [paymentRequest, setPaymentRequest] = useState<any>(null)
  const [canMakePayment, setCanMakePayment] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<{applePay: boolean, googlePay: boolean}>({applePay: false, googlePay: false})
  const [loading, setLoading] = useState(false)
  const isDisabled = loading || disabledByParent

  const wrappedOnError = (msg: string) => {
    setLoading(false)
    onError(msg)
  }

  // When parent stops loading (fulfillment done or failed), reset so buttons aren't stuck disabled
  useEffect(() => {
    if (!disabledByParent) setLoading(false)
  }, [disabledByParent])

  useEffect(() => {
    if (!stripe || !clientSecret) {
      console.log('ExpressCheckout: Missing stripe or clientSecret', { stripe: !!stripe, clientSecret: !!clientSecret })
      return
    }

    console.log('ExpressCheckout: Creating payment request...', {
      amount,
      currency: 'usd',
      clientSecret: clientSecret.substring(0, 20) + '...',
    })
    
    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: orderDetails?.title || 'T-Shirt Order',
        amount: Math.round(amount * 100), // Convert to cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestShipping: true,
    })

    // Check if payment methods are available
    pr.canMakePayment().then((result: any) => {
      console.log('ExpressCheckout: canMakePayment result', result)
      console.log('ExpressCheckout: Browser info', {
        userAgent: navigator.userAgent,
        isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
        isChrome: /chrome/i.test(navigator.userAgent),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        isMacOS: /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent),
      })
      if (result) {
        setPaymentRequest(pr)
        setCanMakePayment(true)
        setPaymentMethods({
          applePay: result.applePay || false,
          googlePay: result.googlePay || false,
        })
        console.log('ExpressCheckout: Payment methods available', { applePay: result.applePay, googlePay: result.googlePay })
      } else {
        console.log('ExpressCheckout: No payment methods available - result was:', result)
        console.log('ExpressCheckout: This might be because:')
        console.log('  1. Apple Pay is not enabled in device settings (iOS/macOS)')
        console.log('  2. Payment methods are not enabled in Stripe Dashboard')
        console.log('  3. Browser does not support Payment Request API')
        console.log('  4. Site is not using HTTPS (required for production)')
      }
    }).catch((error) => {
      console.error('ExpressCheckout: Error checking payment methods', error)
    })

    // Handle payment method submission
    pr.on('paymentmethod', async (ev: any) => {
      setLoading(true)
      try {
        // Confirm payment with the payment method from the payment request
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret!,
          {
            payment_method: ev.paymentMethod.id,
          },
          { handleActions: false }
        )

        if (confirmError) {
          ev.complete('fail')
          wrappedOnError(confirmError.message || 'Payment failed')
        } else {
          ev.complete('success')

          // Extract shipping info from payment request
          let finalShippingInfo: any = {}
          if (ev.shippingAddress) {
            finalShippingInfo = {
              name: ev.payerName || '',
              email: ev.payerEmail || '',
              address: ev.shippingAddress.addressLine?.[0] || '',
              city: ev.shippingAddress.city || '',
              state: ev.shippingAddress.region || '',
              zip: ev.shippingAddress.postalCode || '',
              country: ev.shippingAddress.country || 'US',
            }
          }

          if (paymentIntent && paymentIntent.status === 'succeeded') {
            onSuccess(paymentIntent.id, finalShippingInfo)
          } else if (paymentIntent && paymentIntent.status === 'requires_action') {
            // Handle 3D Secure or other actions
            const { error: actionError, paymentIntent: updatedPaymentIntent } = await stripe.confirmCardPayment(clientSecret!)
            if (actionError) {
              wrappedOnError(actionError.message || 'Payment authentication failed')
            } else if (updatedPaymentIntent && updatedPaymentIntent.status === 'succeeded') {
              onSuccess(updatedPaymentIntent.id, finalShippingInfo)
            }
          }
        }
      } catch (err: any) {
        ev.complete('fail')
        wrappedOnError(err.message || 'An error occurred')
      }
    })
    // onSuccess and onError are stable callbacks from parent, don't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe, clientSecret, amount, orderDetails])

  const handleExpressPayment = () => {
    if (paymentRequest && !isDisabled) {
      paymentRequest.show()
    }
  }

  // Debug: Show if component is rendering but payment methods aren't available
  if (!stripe || !clientSecret) {
    return (
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">Initializing payment options...</p>
      </div>
    )
  }

  // Show a message if payment methods aren't available
  // Always show the section so users know express checkout is being checked
  if (!canMakePayment || !paymentRequest) {
    // Check if we're in a browser that might support it
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    const isChrome = /chrome/i.test(navigator.userAgent) && !/edg/i.test(navigator.userAgent)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /android/i.test(navigator.userAgent)
    const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent)
    
    // Show a helpful message explaining why express payment methods might not be available
    return (
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 tracking-wide">
          Express Checkout
        </h3>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
            <strong>Express payment methods loading...</strong>
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {isSafari && (isIOS || isMacOS) 
              ? 'Apple Pay should be available in Safari. Make sure it&apos;s enabled in your device settings and Stripe Dashboard.'
              : isChrome
              ? 'Google Pay should be available in Chrome. Apple Pay requires Safari on macOS/iOS.'
              : 'Express payment methods require Safari (for Apple Pay) or Chrome (for Google Pay).'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 tracking-wide">
        Express Checkout
      </h3>
      <div className="flex flex-col gap-3">
        {paymentMethods.applePay && (
          <button
            type="button"
            onClick={handleExpressPayment}
            disabled={isDisabled}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span>Apple Pay</span>
          </button>
        )}
        {paymentMethods.googlePay && (
          <button
            type="button"
            onClick={handleExpressPayment}
            disabled={isDisabled}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-white text-gray-800 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google Pay</span>
          </button>
        )}
      </div>
      {(paymentMethods.applePay || paymentMethods.googlePay) && (
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">OR</span>
          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
        </div>
      )}
    </div>
  )
}

