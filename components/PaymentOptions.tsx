'use client'

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
    productType?: 'shirt' | 'mug'
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
  /** Card billing address (may differ from ship-to). Defaults to shipping when omitted. */
  billingInfo?: {
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

/**
 * Card + wallet checkout (Google Pay / Apple Pay via Payment Element when available).
 * Link is turned off in Stripe Payment Method Configuration.
 */
export default function PaymentOptions({
  clientSecret,
  amount,
  onSuccess,
  onError,
  orderDetails,
  shippingInfo,
  billingInfo,
  disabled: disabledByParent = false,
}: PaymentOptionsProps) {
  if (!clientSecret) {
    return <p className="text-sm text-zinc-500">Initializing payment options…</p>
  }

  return (
    <PaymentForm
      useParentElements
      clientSecret={clientSecret}
      amount={amount}
      onSuccess={onSuccess}
      onError={onError}
      shippingInfo={shippingInfo}
      billingInfo={billingInfo}
      orderDetails={orderDetails}
      submitDisabled={disabledByParent}
      cardOnlyWallets={false}
    />
  )
}
