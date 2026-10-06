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
      <body className="bg-background text-neutral-900 antialiased">
        <div className="flex h-dvh flex-col overflow-hidden">
          <header className="shrink-0 border-b border-neutral-200/80">
            <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3 sm:px-6">
              <Link href="/" className="text-sm font-semibold tracking-tight text-neutral-900">
                WSB Shirt Lab
              </Link>
              <Link href="/contact" className="text-sm text-neutral-500 hover:text-neutral-900">
                Contact
              </Link>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          <footer className="shrink-0 border-t border-neutral-200/80">
            <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-0.5 px-4 py-2.5 text-xs text-neutral-400 sm:px-6">
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
