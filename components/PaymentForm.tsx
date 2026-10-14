'use client'

import { useState, FormEvent, useEffect } from 'react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js'
import { validateShippingAddress } from '@/lib/validate-address'

// Get the publishable key from environment
const getStripePublishableKey = () => {
  if (typeof window !== 'undefined') {
    // Client-side: try to get from window or process.env
    return (window as any).__STRIPE_PUBLISHABLE_KEY__ || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  }
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
}

const stripePublishableKey = getStripePublishableKey()
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

interface PaymentFormProps {
  amount: number
  onSuccess: (paymentIntentId: string, shippingInfo?: any) => void
  onError: (error: string) => void
  shippingInfo: {
    name: string
    email: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  /** Card billing details; falls back to shippingInfo when omitted. */
  billingInfo?: {
    name: string
    email: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  orderDetails?: {
    designId: string
    imageUrl: string
    title: string
    size: string
    color: string
    quantity: number
    productType?: 'shirt' | 'mug'
  }
  /** When provided, use this PaymentIntent (no creation); used by Checkout for one-PI-per-checkout flow */
  clientSecret?: string
  /** When true, keep submit disabled (e.g. fulfillment in progress); prevents double-submit */
  submitDisabled?: boolean
  /**
   * Render only the form under an existing parent `<Elements>`. (Avoids double-wrapping with Elements.)
   * When true, Apple/Google Pay in PaymentElement is hidden; use PaymentOptions for wallets.
   */
  useParentElements?: boolean
  /** When true (default with useParentElements), Apple Pay and Google Pay are not shown inside PaymentElement */
  cardOnlyWallets?: boolean
}

function CheckoutForm({
  amount,
  onSuccess,
  onError: _onError,
  shippingInfo,
  billingInfo,
  orderDetails,
  clientSecret,
  submitDisabled,
  cardOnlyWallets = true,
}: PaymentFormProps & { clientSecret: string; cardOnlyWallets?: boolean }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isProcessing = loading || submitDisabled
  const resolvedBilling = billingInfo ?? shippingInfo

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const billingCheck = validateShippingAddress({
        ...resolvedBilling,
        email: resolvedBilling.email || shippingInfo.email,
      })
      if (!billingCheck.valid) {
        setErrorMessage(billingCheck.error || 'Please check your billing address.')
        setLoading(false)
        return
      }

      // First, submit the elements to validate the form
      // This must be called before confirmPayment()
      const { error: submitError } = await elements.submit()

      if (submitError) {
        // Stripe Payment Element already shows the field-level message (e.g. under ZIP).
        // Do not mirror it into a second banner.
        setErrorMessage(null)
        setLoading(false)
        return
      }

      // Confirm payment using the existing clientSecret
      // Shipping stays on the PI; billing goes on the payment method.
      const confirmParams: any = {
        return_url: `${window.location.origin}/order-success`,
        payment_method_data: {
          billing_details: {
            phone: null,
            email: resolvedBilling.email || shippingInfo.email || null,
            ...(resolvedBilling.name && resolvedBilling.address
              ? {
                  name: resolvedBilling.name,
                  address: {
                    line1: resolvedBilling.address,
                    city: resolvedBilling.city,
                    state: resolvedBilling.state,
                    postal_code: resolvedBilling.zip,
                    country: resolvedBilling.country,
                  },
                }
              : {}),
          },
        },
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams,
        redirect: 'if_required',
      })

      if (error) {
        // One banner above Pay — do not also push to Checkout (that duplicated the message).
        setErrorMessage(error.message || 'Payment failed')
        setLoading(false)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Extract shipping info from payment intent if available (from Apple Pay/Google Pay)
        // Express payment methods like Apple Pay/Google Pay will populate paymentIntent.shipping
        let finalShippingInfo = shippingInfo
        
        if (paymentIntent.shipping) {
          finalShippingInfo = {
            name: paymentIntent.shipping.name || shippingInfo.name || '',
            email: shippingInfo.email, // Email typically comes from billing details
            address: paymentIntent.shipping.address?.line1 || shippingInfo.address || '',
            city: paymentIntent.shipping.address?.city || shippingInfo.city || '',
            state: paymentIntent.shipping.address?.state || shippingInfo.state || '',
            zip: paymentIntent.shipping.address?.postal_code || shippingInfo.zip || '',
            country: paymentIntent.shipping.address?.country || shippingInfo.country || 'US',
          }
        }

        // Get email from payment intent if available
        // Note: charges property may not be available in all PaymentIntent objects
        // We'll get email from billing_details if available
        if ((paymentIntent as any).charges?.data?.[0]?.billing_details?.email) {
          finalShippingInfo.email = (paymentIntent as any).charges?.data?.[0]?.billing_details?.email || ''
        }

        // Payment succeeded - call onSuccess; keep loading true until fulfillment completes or errors (parent will call onError)
        onSuccess(paymentIntent.id, finalShippingInfo)
      } else {
        setLoading(false)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred')
      setLoading(false)
    }
  }
  
