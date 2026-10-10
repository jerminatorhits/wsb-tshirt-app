import Link from 'next/link'
import DropProductGrid from '@/components/DropProductGrid'
import { CURRENT_DROP } from '@/lib/drops'
import { formatShippedPrice } from '@/lib/products'

export default function HomePage() {
  const drop = CURRENT_DROP
  const priceLabel = formatShippedPrice('mug')

  return (
    <main className="mx-auto max-w-2xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      {/* Compact masthead — brand + promise, not a full-viewport billboard */}
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
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm text-neutral-500">
          <span>{priceLabel}</span>
          <span aria-hidden className="text-neutral-300">
            ·
          </span>
          <span>Printed to order</span>
        </p>
      </header>

      {/* Product grid — the shop opens on product, streetwear-style */}
      <section id="drop" className="pt-5" aria-labelledby="drop-heading">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2
            id="drop-heading"
            className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] text-neutral-600"
            style={{ fontFamily: 'var(--font-design-mono), ui-monospace, monospace' }}
          >
            {drop.label}
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          </h2>
        </div>

        <DropProductGrid drop={drop} products={drop.products} priceLabel={priceLabel} />
      </section>

      {/* Generator — secondary path, one compact strip */}
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
    </main>
  )
}
