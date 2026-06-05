'use client'

import { useEffect, useRef, useState } from 'react'
import { GeneratedDesign, COLORS, ColorOption } from '@/lib/merch'
import { MUG_SIZES, type ProductType } from '@/lib/products'
import { DESIGN_LAYOUT_OPTIONS, type DesignLayoutPreset } from '@/lib/text-design'

/** Same-origin URL for canvas (avoids tainted canvas when reading pixels for export). */
function canvasShirtSrc(blankShirtUrl: string): string {
  if (blankShirtUrl.startsWith('/')) return blankShirtUrl
  try {
    const u = new URL(blankShirtUrl)
    if (typeof window !== 'undefined' && u.origin === window.location.origin) return blankShirtUrl
  } catch {
    return blankShirtUrl
  }
  return `/api/proxy-shirt?url=${encodeURIComponent(blankShirtUrl)}`
}

interface PrintLayoutControls {
  preset: DesignLayoutPreset
  onPresetChange: (preset: DesignLayoutPreset) => void
  scale: number
  onScaleChange: (scale: number) => void
  inkMode: 'auto' | 'light' | 'dark'
  onInkModeChange: (mode: 'auto' | 'light' | 'dark') => void
  advancedOpen: boolean
  onAdvancedOpenChange: (open: boolean) => void
}

interface TShirtPreviewProps {
  design: GeneratedDesign
  topic: string | null
  productType?: ProductType
  /** Shirt size (M, L, …) or mug size (11 oz, …). */
  orderSize?: string
  onOrderSizeChange?: (size: string) => void
  selectedColor: ColorOption
  onColorChange: (color: ColorOption) => void
  /** Print layout + advanced tuning (shown under shirt colors when set). */
  printLayoutControls?: PrintLayoutControls
  className?: string
}

