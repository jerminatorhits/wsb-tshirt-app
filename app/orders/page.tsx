'use client'

import { FormEvent, useState } from 'react'
import OrderSummaryCard from '@/components/OrderSummaryCard'
import type { OrderSummary } from '@/lib/order-summary'

export default function OrdersLookupPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<OrderSummary | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOrder(null)
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email }),
      })
      const data = await res.json()
      if (!data.success || !data.order) {
        setError(data.error || 'Order not found')
        return
      }
      setOrder(data.order as OrderSummary)
    } catch {
      setError('Could not look up order. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Find your order</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Enter the confirmation number from your receipt and the email used at checkout.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div>
          <label className="rh-label" htmlFor="order-number">
            Order number
          </label>
          <input
            id="order-number"
            name="orderNumber"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="WSB-7K4M2Q"
            className="rh-input"
            autoComplete="off"
            required
          />
        </div>
        <div>
          <label className="rh-label" htmlFor="order-email">
            Email
          </label>
          <input
            id="order-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="rh-input"
            autoComplete="email"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="rh-btn-primary">
          {loading ? 'Looking up…' : 'Look up order'}
        </button>
      </form>

      {order && (
        <div className="mt-2">
          <OrderSummaryCard order={order} />
          <p className="mt-4 text-center text-sm text-neutral-500">
            <a href="/" className="hover:text-neutral-900">
              Back to shop
            </a>
          </p>
        </div>
      )}
    </main>
  )
}
