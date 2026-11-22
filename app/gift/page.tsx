import Link from 'next/link'
import {
  CHRISTMAS_ORDER_BY_LABEL,
  crashWeekPromoLine,
  isBeforeChristmasCutoff,
  PROCESSING_COPY,
  US_DELIVERY_COPY,
  formatPriceWithShipping,
} from '@/lib/fulfillment-copy'

export default function GiftPage() {
  const priceLabel = formatPriceWithShipping('mug')
  const beforeCutoff = isBeforeChristmasCutoff()
  const promoLine = crashWeekPromoLine()

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 text-neutral-700">
      <h1 className="text-2xl font-semibold text-neutral-900">Gifts</h1>
      <p className="mt-3 text-sm leading-relaxed">
        Ship a mug to someone else at checkout. White glossy ceramic, printed to order, stamped
        STONKMUGS on the print.
      </p>
      {promoLine && (
        <p className="mt-3 rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-2 text-sm text-white">
          {promoLine}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm">
        {beforeCutoff ? (
          <>
            <p className="font-medium text-neutral-900">
              Order by {CHRISTMAS_ORDER_BY_LABEL} for Christmas delivery
            </p>
            <p className="mt-1.5 text-neutral-600">
              Made in {PROCESSING_COPY}, then US delivery usually {US_DELIVERY_COPY}. After{' '}
              {CHRISTMAS_ORDER_BY_LABEL} we can&apos;t promise holiday arrival.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-neutral-900">Christmas cutoff has passed</p>
            <p className="mt-1.5 text-neutral-600">
              Orders still ship on the usual timeline (make {PROCESSING_COPY}, deliver{' '}
              {US_DELIVERY_COPY}), just not guaranteed for Christmas.
            </p>
          </>
        )}
      </div>

      <ul className="mt-6 space-y-2 text-sm text-neutral-600">
        <li>
          <strong className="font-medium text-neutral-900">Price:</strong> {priceLabel}
        </li>
        <li>
          <strong className="font-medium text-neutral-900">Returns:</strong> custom prints are final
          sale except damage or defects
        </li>
      </ul>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/#drop" className="rh-btn-primary inline-flex w-auto px-5">
          Browse drops
        </Link>
        <Link href="/create" className="rh-btn-secondary inline-flex w-auto px-5">
          Make a ticker mug
        </Link>
      </div>
    </main>
  )
}
