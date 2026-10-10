'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { DropCollection, DropProduct } from '@/lib/drops'
import DropProductThumb from '@/components/DropProductThumb'

const PAGE_SIZE = 6

type Props = {
  drop: DropCollection
  products: DropProduct[]
  priceLabel: string
}

export default function DropProductGrid({ drop, products, priceLabel }: Props) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)

  const pageProducts = useMemo(() => {
    const start = safePage * PAGE_SIZE
    return products.slice(start, start + PAGE_SIZE)
  }, [products, safePage])

  const goTo = (next: number) => {
    setPage(Math.max(0, Math.min(pageCount - 1, next)))
    document.getElementById('drop')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
        {pageProducts.map((product) => (
          <li key={product.id} className="bg-white">
            <Link
              href={`/drop/${product.slug}`}
              className="group flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-neutral-900"
            >
              <div className="relative aspect-square bg-[#f0f0ec]">
                <DropProductThumb product={product} drop={drop} />
              </div>
              <div className="flex flex-1 flex-col gap-0.5 border-t border-neutral-100 px-2.5 py-2.5 sm:px-3 sm:py-3">
                <p
                  className="text-[13px] font-normal leading-tight tracking-tight text-neutral-900 group-hover:underline sm:text-sm"
                  style={{ fontFamily: 'var(--font-design-anton), Impact, sans-serif' }}
                >
                  {product.title}
                </p>
                <p className="line-clamp-2 text-[11px] leading-snug text-neutral-500 sm:text-xs">
                  {product.blurb}
                </p>
                <p className="mt-auto pt-1 text-[11px] text-neutral-400 sm:text-xs">
                  Mug · {priceLabel}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goTo(safePage - 1)}
            disabled={safePage <= 0}
            className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Prev
          </button>
          <p
            className="text-xs uppercase tracking-[0.14em] text-neutral-500"
            style={{ fontFamily: 'var(--font-design-mono), ui-monospace, monospace' }}
          >
            {safePage + 1} / {pageCount}
          </p>
          <button
            type="button"
            onClick={() => goTo(safePage + 1)}
            disabled={safePage >= pageCount - 1}
            className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
