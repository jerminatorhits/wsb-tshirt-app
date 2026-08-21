'use client'

import { useEffect, useRef, useState } from 'react'
import { GeneratedDesign, ColorOption } from '@/lib/merch'
import { type ProductType } from '@/lib/products'
import { drawMugDesignOnCanvas, mugBlankSrc, mugOverlaySpec } from '@/lib/mug-overlay'
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

const shirtBlankCache = new Map<string, string>()

function InstantMugPreview({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="relative mx-auto flex h-[280px] w-full items-center justify-center">
      <div
        className="absolute h-[72px] w-[44px] rounded-full border-[9px] border-neutral-200"
        style={{ right: 'calc(50% - 122px)', top: '36%' }}
        aria-hidden
      />
      <div className="relative flex h-[228px] w-[168px] items-center justify-center overflow-hidden rounded-[16px] rounded-b-[34px] bg-[#f2f2ef] ring-1 ring-neutral-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-[52%] w-[72%] object-contain" />
      </div>
    </div>
  )
}

function PreviewBusyBadge({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
      <div className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs text-neutral-600 shadow-sm ring-1 ring-neutral-200/80">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-800" />
        {label}
      </div>
    </div>
  )
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
  embedded?: boolean
}

export default function TShirtPreview({
  design,
  productType = 'mug',
  orderSize = 'M',
  selectedColor,
  printLayoutControls,
  className = '',
}: TShirtPreviewProps) {
  const isMug = productType === 'mug'
  const [blankShirtUrl, setBlankShirtUrl] = useState<string | null>(null)
  const [blankError, setBlankError] = useState<string | null>(null)
  const [previewReady, setPreviewReady] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const previewSeqRef = useRef(0)

  useEffect(() => {
    if (isMug) return

    let cancelled = false

    const fetchBlankShirt = async () => {
      const cacheKey = selectedColor.value
      const cached = shirtBlankCache.get(cacheKey)
      if (cached) {
        setBlankShirtUrl(cached)
        setBlankError(null)
        return
      }

      setBlankError(null)
      setBlankShirtUrl(null)
      setPreviewReady(false)
      try {
        const params = new URLSearchParams({ product: productType, color: selectedColor.value })
        const response = await fetch(`/api/blank-product?${params.toString()}`)
        const data = await response.json()
        if (!cancelled) {
          if (data.success && data.blankProductUrl) {
            shirtBlankCache.set(cacheKey, data.blankProductUrl)
            setBlankShirtUrl(data.blankProductUrl)
          } else {
            setBlankError(data.error || 'Could not load Printful product mockup')
          }
        }
      } catch {
        if (!cancelled) {
          setBlankError('Could not load Printful shirt mockup')
        }
      }
    }

    fetchBlankShirt()
    return () => {
      cancelled = true
    }
  }, [selectedColor.value, productType, isMug])

  useEffect(() => {
    if (isMug) setPreviewReady(false)
  }, [orderSize, isMug])

  useEffect(() => {
    const canvas = canvasRef.current
    const blankSrc = isMug
      ? mugBlankSrc(orderSize)
      : blankShirtUrl
        ? canvasShirtSrc(blankShirtUrl)
        : null

    if (!canvas || !blankSrc || !design.imageUrl) {
      return
    }

    const seq = ++previewSeqRef.current

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })

    const drawPreview = async () => {
      try {
        setPreviewError(null)
        const [productImg, designImg] = await Promise.all([loadImage(blankSrc), loadImage(design.imageUrl)])
        if (seq !== previewSeqRef.current) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = productImg.naturalWidth
        canvas.height = productImg.naturalHeight
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(productImg, 0, 0, canvas.width, canvas.height)

        if (seq !== previewSeqRef.current) return

        if (isMug) {
          drawMugDesignOnCanvas(ctx, designImg, canvas.width, canvas.height, mugOverlaySpec(orderSize))
        } else {
          const overlay = { left: 0.315, top: 0.27, width: 0.37, height: 0.43 }
          ctx.drawImage(
            designImg,
            canvas.width * overlay.left,
            canvas.height * overlay.top,
            canvas.width * overlay.width,
            canvas.height * overlay.height
          )
        }
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
  }, [blankShirtUrl, design.imageUrl, isMug, orderSize])

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl bg-white p-4 sm:min-h-[300px]">
          {isMug ? (
            <div className="relative mx-auto aspect-square w-full max-w-sm">
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 h-full w-full ${previewReady && !previewError ? 'opacity-100' : 'opacity-0'}`}
              />
              {(!previewReady || previewError) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {previewError ? (
                    <InstantMugPreview imageUrl={design.imageUrl} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mugBlankSrc(orderSize)}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="relative mx-auto aspect-[4/5] w-full max-w-xs sm:max-w-sm">
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 h-full w-full ${previewReady && !previewError ? 'opacity-100' : 'opacity-0'}`}
              />
              {(!previewReady || previewError) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="h-[90%] w-[72%] rounded-b-xl rounded-t-[46%] shadow-sm"
                    style={{ backgroundColor: selectedColor.hex }}
                    aria-hidden
                  />
                </div>
              )}
              {!previewReady && !previewError && !blankError && (
                <PreviewBusyBadge label="Loading shirt photo…" />
              )}
              {blankError && !previewReady && (
                <p className="absolute bottom-3 text-center text-xs text-neutral-500">{blankError}</p>
              )}
            </div>
          )}
        </div>

        {printLayoutControls && (
          <div>
            <button
              type="button"
              onClick={() => printLayoutControls.onAdvancedOpenChange(!printLayoutControls.advancedOpen)}
              className="text-sm text-neutral-400 hover:text-neutral-700"
            >
              {printLayoutControls.advancedOpen ? 'Hide design options' : 'Design options'}
            </button>
            {printLayoutControls.advancedOpen && (
              <div className="mt-3 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {DESIGN_LAYOUT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => printLayoutControls.onPresetChange(opt.id)}
                      className={`rounded-lg border px-2 py-2 text-sm transition ${
                        printLayoutControls.preset === opt.id ? 'rh-toggle-active' : 'rh-toggle-inactive'
                      }`}
                    >
                      {opt.title}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="mb-1.5 flex justify-between text-sm text-neutral-500">
                    <span>Print size</span>
                    <span className="tabular-nums">{Math.round(printLayoutControls.scale * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min={0.8}
                    max={1.2}
                    step={0.02}
                    value={printLayoutControls.scale}
                    onChange={(e) => printLayoutControls.onScaleChange(parseFloat(e.target.value))}
                    className="w-full accent-neutral-900"
                  />
                </div>
                {productType !== 'mug' && (
                  <div>
                    <label className="rh-label">Ink</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['auto', 'dark', 'light'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => printLayoutControls.onInkModeChange(mode)}
                          className={`rounded-lg border px-2 py-1.5 text-sm capitalize transition ${
                            printLayoutControls.inkMode === mode ? 'rh-toggle-active' : 'rh-toggle-inactive'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
