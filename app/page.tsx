'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import TShirtPreview from '@/components/TShirtPreview'
import Checkout from '@/components/Checkout'
import { COLORS, type ColorOption, type GeneratedDesign } from '@/lib/merch'
import {
  DESIGN_LAYOUT_OPTIONS,
  ensureDesignFontsLoaded,
  isDarkShirtColor,
  parseDesignLayoutPreset,
  renderDesignToDataURL,
  type DesignLayoutPreset,
} from '@/lib/text-design'

interface TickerSearchResult {
  symbol: string
  name: string
}

export default function Home() {
  const [ticker, setTicker] = useState('')
  const [numberValue, setNumberValue] = useState('')
  const [expressionMode, setExpressionMode] = useState<'price' | 'option'>('price')
  const [optionType, setOptionType] = useState<'CALL' | 'PUT'>('CALL')
  const [expirationDates, setExpirationDates] = useState<number[]>([])
  const [selectedExpiration, setSelectedExpiration] = useState('')
  const [callStrikes, setCallStrikes] = useState<number[]>([])
  const [putStrikes, setPutStrikes] = useState<number[]>([])
  const [selectedStrike, setSelectedStrike] = useState('')
  const [optionDataLoading, setOptionDataLoading] = useState(false)
  const [optionDataError, setOptionDataError] = useState<string | null>(null)
  const [generatedDesign, setGeneratedDesign] = useState<GeneratedDesign | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<ColorOption>(COLORS[0])
  const [tickerSuggestions, setTickerSuggestions] = useState<TickerSearchResult[]>([])
  const [tickerSuggestionLoading, setTickerSuggestionLoading] = useState(false)
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [tickerPrefilledFromUrl, setTickerPrefilledFromUrl] = useState(false)
  const [designLayoutPreset, setDesignLayoutPreset] = useState<DesignLayoutPreset>('classic')
  const [designScale, setDesignScale] = useState(1)
  /** auto: light ink on black/navy only */
  const [designInkMode, setDesignInkMode] = useState<'auto' | 'light' | 'dark'>('auto')
  const [designAdvancedOpen, setDesignAdvancedOpen] = useState(false)
  const designRefreshSeqRef = useRef(0)

  const cleanedTicker = ticker.trim().toUpperCase()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const qTicker = params.get('t')
    const qMode = params.get('mode')
    const qPrice = params.get('p')
    const qType = params.get('ot')
    const qExp = params.get('exp')
    const qStrike = params.get('strike')
    const qColor = params.get('color')
    const qLayout = parseDesignLayoutPreset(params.get('layout'))
    const qScale = params.get('scale')
    const qInk = params.get('ink')

    if (qTicker) {
      setTicker(qTicker.toUpperCase().slice(0, 6))
      setTickerPrefilledFromUrl(true)
    }
    if (qMode === 'option' || qMode === 'price') setExpressionMode(qMode)
    if (qPrice) setNumberValue(qPrice)
    if (qType === 'CALL' || qType === 'PUT') setOptionType(qType)
    if (qExp && /^\d+$/.test(qExp)) setSelectedExpiration(qExp)
    if (qStrike) setSelectedStrike(qStrike)
    if (qColor) {
      const matched = COLORS.find((c) => c.value === qColor)
      if (matched) setSelectedColor(matched)
    }
    if (qLayout) setDesignLayoutPreset(qLayout)
    if (qScale) {
      const n = parseFloat(qScale)
      if (Number.isFinite(n) && n >= 0.8 && n <= 1.2) setDesignScale(n)
    }
    if (qInk === 'light' || qInk === 'dark' || qInk === 'auto') setDesignInkMode(qInk)
  }, [])

  const activeStrikes = useMemo(
    () => (optionType === 'CALL' ? callStrikes : putStrikes),
    [optionType, callStrikes, putStrikes]
  )

  const formatExpirationLabel = (unixTimestamp: number) =>
    new Date(unixTimestamp * 1000).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  const formatOptionDateShort = (unixTimestamp: number) => {
    const date = new Date(unixTimestamp * 1000)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const year = String(date.getFullYear()).slice(-2)
    return `${month}/${day}/${year}`
  }

  const optionsTickerRef = useRef<string>('')

  const sameNumArray = (a: number[], b: number[]) =>
    a.length === b.length && a.every((v, i) => v === b[i])

  /** Single flight: overlapping fetches (ticker-only vs expiration) were racing and resetting dropdowns. */
  useEffect(() => {
    if (!/^[A-Z]{1,6}$/.test(cleanedTicker)) {
      optionsTickerRef.current = ''
      setExpirationDates([])
      setCallStrikes([])
      setPutStrikes([])
      setSelectedExpiration('')
      setSelectedStrike('')
      setOptionDataError(null)
      setOptionDataLoading(false)
      return
    }

    const tickerChanged = optionsTickerRef.current !== cleanedTicker
    if (tickerChanged) {
      optionsTickerRef.current = cleanedTicker
      setSelectedStrike('')
    }

    // After a ticker change, ignore stale expiration in state until this response rewrites it.
    const expirationParam =
      !tickerChanged && selectedExpiration && /^\d+$/.test(selectedExpiration)
        ? selectedExpiration
        : undefined

    const controller = new AbortController()

    const run = async () => {
      setOptionDataLoading(true)
      setOptionDataError(null)
      try {
        const query = new URLSearchParams({ ticker: cleanedTicker })
        if (expirationParam) query.set('expiration', expirationParam)

        const response = await fetch(`/api/options-chain?${query.toString()}`, {
          signal: controller.signal,
        })
        const data = await response.json()

        if (controller.signal.aborted) return

        if (!data.success) {
          setOptionDataError(data.error || 'Could not load options chain')
          setCallStrikes([])
          setPutStrikes([])
          setExpirationDates([])
          setSelectedStrike('')
          return
        }

        const expiries: number[] = data.expirationDates || []
        const calls: number[] = data.strikes?.call || []
        const puts: number[] = data.strikes?.put || []

        setExpirationDates((prev) => (sameNumArray(prev, expiries) ? prev : expiries))
        setCallStrikes((prev) => (sameNumArray(prev, calls) ? prev : calls))
        setPutStrikes((prev) => (sameNumArray(prev, puts) ? prev : puts))

        const resolved = String(data.selectedExpiration != null ? data.selectedExpiration : '')
        setSelectedExpiration((prev) => (prev === resolved ? prev : resolved))
      } catch (e: unknown) {
        if (controller.signal.aborted) return
        const err = e as { name?: string }
        if (err?.name === 'AbortError') return
        setOptionDataError('Could not load options chain right now')
        setCallStrikes([])
        setPutStrikes([])
        setExpirationDates([])
        setSelectedStrike('')
      } finally {
        if (!controller.signal.aborted) {
          setOptionDataLoading(false)
        }
      }
    }

    void run()
    return () => controller.abort()
  }, [cleanedTicker, selectedExpiration])

  useEffect(() => {
    if (activeStrikes.length === 0) {
      setSelectedStrike((prev) => (prev === '' ? prev : ''))
      return
    }

    const n = Number(selectedStrike)
    if (!selectedStrike || !activeStrikes.includes(n)) {
      const first = String(activeStrikes[0])
      setSelectedStrike((prev) => (prev === first ? prev : first))
    }
  }, [activeStrikes, selectedStrike])

  useEffect(() => {
    if (tickerPrefilledFromUrl) {
      setTickerSuggestions([])
      setTickerSuggestionLoading(false)
      return
    }

    const q = ticker.trim().toUpperCase()
    if (q.length < 1) {
      setTickerSuggestions([])
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      setTickerSuggestionLoading(true)
      try {
        const response = await fetch(`/api/ticker-search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        })
        const data = await response.json()
        if (data.success) {
          setTickerSuggestions(data.results || [])
        } else {
          setTickerSuggestions([])
        }
      } catch {
        setTickerSuggestions([])
      } finally {
        setTickerSuggestionLoading(false)
      }
    }, 200)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [ticker, tickerPrefilledFromUrl])

  type ParsedDesignForm =
    | { ok: false; error: string }
    | {
        ok: true
        tickerText: string
        primaryText: string
        optionsText: string
        titleParts: string[]
      }

  const parseDesignForm = (): ParsedDesignForm => {
    const cleanedNumber = numberValue.trim()

    if (!cleanedTicker) {
      return { ok: false, error: 'Ticker is required' }
    }
    if (!/^[A-Z]{1,6}$/.test(cleanedTicker)) {
      return { ok: false, error: 'Ticker must be 1-6 letters' }
    }

    if (expressionMode === 'price') {
      if (!cleanedNumber) {
        return { ok: false, error: 'Price is required' }
      }
      if (!/^\d+(\.\d+)?$/.test(cleanedNumber)) {
        return { ok: false, error: 'Price must be a non-negative number' }
      }
      return {
        ok: true,
        tickerText: cleanedTicker,
        primaryText: cleanedNumber,
        optionsText: '',
        titleParts: [`$${cleanedTicker}`, cleanedNumber],
      }
    }

    if (!selectedExpiration || !selectedStrike) {
      return { ok: false, error: 'Select expiration and strike for the options position' }
    }
    const strikeDisplay = selectedStrike.replace(/^\$/, '').trim()
    const expShort = formatOptionDateShort(Number(selectedExpiration))
    // Spell out CALL/PUT for print legibility (single-letter suffix is easy to miss in Printful thumbnails).
    const line = `${expShort}  $${strikeDisplay} ${optionType}`
    return {
      ok: true,
      tickerText: cleanedTicker,
      primaryText: line,
      optionsText: '',
      titleParts: [`$${cleanedTicker}`, line],
    }
  }

  const effectiveLightInk =
    designInkMode === 'light' ? true : designInkMode === 'dark' ? false : isDarkShirtColor(selectedColor.value)

  const buildPromptFromParsed = (parsed: Extract<ParsedDesignForm, { ok: true }>) => {
    const layoutLabel = DESIGN_LAYOUT_OPTIONS.find((o) => o.id === designLayoutPreset)?.title ?? designLayoutPreset
    if (expressionMode === 'price') {
      return `Ticker: ${parsed.tickerText} | Price: ${parsed.primaryText}${parsed.optionsText ? ` | Options: ${parsed.optionsText}` : ''} | Layout: ${layoutLabel} | Scale: ${designScale} | Ink: ${designInkMode}`
    }
    return `Ticker: ${parsed.tickerText} | Options: ${parsed.primaryText} | Layout: ${layoutLabel} | Scale: ${designScale} | Ink: ${designInkMode}`
  }

  /* eslint-disable react-hooks/exhaustive-deps -- refresh only when print options or form content change; omit full `generatedDesign` to avoid looping on `imageUrl` updates */
  useEffect(() => {
    if (!generatedDesign) return
    const parsed = parseDesignForm()
    if (!parsed.ok) return

    const seq = ++designRefreshSeqRef.current
    void (async () => {
      try {
        await ensureDesignFontsLoaded()
        const imageUrl = renderDesignToDataURL({
          tickerText: parsed.tickerText,
          primaryText: parsed.primaryText,
          optionsText: parsed.optionsText,
          preset: designLayoutPreset,
          scale: designScale,
          useLightInk: effectiveLightInk,
          expressionMode,
        })
        if (seq !== designRefreshSeqRef.current) return
        const prompt = buildPromptFromParsed(parsed)
        setGeneratedDesign((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            imageUrl,
            topic: parsed.titleParts.join(' '),
            prompt,
          }
        })
      } catch (e) {
        if (seq === designRefreshSeqRef.current) {
          console.error('Failed to refresh design preview:', e)
        }
      }
    })()
  }, [
    generatedDesign?.id,
    designLayoutPreset,
    designScale,
    designInkMode,
    selectedColor.value,
    effectiveLightInk,
    cleanedTicker,
    expressionMode,
    numberValue,
    selectedExpiration,
    selectedStrike,
    optionType,
  ])
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleBuildDesign = async () => {
    const parsed = parseDesignForm()
    if (!parsed.ok) {
      setErrorMessage(parsed.error)
      return
    }

    try {
      await ensureDesignFontsLoaded()
      const imageUrl = renderDesignToDataURL({
        tickerText: parsed.tickerText,
        primaryText: parsed.primaryText,
        optionsText: parsed.optionsText,
        preset: designLayoutPreset,
        scale: designScale,
        useLightInk: effectiveLightInk,
        expressionMode,
      })
      const prompt = buildPromptFromParsed(parsed)

      setGeneratedDesign({
        id: `text-design-${Date.now()}`,
        topic: parsed.titleParts.join(' '),
        imageUrl,
        prompt,
        createdAt: new Date().toISOString(),
      })
      setErrorMessage(null)
    } catch (error) {
      console.error('Failed to build design:', error)
      setErrorMessage('Could not build design image. Please try again.')
    }
  }

  const handleCopyShareLink = async () => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams()
    if (cleanedTicker) params.set('t', cleanedTicker)
    params.set('mode', expressionMode)
    if (expressionMode === 'price') {
      if (numberValue.trim()) params.set('p', numberValue.trim())
    } else {
      params.set('ot', optionType)
      if (selectedExpiration) params.set('exp', selectedExpiration)
      if (selectedStrike) params.set('strike', selectedStrike)
    }
    if (selectedColor.value) params.set('color', selectedColor.value)
    params.set('layout', designLayoutPreset)
    params.set('scale', String(designScale))
    params.set('ink', designInkMode)

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareStatus('Link copied')
    } catch {
      setShareStatus('Could not copy link')
    } finally {
      window.setTimeout(() => setShareStatus(null), 2200)
    }
  }

  return (
    <main className="relative overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,197,94,0.12),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(244,63,94,0.07),transparent)]" />
      <div className="container relative mx-auto px-4 py-8 md:py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-emerald-400 via-lime-400 to-rose-400 bg-clip-text text-transparent">
              WSB Shirt Lab
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Unlike most of your plays,{' '}
            <span className="font-semibold text-emerald-400">these actually print</span>.
          </p>
          <div className="mx-auto mt-4 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 text-xs text-zinc-400 sm:gap-3">
            <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1">
              Secure payment by Stripe
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1">
              Fulfilled by Printful
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-rose-500/50 bg-rose-950/40 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium text-rose-200">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col lg:h-full lg:min-h-0">
            <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg shadow-black/30 lg:h-full lg:min-h-0 lg:flex-1">
              <h2 className="shrink-0 text-xl font-bold uppercase tracking-wide text-zinc-200">
                YOLO your design
              </h2>
              <div className="mt-4 flex min-w-0 flex-col gap-6 lg:min-h-0 lg:flex-1">
              <div className="space-y-4 lg:min-h-0 lg:flex-1">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Stock Ticker
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => {
                      setTickerPrefilledFromUrl(false)
                      setTicker(e.target.value.toUpperCase())
                    }}
                    placeholder="TSLA"
                    maxLength={6}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {ticker && (tickerSuggestions.length > 0 || tickerSuggestionLoading) && (
                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
                      {tickerSuggestionLoading ? (
                        <p className="px-3 py-2 text-sm text-zinc-500">Searching symbols...</p>
                      ) : (
                        tickerSuggestions.map((item) => (
                          <button
                            key={`${item.symbol}-${item.name}`}
                            type="button"
                            onClick={() => {
                              setTickerPrefilledFromUrl(true)
                              setTicker(item.symbol)
                              setTickerSuggestions([])
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-zinc-800"
                          >
                            <span className="font-semibold text-emerald-400">{item.symbol}</span>
                            <span className="ml-3 truncate text-sm text-zinc-500">{item.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Mode
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-700 bg-zinc-950/80 p-2">
                  <button
                    type="button"
                    onClick={() => setExpressionMode('price')}
                    className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                      expressionMode === 'price'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/35'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpressionMode('option')}
                    className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                      expressionMode === 'option'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/35'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Option
                  </button>
                </div>
              </div>

              {expressionMode === 'price' && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Price
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={numberValue}
                    onChange={(e) => {
                      const next = e.target.value.replace(/[^0-9.]/g, '')
                      const normalized = next
                        .replace(/^\./, '')
                        .replace(/(\..*)\./g, '$1')
                      setNumberValue(normalized)
                    }}
                    placeholder="500"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              )}

              {expressionMode === 'option' && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Position
                  </label>
                  <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950/50 p-3">
                    <div className="space-y-3">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-zinc-300">
                          <input
                            type="radio"
                            name="optionType"
                            value="CALL"
                            checked={optionType === 'CALL'}
                            onChange={() => setOptionType('CALL')}
                          />
                          Call
                        </label>
                        <label className="flex items-center gap-2 text-sm text-zinc-300">
                          <input
                            type="radio"
                            name="optionType"
                            value="PUT"
                            checked={optionType === 'PUT'}
                            onChange={() => setOptionType('PUT')}
                          />
                          Put
                        </label>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-500">
                          Expiration
                        </label>
                        <select
                          value={selectedExpiration}
                          onChange={(e) => setSelectedExpiration(e.target.value)}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          {expirationDates.length === 0 ? (
                            <option value="">No expirations loaded</option>
                          ) : (
                            expirationDates.map((date) => (
                              <option key={date} value={String(date)}>
                                {formatExpirationLabel(date)}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-500">
                          Strike
                        </label>
                        <select
                          value={selectedStrike}
                          onChange={(e) => setSelectedStrike(e.target.value)}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          {activeStrikes.length === 0 ? (
                            <option value="">No strikes loaded</option>
                          ) : (
                            activeStrikes.map((strike) => (
                              <option key={strike} value={String(strike)}>
                                {strike}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="text-xs text-zinc-500">
                        {optionDataLoading && <p>Loading options chain...</p>}
                        {!optionDataLoading && optionDataError && (
                          <p>{optionDataError}. Try another ticker.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>

              <button
                type="button"
                onClick={() => void handleBuildDesign()}
                className="w-full shrink-0 rounded-xl bg-gradient-to-r from-emerald-600 via-lime-500 to-emerald-600 px-6 py-3.5 text-lg font-black uppercase tracking-wide text-zinc-950 shadow-lg shadow-emerald-900/25 transition hover:shadow-emerald-500/20 active:scale-[0.99]"
              >
                🚀 Print the play
              </button>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="w-full shrink-0 rounded-lg border border-zinc-700 bg-zinc-900/90 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
              >
                Copy design link
              </button>
              {shareStatus && <p className="text-center text-xs text-zinc-500">{shareStatus}</p>}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col lg:h-full lg:min-h-0">
            {generatedDesign && (
              <TShirtPreview
                className="lg:h-full lg:min-h-0 lg:flex-1"
                design={generatedDesign}
                topic={generatedDesign.topic}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
                printLayoutControls={{
                  preset: designLayoutPreset,
                  onPresetChange: setDesignLayoutPreset,
                  scale: designScale,
                  onScaleChange: setDesignScale,
                  inkMode: designInkMode,
                  onInkModeChange: setDesignInkMode,
                  advancedOpen: designAdvancedOpen,
                  onAdvancedOpenChange: setDesignAdvancedOpen,
                }}
              />
            )}
          </div>

          <div className="flex min-w-0 flex-col lg:h-full lg:min-h-0">
            {generatedDesign && (
              <Checkout
                className="lg:h-full lg:min-h-0 lg:flex-1"
                design={generatedDesign}
                designTitle={generatedDesign.topic}
                selectedColor={selectedColor}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

