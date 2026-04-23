import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'WSB Shirt Lab',
  description: 'WallStreet Bets style tees — ticker, price, and options. YOLO energy, real shirts.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/85 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
              <Link href="/" className="text-sm font-semibold tracking-wide text-zinc-100 hover:text-emerald-300 sm:text-base">
                WSB Shirt Lab
              </Link>
              <nav className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 sm:gap-4 sm:text-sm">
                <Link href="/shipping" className="hover:text-zinc-200">
                  Shipping
                </Link>
                <Link href="/returns" className="hover:text-zinc-200">
                  Returns
                </Link>
                <Link href="/contact" className="hover:text-zinc-200">
                  Contact
                </Link>
                <Link href="/privacy" className="hover:text-zinc-200">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-zinc-200">
                  Terms
                </Link>
              </nav>
            </div>
          </header>
          <div className="flex-1">{children}</div>
          <footer className="border-t border-zinc-800/80 bg-zinc-950/80">
            <div className="mx-auto w-full max-w-6xl px-4 py-5 text-center text-xs text-zinc-500">
              <p>Payments by Stripe. Fulfillment by Printful.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}

