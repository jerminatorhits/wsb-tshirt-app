'use client'

import { useState, useEffect } from 'react'
import { useStripe } from '@stripe/react-stripe-js'
import PaymentForm from './PaymentForm'

interface PaymentOptionsProps {
  clientSecret: string
  amount: number
  onSuccess: (paymentIntentId: string, shippingInfo?: any) => void
  onError: (error: string) => void
  orderDetails: {
    designId: string
    imageUrl: string
    title: string
    size: string
    color: string
    quantity: number
  }
  shippingInfo: {
    name: string
    email: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  disabled?: boolean
}

export default function PaymentOptions({
  clientSecret,
  amount,
  onSuccess,
  onError,
  orderDetails,
  shippingInfo,
  disabled: disabledByParent = false,
}: PaymentOptionsProps) {
  const stripe = useStripe()
  const [paymentRequest, setPaymentRequest] = useState<{ show: () => void } | null>(null)
  const [probing, setProbing] = useState(true)
  const [canMakePayment, setCanMakePayment] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState({ applePay: false, googlePay: false })
  const [loading, setLoading] = useState(false)

  const isDisabled = loading || disabledByParent

  const wrappedOnError = (msg: string) => {
    setLoading(false)
    onError(msg)
  }

  useEffect(() => {
    if (!disabledByParent) setLoading(false)
  }, [disabledByParent])

  useEffect(() => {
    if (!stripe || !clientSecret) {
      return
    }

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: orderDetails?.title || 'T-Shirt Order',
        amount: Math.round(amount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestShipping: true,
    })

    pr.canMakePayment()
      .then((result: { applePay?: boolean; googlePay?: boolean } | null) => {
        setProbing(false)
        if (result) {
          setPaymentRequest(pr)
          setCanMakePayment(true)
          setPaymentMethods({
            applePay: Boolean(result.applePay),
            googlePay: Boolean(result.googlePay),
          })
        } else {
          setPaymentRequest(null)
          setCanMakePayment(false)
          setPaymentMethods({ applePay: false, googlePay: false })
        }
      })
      .catch(() => {
        setProbing(false)
        setCanMakePayment(false)
      })

    pr.on('paymentmethod', async (ev: any) => {
      setLoading(true)
      try {
        const { error: confirmError, paymentIntent } = await stripe!.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        )

        if (confirmError) {
          ev.complete('fail')
          wrappedOnError(confirmError.message || 'Payment failed')
        } else {
          ev.complete('success')

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
            const { error: actionError, paymentIntent: updated } = await stripe!.confirmCardPayment(clientSecret)
            if (actionError) {
              wrappedOnError(actionError.message || 'Payment authentication failed')
            } else if (updated && updated.status === 'succeeded') {
              onSuccess(updated.id, finalShippingInfo)
            }
          }
        }
      } catch (err: any) {
        ev.complete('fail')
        wrappedOnError(err?.message || 'An error occurred')
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSuccess/onError stable
  }, [stripe, clientSecret, amount, orderDetails?.title])

  const showExpress = () => {
    if (paymentRequest && !isDisabled) {
      paymentRequest.show()
    }
  }

  const expressHint = (() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent)
    if (isSafari && isMacOS) {
      return 'Enable Apple Pay in System Settings and in the Stripe Dashboard.'
    }
    if (/chrome/i.test(navigator.userAgent) && !/edg/i.test(navigator.userAgent)) {
      return 'Use Chrome for Google Pay. Apple Pay works in Safari on supported devices.'
    }
    return 'Wallets work best in Safari (Apple Pay) or Chrome (Google Pay).'
  })()

  if (!stripe || !clientSecret) {
    return <p className="text-sm text-zinc-500">Initializing payment options…</p>
  }

  return (
    <div className="space-y-4">
      {probing && (
        <p className="text-xs text-zinc-500" aria-live="polite">
          Checking for Apple Pay and Google Pay…
        </p>
      )}

      {!probing && canMakePayment && (
        <div className="space-y-2">
          {paymentMethods.applePay && (
            <button
              type="button"
              onClick={showExpress}
              disabled={isDisabled || !paymentRequest}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-black px-6 py-4 font-semibold text-white shadow-md transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span>Apple Pay</span>
            </button>
          )}
          {paymentMethods.googlePay && (
            <button
              type="button"
              onClick={showExpress}
              disabled={isDisabled || !paymentRequest}
              className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-zinc-500 bg-white px-6 py-4 font-semibold text-zinc-900 shadow-md transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Google Pay</span>
            </button>
          )}
        </div>
      )}

      {!probing && canMakePayment && (
        <div className="relative py-1">
          <div className="h-px w-full bg-zinc-700" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 px-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Or pay with card
          </span>
        </div>
      )}

      {!probing && !canMakePayment && (
        <p className="text-xs text-zinc-500">{expressHint}</p>
      )}

      <div>
        <PaymentForm
          useParentElements
          clientSecret={clientSecret}
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
          shippingInfo={shippingInfo}
          orderDetails={orderDetails}
          submitDisabled={disabledByParent}
          cardOnlyWallets
        />
      </div>
    </div>
  )
}
