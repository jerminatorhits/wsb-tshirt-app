import type { OrderSummary } from '@/lib/order-summary'

function statusLabel(order: OrderSummary): string {
  if (order.isDryRun) return 'Test order — not sent to print'
  if (order.fulfillmentStatus === 'fulfilled') return 'In production'
  if (order.fulfillmentStatus === 'pending') return 'Processing'
  return order.fulfillmentStatus.replace(/_/g, ' ')
}

export default function OrderSummaryCard({ order }: { order: OrderSummary }) {
  const itemBits = [
    order.item.productLabel,
    order.item.size,
    order.item.productType !== 'mug' ? order.item.color : null,
    `Qty ${order.item.quantity}`,
  ].filter(Boolean)

  return (
    <div className="mt-6 w-full rounded-xl border border-neutral-200 bg-white text-left">
      <div className="border-b border-neutral-100 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Confirmation</p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-900">
          {order.orderNumber || `Ref ${order.paymentIntentShort}`}
        </p>
        <p className="mt-1 text-sm text-neutral-500">{statusLabel(order)}</p>
      </div>

      <div className="space-y-3 px-4 py-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">Item</p>
          <p className="mt-0.5 font-medium text-neutral-900">{order.item.title}</p>
          <p className="text-neutral-500">{itemBits.join(' · ')}</p>
        </div>

        {order.shipping && (
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-400">Ship to</p>
            {order.shipping.name && (
              <p className="mt-0.5 font-medium text-neutral-900">{order.shipping.name}</p>
            )}
            {order.shipping.localityLine && (
              <p className="text-neutral-500">{order.shipping.localityLine}</p>
            )}
            {order.shipping.email && (
              <p className="text-neutral-500">{order.shipping.email}</p>
            )}
          </div>
        )}

        <div className="space-y-1 border-t border-neutral-100 pt-3">
          {order.amounts.subtotalCents != null && (
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span className="tabular-nums">
                ${(order.amounts.subtotalCents / 100).toFixed(2)}
              </span>
            </div>
          )}
          {order.amounts.shippingCents != null && (
            <div className="flex justify-between text-neutral-500">
              <span>Shipping</span>
              <span className="tabular-nums">
                ${(order.amounts.shippingCents / 100).toFixed(2)}
              </span>
            </div>
          )}
          {order.amounts.taxCents != null && order.amounts.taxCents > 0 && (
            <div className="flex justify-between text-neutral-500">
              <span>Tax</span>
              <span className="tabular-nums">${(order.amounts.taxCents / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-neutral-500">Total paid</span>
            <span className="text-base font-semibold tabular-nums text-neutral-900">
              {order.amounts.totalDisplay}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-100 px-4 py-3 text-xs text-neutral-400">
        <p>
          Support ref: <span className="tabular-nums">{order.paymentIntentShort}</span>
          {order.printfulOrderId ? (
            <>
              {' '}
              · Fulfillment:{' '}
              <span className="tabular-nums">{order.printfulOrderId}</span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  )
}
