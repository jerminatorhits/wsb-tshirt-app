import Link from 'next/link'
import DropNotifyForm from '@/components/DropNotifyForm'
import DropProductGrid from '@/components/DropProductGrid'
import { CURRENT_DROP } from '@/lib/drops'
import { dropAvailabilityLine, isDropLive } from '@/lib/drop-window'
import {
  CHRISTMAS_ORDER_BY_LABEL,
  crashWeekPromoLine,
  formatPriceWithShipping,
  isBeforeChristmasCutoff,
} from '@/lib/fulfillment-copy'
import { formatShippedPrice } from '@/lib/products'

export default function HomePage() {
  const drop = CURRENT_DROP
  const priceLabel = formatShippedPrice('mug')
  const priceWithShip = formatPriceWithShipping('mug')
  const availability = dropAvailabilityLine(drop)
  const live = isDropLive(drop)
  const showHoliday = isBeforeChristmasCutoff()
  const promoLine = crashWeekPromoLine()

  return (
    <main className="mx-auto max-w-2xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      {(promoLine || showHoliday) && (
        <div className="mb-4 space-y-2">
          {promoLine && (
            <p className="rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-2.5 text-sm text-white">
              Crash week special: <span className="font-semibold">{promoLine}</span>
              {' · '}
              <a href="#drop" className="underline underline-offset-2">
                Pick a mug
              </a>
            </p>
          )}
          {showHoliday && (
            <p className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
              Order by <span className="font-medium text-neutral-900">{CHRISTMAS_ORDER_BY_LABEL}</span> for
              Christmas delivery.{' '}
              <Link href="/gift" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
                Gift guide
              </Link>
            </p>
          )}
        </div>
      )}

      <header className="border-b border-neutral-200 pb-5">
        <h1
          className="text-[2.35rem] font-normal leading-[0.92] tracking-tight text-neutral-900 sm:text-5xl"
          style={{ fontFamily: 'var(--font-design-anton), Impact, sans-serif' }}
        >
          stonkmugs
        </h1>
        <p
          className="mt-2 text-lg font-normal leading-snug tracking-tight text-neutral-700 sm:text-xl"
          style={{ fontFamily: 'var(--font-design-anton), Impact, sans-serif' }}
        >
          The market moves. We make the merch.
        </p>
        <p className="mt-2 text-sm text-neutral-500">{priceWithShip}</p>
      </header>

      <section id="drop" className="pt-5" aria-labelledby="drop-heading">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2
              id="drop-heading"
              className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] text-neutral-600"
              style={{ fontFamily: 'var(--font-design-mono), ui-monospace, monospace' }}
            >
              {drop.label}
              {live && (
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
            </h2>
            {availability && <p className="mt-1 text-xs text-neutral-500">{availability}</p>}
          </div>
        </div>

        {live ? (
          <DropProductGrid drop={drop} products={drop.products} priceLabel={priceLabel} />
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-600">
            <p className="font-medium text-neutral-900">This drop window has ended.</p>
            <p className="mt-1">Leave your email and we&apos;ll tell you when the next one opens.</p>
            <div className="mt-4">
              <DropNotifyForm compact />
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-neutral-200 bg-white px-4 py-4">
        <p className="text-sm font-medium text-neutral-900">Buying for a friend?</p>
        <p className="mt-1 text-sm text-neutral-600">
          Ship straight to them at checkout. Same price, no extra steps.
        </p>
        <Link
          href="/gift"
          className="mt-3 inline-flex text-sm font-medium text-neutral-900 underline-offset-2 hover:underline"
        >
          Gift guide →
        </Link>
      </section>

      <section className="mt-8 border-t border-neutral-200 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2
              className="text-lg font-normal tracking-tight text-neutral-900"
              style={{ fontFamily: 'var(--font-design-anton), Impact, sans-serif' }}
            >
              Can&apos;t find your ticker?
            </h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              Enter a ticker, pick a price, make your own.
            </p>
          </div>
          <Link href="/create" className="rh-btn-secondary inline-flex w-auto shrink-0 px-5 py-2.5">
            Ticker generator
          </Link>
        </div>
      </section>

      {live && (
        <section className="mt-8 border-t border-neutral-200 pt-6">
          <h2
            className="text-lg font-normal tracking-tight text-neutral-900"
            style={{ fontFamily: 'var(--font-design-anton), Impact, sans-serif' }}
          >
            Get the next drop
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            No spam. Just a note when a new drop goes live.
          </p>
          <div className="mt-3">
            <DropNotifyForm compact />
          </div>
        </section>
      )}
    </main>
  )
}
