import type { Metadata } from 'next'
import Link from 'next/link'
import { fontAnton, fontBebas, fontJetbrains, fontOswald } from '@/lib/design-fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'WSB Shirt Lab',
  description: 'Put your ticker on a mug or tee. Printed to order.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${fontAnton.variable} ${fontBebas.variable} ${fontOswald.variable} ${fontJetbrains.variable}`}
    >
      <body className="min-h-screen bg-background text-neutral-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <header>
            <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-5">
              <Link href="/" className="text-sm font-semibold tracking-tight text-neutral-900">
                WSB Shirt Lab
              </Link>
              <Link href="/contact" className="text-sm text-neutral-500 hover:text-neutral-900">
                Contact
              </Link>
            </div>
          </header>
          <div className="flex-1">{children}</div>
          <footer className="mt-auto">
            <div className="mx-auto flex w-full max-w-lg flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-8 text-sm text-neutral-400">
              <Link href="/shipping" className="hover:text-neutral-700">
                Shipping
              </Link>
              <Link href="/returns" className="hover:text-neutral-700">
                Returns
              </Link>
              <Link href="/privacy" className="hover:text-neutral-700">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-neutral-700">
                Terms
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