  // Also reset loading when fulfillment fails (called from parent via onError)
  // We need to listen for when the parent's error state changes
  // For now, we'll handle it by ensuring onError always resets loading

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-xl border border-neutral-200 bg-white px-3 py-3">
        <PaymentElement
          options={{
            layout: 'tabs',
            // Shipping already collected — hide billing + Link signup so the form is card-only.
            fields: {
              billingDetails: {
                name: 'never',
                email: 'never',
                phone: 'never',
                address: 'never',
              },
            },
            // link is supported at runtime; @stripe/stripe-js@3 types omit it
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
              link: 'never',
            } as { applePay: 'auto'; googlePay: 'auto'; link: 'never' },
            terms: {
              card: 'never',
            },
          }}
        />
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5" role="alert">
          <p className="text-sm font-medium text-red-900">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="rh-btn-primary"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {submitDisabled ? 'Processing order…' : 'Processing…'}
          </span>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </button>

      <div className="space-y-1.5 text-center">
        <p className="text-[11px] leading-relaxed text-neutral-400">
          Printed to order · Ships in ~1–2 weeks · Tracking by email
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Secure payment powered by Stripe</span>
        </div>
      </div>
    </form>
  )
}

export default function PaymentForm(props: PaymentFormProps) {
  const [stripeKey, setStripeKey] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(!props.clientSecret)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
    setStripeKey(key)

    // When parent provides clientSecret (Checkout flow), use it and do not create another PaymentIntent
    if (props.clientSecret) {
      setClientSecret(props.clientSecret)
      setLoading(false)
      return
    }

    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(props.amount * 100),
            shipping: props.shippingInfo,
            orderDetails: props.orderDetails,
          }),
        })
        const data = await response.json()
        if (data.error || !data.clientSecret) {
          setError(data.error || 'Failed to initialize payment')
          setLoading(false)
        } else {
          setClientSecret(data.clientSecret)
          setLoading(false)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to create payment intent')
        setLoading(false)
      }
    }

    if (key) createPaymentIntent()
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.clientSecret])

  const effectiveClientSecret = props.clientSecret ?? clientSecret

  const getOptions = (): StripeElementsOptions => ({
    clientSecret: effectiveClientSecret || undefined,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#059669',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
    // The PaymentIntent controls available method types (card-only in checkout flow).
  })

  if (loading && !effectiveClientSecret) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Initializing payment...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4" role="alert">
        <p className="text-sm font-medium text-red-900">{error}</p>
      </div>
    )
  }

  if (props.useParentElements && effectiveClientSecret) {
    return (
      <CheckoutForm
        {...props}
        orderDetails={props.orderDetails}
        clientSecret={effectiveClientSecret}
        cardOnlyWallets={props.cardOnlyWallets !== false}
      />
    )
  }

  if (!stripeKey) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4" role="alert">
        <p className="text-sm font-medium text-amber-950">
          Stripe publishable key not configured. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env file and restart the server.
        </p>
      </div>
    )
  }

  if (!stripePromise) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4" role="alert">
        <p className="text-sm font-medium text-red-900">
          Failed to initialize Stripe. Please check your publishable key.
        </p>
      </div>
    )
  }

  if (!effectiveClientSecret) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4" role="alert">
        <p className="text-sm font-medium text-red-900">
          Failed to create payment intent. Please try again.
        </p>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={getOptions()}>
      <CheckoutForm
        {...props}
        orderDetails={props.orderDetails}
        clientSecret={effectiveClientSecret}
        cardOnlyWallets={props.cardOnlyWallets}
      />
    </Elements>
  )
}

