'use client'

import { useEffect, useRef, useState } from 'react'
import { GeneratedDesign, COLORS, ColorOption } from '@/lib/merch'

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

interface TShirtPreviewProps {
  design: GeneratedDesign
  topic: string | null
  selectedColor: ColorOption
  onColorChange: (color: ColorOption) => void
  className?: string
}

export default function TShirtPreview({ design, topic, selectedColor, onColorChange, className = '' }: TShirtPreviewProps) {
  const [blankShirtUrl, setBlankShirtUrl] = useState<string | null>(null)
  const [blankLoading, setBlankLoading] = useState(false)
  const [blankError, setBlankError] = useState<string | null>(null)
  const [previewReady, setPreviewReady] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const previewSeqRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    const fetchBlankShirt = async () => {
      setBlankLoading(true)
      setBlankError(null)
      try {
        const response = await fetch(`/api/blank-tshirt?color=${encodeURIComponent(selectedColor.value)}`)
        const data = await response.json()
        if (!cancelled) {
          if (data.success && data.blankShirtUrl) {
            setBlankShirtUrl(data.blankShirtUrl)
          } else {
            setBlankError(data.error || 'Could not load Printful shirt mockup')
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
  }, [selectedColor.value])

  useEffect(() => {
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

        const printX = canvas.width * 0.315
        const printY = canvas.height * 0.27
        const printW = canvas.width * 0.37
        const printH = canvas.height * 0.43

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
  }, [blankShirtUrl, design.imageUrl])

  return (
    <div
      className={`flex h-full min-h-0 flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg shadow-black/30 ${className}`}
    >
      <h2 className="mb-4 shrink-0 text-xl font-black uppercase tracking-wide text-zinc-100">
        👕 Gainz preview
      </h2>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex min-h-[220px] min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 sm:min-h-[280px]">
          {blankLoading ? (
            <p className="text-sm text-zinc-500">Loading shirt mockup…</p>
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
                      left: '31.5%',
                      top: '27%',
                      width: '37%',
                      height: '43%',
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
              {blankError || 'Printful shirt mockup unavailable.'}
            </p>
          )}
        </div>

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

        <div className="shrink-0 space-y-2">
          <h3 className="font-bold text-white">{topic || design.topic}</h3>
          <p className="line-clamp-2 text-sm text-zinc-500">{design.prompt}</p>
        </div>
      </div>
    </div>
  )
}
