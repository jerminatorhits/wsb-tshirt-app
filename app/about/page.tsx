import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 text-neutral-700">
      <h1 className="text-2xl font-semibold text-neutral-900">About</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed">
        <p>
          <strong className="font-medium text-neutral-900">stonkmugs</strong> makes limited merch for market
          moments: mugs (and more) stamped with the jokes and tickers that hit the timeline.
        </p>
        <p>
          We run small drops, print to order, and ship through Printful. Nothing sits in a warehouse waiting to
          go stale. Your order is produced after you buy.
        </p>
        <p>
          <strong className="font-medium text-neutral-900">Shipping:</strong> Most orders are produced within
          2–5 business days, then US delivery usually takes 3–7 business days after that. You get tracking by
          email when it ships.
        </p>
        <p>
          Questions?{' '}
          <Link href="/contact" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
