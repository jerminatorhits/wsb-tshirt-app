'use client'

import { useEffect, useState } from 'react'
import type { DropCollection, DropProduct } from '@/lib/drops'
import { dropCollectibleMark } from '@/lib/drops'
import { ensureSloganFontsLoaded, renderSloganToDataURL } from '@/lib/slogan-design'
import { mugBlankSrc } from '@/lib/mug-overlay'

type Props = {
  product: DropProduct
  drop: DropCollection
}

/** Lightweight mug + slogan preview for storefront rows (no full canvas warp). */
export default function DropProductThumb({ product, drop }: Props) {
  const [art, setArt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await ensureSloganFontsLoaded()
        if (cancelled) return
        const url = renderSloganToDataURL({
          lines: product.lines,
          collectibleMark: dropCollectibleMark(drop),
          layout: product.layout,
        })
        if (!cancelled) setArt(url)
      } catch {
        if (!cancelled) setArt(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [product.lines, product.layout, drop])

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mugBlankSrc(product.size)} alt="" className="absolute inset-0 h-full w-full object-contain" />
      {art && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={art}
          alt=""
          className="relative z-[1] h-[38%] w-[48%] object-contain mix-blend-multiply"
        />
      )}
    </div>
  )
}
