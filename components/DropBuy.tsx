'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Checkout from '@/components/Checkout'
import TShirtPreview from '@/components/TShirtPreview'
import type { DropCollection, DropProduct } from '@/lib/drops'
import { dropCollectibleMark } from '@/lib/drops'
import { COLORS, type GeneratedDesign } from '@/lib/merch'
import { formatShippedPrice } from '@/lib/products'
import { ensureSloganFontsLoaded, renderSloganToDataURL } from '@/lib/slogan-design'

type Step = 'preview' | 'shipping' | 'payment'

type Props = {
  drop: DropCollection
  product: DropProduct
}

export default function DropBuy({ drop, product }: Props) {
  const [design, setDesign] = useState<GeneratedDesign | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('preview')
  const [quantity, setQuantity] = useState(1)
  const [orderSize, setOrderSize] = useState(product.size)
  const [checkoutTax, setCheckoutTax] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await ensureSloganFontsLoaded()
        if (cancelled) return
        const imageUrl = renderSloganToDataURL({
          lines: product.lines,
          collectibleMark: dropCollectibleMark(drop),
          layout: product.layout,
        })
        if (cancelled) return
        setDesign({
          id: `drop-${product.id}`,
          topic: product.title,
          imageUrl,
          prompt: `${product.title} · ${dropCollectibleMark(drop)} · ${product.layout}`,
          createdAt: new Date().toISOString(),
        })
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not render design')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [drop, product])

  const goToStep = (next: Step) => {
    if (next === 'preview') setCheckoutTax(0)
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const priceLabel = formatShippedPrice(product.productType)

  if (step === 'shipping' || step === 'payment') {
    if (!design) return null
    return (
      <main className="mx-auto max-w-lg px-4 pb-16 pt-2">
        <button
          type="button"
          onClick={() => goToStep(step === 'payment' ? 'shipping' : 'preview')}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Back
        </button>
        <p className="mt-4 text-sm text-neutral-500">
          {product.title}
          {' · '}
          Mug
          {' · '}
          {orderSize}
          {' · '}
          Qty {quantity}
        </p>
        <div className="mt-1 flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {step === 'shipping' ? 'Shipping' : 'Payment'}
          </h1>
        </div>
        <div className="mt-6">
          <Checkout
            embedded
            wizardMode
            wizardStep={step}
            onWizardStepChange={(next) => goToStep(next)}
            onWizardBack={() => goToStep('preview')}
            onTaxUpdate={(tax) => setCheckoutTax(tax)}
            design={design}
            designTitle={product.title}
            productType={product.productType}
            selectedColor={COLORS[0]}
            orderSize={orderSize}
            onOrderSizeChange={setOrderSize}
            quantity={quantity}
            onQuantityChange={setQuantity}
          />
        </div>
        {checkoutTax > 0 && (
          <p className="mt-3 text-center text-xs text-neutral-400">
            Tax calculated at checkout: ${checkoutTax.toFixed(2)}
          </p>
        )}
      </main>
    )
  }

  return (
    <main className="mx-auto flex h-full min-h-0 max-w-xl flex-col px-4 pb-3 pt-3 sm:px-6 sm:pt-4">
      <div className="shrink-0">
        <Link href="/#drop" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Live drops
        </Link>
        <h1
          className="mt-3 text-3xl font-normal tracking-tight text-neutral-900 sm:text-4xl"
          style={{ fontFamily: 'var(--font-design-anton), Impact, sans-serif' }}
        >
          {product.title}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">{priceLabel} · Mug</p>
        <p className="mt-2 text-sm text-neutral-600">{product.blurb}</p>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
        <div className="relative min-h-[260px] min-w-0 flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white sm:min-h-[300px]">
          {design ? (
            <TShirtPreview
              embedded
              className="h-full w-full"
              design={design}
              topic={design.topic}
              productType={product.productType}
              orderSize={orderSize}
              selectedColor={COLORS[0]}
              onColorChange={() => {}}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-800" />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="h-9 w-9 rounded-md border border-neutral-200 text-neutral-700 hover:border-neutral-400 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-6 text-center text-sm tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              disabled={quantity >= 10}
              className="h-9 w-9 rounded-md border border-neutral-200 text-neutral-700 hover:border-neutral-400 disabled:opacity-40"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-lg font-semibold tabular-nums leading-tight">{priceLabel}</p>
            <p className="text-[11px] text-neutral-500">Shipping included</p>
          </div>
          <button
            type="button"
            onClick={() => goToStep('shipping')}
            disabled={!design}
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Buy
          </button>
        </div>
        <p className="px-1 text-center text-[11px] text-neutral-400">
          Stamped STONKMUGS on the print. Gift shipping at checkout.
        </p>
      </div>
    </main>
  )
}