export default function TShirtPreview({
  design,
  topic,
  productType = 'shirt',
  orderSize = 'M',
  onOrderSizeChange,
  selectedColor,
  onColorChange,
  printLayoutControls,
  className = '',
}: TShirtPreviewProps) {
  const isMug = productType === 'mug'
  const [blankShirtUrl, setBlankShirtUrl] = useState<string | null>(null)
  const [blankLoading, setBlankLoading] = useState(false)
  const [blankError, setBlankError] = useState<string | null>(null)
  const [printfulMockupUrl, setPrintfulMockupUrl] = useState<string | null>(null)
  const [mockupLoading, setMockupLoading] = useState(false)
  const [mockupError, setMockupError] = useState<string | null>(null)
  const [previewReady, setPreviewReady] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const previewSeqRef = useRef(0)
  const mockupSeqRef = useRef(0)

  useEffect(() => {
    if (isMug) return

    let cancelled = false

    const fetchBlankShirt = async () => {
      setBlankLoading(true)
      setBlankError(null)
      try {
        const params = new URLSearchParams({ product: productType, color: selectedColor.value })
        const response = await fetch(`/api/blank-product?${params.toString()}`)
        const data = await response.json()
        if (!cancelled) {
          if (data.success && data.blankProductUrl) {
            setBlankShirtUrl(data.blankProductUrl)
          } else {
            setBlankError(data.error || 'Could not load Printful product mockup')
          }
        }
      } catch {
        if (!cancelled) {
          setBlankError('Could not load Printful shirt mockup')
        }
      } finally {
        if (!cancelled) setBlankLoading(false)
      }
    }

    fetchBlankShirt()
    return () => {
      cancelled = true
    }
  }, [selectedColor.value, productType, isMug])

  useEffect(() => {
    if (!isMug || !design.imageUrl) {
      setPrintfulMockupUrl(null)
      setMockupLoading(false)
      setMockupError(null)
      return
    }

    const seq = ++mockupSeqRef.current
    setMockupLoading(true)
    setMockupError(null)
    setPrintfulMockupUrl(null)

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch('/api/generate-mockup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: design.imageUrl,
              productType: 'mug',
              size: orderSize,
            }),
          })
          const data = await response.json()
          if (seq !== mockupSeqRef.current) return

          if (data.success && data.mockupUrl) {
            setPrintfulMockupUrl(data.mockupUrl)
            setMockupError(null)
          } else {
            setPrintfulMockupUrl(null)
            setMockupError(data.error || 'Could not generate Printful mug preview')
          }
        } catch {
          if (seq === mockupSeqRef.current) {
            setPrintfulMockupUrl(null)
            setMockupError('Could not generate Printful mug preview')
          }
        } finally {
          if (seq === mockupSeqRef.current) {
            setMockupLoading(false)
          }
        }
      })()
    }, 700)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isMug, design.imageUrl, orderSize])

  useEffect(() => {
    if (isMug) return

    const canvas = canvasRef.current
    if (!canvas || !blankShirtUrl || !design.imageUrl) {
      return
    }

    const seq = ++previewSeqRef.current
    const shirtSrc = canvasShirtSrc(blankShirtUrl)

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })

    const drawPreview = async () => {
      try {
        setPreviewReady(false)
        setPreviewError(null)
        const [shirtImg, designImg] = await Promise.all([loadImage(shirtSrc), loadImage(design.imageUrl)])
        if (seq !== previewSeqRef.current) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = shirtImg.naturalWidth
        canvas.height = shirtImg.naturalHeight
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(shirtImg, 0, 0, canvas.width, canvas.height)

        if (seq !== previewSeqRef.current) return

        const overlay = { left: 0.315, top: 0.27, width: 0.37, height: 0.43 }
        const printX = canvas.width * overlay.left
        const printY = canvas.height * overlay.top
        const printW = canvas.width * overlay.width
        const printH = canvas.height * overlay.height

        ctx.drawImage(designImg, printX, printY, printW, printH)
        if (seq !== previewSeqRef.current) return

        setPreviewReady(true)
      } catch {
        if (seq === previewSeqRef.current) {
          setPreviewReady(false)
          setPreviewError('Could not render preview canvas')
        }
      }
    }

    drawPreview()
  }, [blankShirtUrl, design.imageUrl, isMug])

  const retryMockup = () => {
    mockupSeqRef.current += 1
    const seq = mockupSeqRef.current
    setMockupLoading(true)
    setMockupError(null)
    setPrintfulMockupUrl(null)
    void (async () => {
      try {
        const response = await fetch('/api/generate-mockup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: design.imageUrl,
            productType: 'mug',
            size: orderSize,
          }),
        })
        const data = await response.json()
        if (seq !== mockupSeqRef.current) return
        if (data.success && data.mockupUrl) {
          setPrintfulMockupUrl(data.mockupUrl)
          setMockupError(null)
        } else {
          setMockupError(data.error || 'Could not generate Printful mug preview')
        }
      } catch {
        if (seq === mockupSeqRef.current) {
          setMockupError('Could not generate Printful mug preview')
        }
      } finally {
        if (seq === mockupSeqRef.current) setMockupLoading(false)
      }
    })()
  }

  return (
    <div
      className={`flex h-full min-h-0 flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg shadow-black/30 ${className}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          Step 2
        </span>
      </div>
      <h2 className="mb-1 shrink-0 text-lg font-semibold text-zinc-100">
        {isMug ? 'Mug preview' : 'Shirt preview'}
      </h2>
      <p className="mb-4 shrink-0 text-sm text-zinc-500">
        {isMug
          ? 'High-quality mockup of your design on a white glossy mug.'
          : 'Bella+Canvas 3001 · premium cotton · printed to order.'}
      </p>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex min-h-[220px] min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-zinc-700/50 bg-[#ececea] p-4 sm:min-h-[280px]">
          {isMug ? (
            mockupLoading ? (
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-700">Generating product mockup…</p>
                <p className="mt-1 text-xs text-zinc-500">Usually takes a few seconds</p>
              </div>
            ) : printfulMockupUrl ? (
              <div className="relative mx-auto aspect-square w-full max-w-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={printfulMockupUrl}
                  alt="Printful mug mockup with your design"
                  className="h-full w-full object-contain"
                />
                <p className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-zinc-300">
                  Product mockup
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-amber-400">
                  {mockupError || 'Printful mug preview unavailable.'}
                </p>
                {mockupError && (
                  <button
                    type="button"
                    onClick={retryMockup}
                    className="mt-3 rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                  >
                    Retry preview
                  </button>
                )}
              </div>
            )
          ) : blankLoading ? (
            <p className="text-sm text-zinc-500">Loading product mockup…</p>
          ) : blankShirtUrl ? (
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[22rem] sm:aspect-square sm:max-w-md">
              {!previewError ? (
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blankShirtUrl}
                    alt="Blank Printful t-shirt"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={design.imageUrl}
                    alt="Design overlay"
                    className="absolute object-contain"
                    style={{
                      left: `${0.315 * 100}%`,
                      top: `${0.27 * 100}%`,
                      width: `${0.37 * 100}%`,
                      height: `${0.43 * 100}%`,
                    }}
                  />
                </>
              )}
              {!previewReady && !previewError && (
                <p className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
                  Rendering preview…
                </p>
              )}
              {previewError && (
                <p className="absolute bottom-2 left-2 right-2 text-center text-xs text-amber-600 dark:text-amber-400 bg-white/70 dark:bg-black/40 rounded px-2 py-1">
                  Preview fallback mode
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-sm text-amber-400">
              {blankError || 'Printful product mockup unavailable.'}
            </p>
          )}
        </div>

        {isMug ? (
          <div className="shrink-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Mug size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MUG_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onOrderSizeChange?.(s)}
                  className={`rounded-lg border-2 px-2 py-2 text-xs font-semibold transition ${
                    orderSize === s
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-1 text-sm text-zinc-500">White Glossy Mug · {orderSize}</p>
          </div>
        ) : (
          <div className="shrink-0">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Shirt color
            </label>
            <div className="flex gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onColorChange(c)}
                  className={`h-10 w-10 rounded-full border-4 transition-all ${
                    selectedColor.value === c.value
                      ? 'scale-110 border-emerald-400 shadow-lg shadow-emerald-500/25'
                      : 'border-zinc-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
            <p className="mt-1 text-sm text-zinc-500">Selected: {selectedColor.name}</p>
          </div>
        )}

        {printLayoutControls && (
          <div className="shrink-0 space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Customize layout</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {DESIGN_LAYOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => printLayoutControls.onPresetChange(opt.id)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                    printLayoutControls.preset === opt.id
                      ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-100'
                      : 'border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  <span className="block font-bold text-zinc-100">{opt.title}</span>
                  <span className="mt-1 block text-[11px] leading-snug text-zinc-500">{opt.subtitle}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => printLayoutControls.onAdvancedOpenChange(!printLayoutControls.advancedOpen)}
              className="text-xs font-medium text-zinc-500 underline decoration-zinc-600 underline-offset-2 hover:text-zinc-400"
            >
              {printLayoutControls.advancedOpen ? 'Hide advanced' : 'Advanced'}
            </button>
            {printLayoutControls.advancedOpen && (
              <div className="space-y-4 border-t border-zinc-800 pt-3">
                <div>
                  <label className="mb-1.5 flex justify-between text-xs font-medium text-zinc-400">
                    <span>Type size</span>
                    <span className="tabular-nums text-zinc-500">
                      {Math.round(printLayoutControls.scale * 100)}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min={0.8}
                    max={1.2}
                    step={0.02}
                    value={printLayoutControls.scale}
                    onChange={(e) => printLayoutControls.onScaleChange(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Ink on shirt</label>
                  <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950/80 p-1.5">
                    {(['auto', 'dark', 'light'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => printLayoutControls.onInkModeChange(mode)}
                        className={`rounded-md px-2 py-1.5 text-xs font-semibold capitalize ${
                          printLayoutControls.inkMode === mode
                            ? 'bg-zinc-700 text-white'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-600">
                    Auto uses light ink on black, navy, gray, and red so the art stays readable on those fabrics.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="shrink-0 space-y-1 border-t border-zinc-800 pt-4">
          <h3 className="font-semibold text-zinc-100">{topic || design.topic}</h3>
          <p className="text-xs text-zinc-500">
            {isMug ? 'White glossy mug · Dishwasher safe' : 'Unisex fit · Pre-shrunk fabric'}
          </p>
        </div>
      </div>
    </div>
  )
}
