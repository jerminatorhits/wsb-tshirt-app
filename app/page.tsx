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
import { getProductPricing, MUG_BASE_PRICE, SHIRT_BASE_PRICE, SHIRT_SIZES, parseProductType, type ProductType } from '@/lib/products'

interface TickerSearchResult {
  symbol: string
  name: string
}

const POPULAR_TICKERS: TickerSearchResult[] = [
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOG', name: 'Alphabet' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'AMD', name: 'AMD' },
  { symbol: 'GME', name: 'GameStop' },
  { symbol: 'AMC', name: 'AMC Entertainment' },
  { symbol: 'SPY', name: 'S&P 500 ETF' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF' },
  { symbol: 'PLTR', name: 'Palantir' },
  { symbol: 'COIN', name: 'Coinbase' },
  { symbol: 'HOOD', name: 'Robinhood' },
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'INTC', name: 'Intel' },
  { symbol: 'BA', name: 'Boeing' },
  { symbol: 'DIS', name: 'Disney' },
  { symbol: 'SOFI', name: 'SoFi' },
]

function filterTickerResults(query: string, items: TickerSearchResult[]) {
  const q = query.trim().toUpperCase()
  if (!q) return []
  const startsWithSymbol = items.filter((item) => item.symbol.startsWith(q))
  const named = items.filter(
    (item) => !item.symbol.startsWith(q) && item.name.toUpperCase().includes(q)
  )
  return [...startsWithSymbol, ...named].slice(0, 8)
}

type AppStep = 'create' | 'shipping' | 'payment'

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
  const [tickerMenuOpen, setTickerMenuOpen] = useState(false)
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [tickerPrefilledFromUrl, setTickerPrefilledFromUrl] = useState(false)
  const [designLayoutPreset, setDesignLayoutPreset] = useState<DesignLayoutPreset>('classic')
  const [designScale, setDesignScale] = useState(1)
  /** auto: light ink on black/navy only */
  const [designInkMode, setDesignInkMode] = useState<'auto' | 'light' | 'dark'>('auto')
  const [designAdvancedOpen, setDesignAdvancedOpen] = useState(false)
  const [productType, setProductType] = useState<ProductType>('mug')
  const [orderSize, setOrderSize] = useState<string>('11 oz')
  const [step, setStep] = useState<AppStep>('create')
  const [quantity, setQuantity] = useState(1)
  const [checkoutTax, setCheckoutTax] = useState(0)
  const [designGenerating, setDesignGenerating] = useState(false)
  const designRefreshSeqRef = useRef(0)

  const { basePrice, shippingFlatRate } = getProductPricing(productType)
  const orderSubtotal = basePrice * quantity
  const orderTotalPreview = (orderSubtotal + shippingFlatRate + checkoutTax).toFixed(2)

  const goToStep = (next: AppStep) => {
    if (next === 'create') setCheckoutTax(0)
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
    const qProduct = parseProductType(params.get('product'))

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
    setProductType(qProduct)
    setOrderSize(qProduct === 'mug' ? '11 oz' : 'M')
  }, [])

  const activeStrikes = useMemo(
    () => (optionType === 'CALL' ? callStrikes : putStrikes),
    [optionType, callStrikes, putStrikes]
  )

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
      setTickerSuggestionLoading(false)
      return
    }

    setTickerSuggestions(filterTickerResults(q, POPULAR_TICKERS))
    setTickerMenuOpen(true)

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      setTickerSuggestionLoading(true)
      try {
        const response = await fetch(`/api/ticker-search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        })
        const data = await response.json()
        if (data.success && Array.isArray(data.results) && data.results.length > 0) {
          setTickerSuggestions(data.results)
        }
      } catch {
        // Keep the local popular-ticker matches if the network search fails.
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
    productType === 'mug'
      ? false
      : designInkMode === 'light'
        ? true
        : designInkMode === 'dark'
          ? false
          : isDarkShirtColor(selectedColor.value)

  const handleProductTypeChange = (next: ProductType) => {
    setProductType(next)
    setOrderSize(next === 'mug' ? '11 oz' : 'M')
  }

  const buildPromptFromParsed = (parsed: Extract<ParsedDesignForm, { ok: true }>) => {
    const layoutLabel = DESIGN_LAYOUT_OPTIONS.find((o) => o.id === designLayoutPreset)?.title ?? designLayoutPreset
    if (expressionMode === 'price') {
      return `Ticker: ${parsed.tickerText} | Price: ${parsed.primaryText}${parsed.optionsText ? ` | Options: ${parsed.optionsText}` : ''} | Layout: ${layoutLabel} | Scale: ${designScale} | Ink: ${designInkMode}`
    }
    return `Ticker: ${parsed.tickerText} | Options: ${parsed.primaryText} | Layout: ${layoutLabel} | Scale: ${designScale} | Ink: ${designInkMode}`
  }

  /* eslint-disable react-hooks/exhaustive-deps -- refresh when print options or form content change */
  useEffect(() => {
    const parsed = parseDesignForm()
    if (!parsed.ok) {
      setDesignGenerating(false)
      return
    }

    const seq = ++designRefreshSeqRef.current
    setDesignGenerating(true)
    const timeout = window.setTimeout(() => {
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
          setGeneratedDesign((prev) => ({
            id: prev?.id ?? `text-design-${Date.now()}`,
            topic: parsed.titleParts.join(' '),
            imageUrl,
            prompt,
            createdAt: prev?.createdAt ?? new Date().toISOString(),
          }))
          setErrorMessage(null)
        } catch (e) {
          if (seq === designRefreshSeqRef.current) {
            console.error('Failed to refresh design preview:', e)
          }
        } finally {
          if (seq === designRefreshSeqRef.current) {
            setDesignGenerating(false)
          }
        }
      })()
    }, 80)

    return () => window.clearTimeout(timeout)
  }, [
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
    productType,
  ])
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleCheckout = () => {
    const parsed = parseDesignForm()
    if (!parsed.ok) {
      setErrorMessage(parsed.error)
      return
    }
    if (!generatedDesign) {
      setErrorMessage('Preview is still loading. Try again in a moment.')
      return
    }
    setErrorMessage(null)
    goToStep('shipping')
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
    params.set('product', productType)

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

  const parsedForm = parseDesignForm()
  const canCheckout = parsedForm.ok && Boolean(generatedDesign)
  const compactToggle = (active: boolean) =>
    `rounded-md border px-2.5 py-2 text-sm transition ${active ? 'rh-toggle-active' : 'rh-toggle-inactive'}`

  return (
    <main className={step === 'create' ? 'h-full min-h-0' : undefined}>
      <div
        className={
          step === 'create'
            ? 'mx-auto flex h-full min-h-0 max-w-xl flex-col px-4 pb-3 pt-3 sm:px-6 sm:pt-4'
            : 'mx-auto max-w-lg px-4 pb-16 pt-2'
        }
      >
        {step === 'create' && (
          <>
            <div className="flex shrink-0 items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                  Your ticker, on merch.
                </h1>
                <p className="mt-0.5 text-sm text-neutral-500">
                  Pick a product, enter a ticker, checkout.
                </p>
              </div>
            </div>

            {errorMessage && <p className="mt-2 shrink-0 text-xs text-red-600">{errorMessage}</p>}

            <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
              <div className="flex w-full shrink-0 flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-pressed={productType === 'mug'}
                    onClick={() => handleProductTypeChange('mug')}
                    className={compactToggle(productType === 'mug')}
                  >
                    {`Mug · $${MUG_BASE_PRICE.toFixed(2)}`}
                  </button>
                  <button
                    type="button"
                    aria-pressed={productType === 'shirt'}
                    onClick={() => handleProductTypeChange('shirt')}
                    className={compactToggle(productType === 'shirt')}
                  >
                    {`Tee · $${SHIRT_BASE_PRICE.toFixed(2)}`}
                  </button>
                </div>

                {productType !== 'mug' && (
                  <div className="space-y-2">
                    <div>
                      <label className="rh-label-compact">Size</label>
                      <div className="grid grid-cols-7 gap-1">
                        {SHIRT_SIZES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setOrderSize(s)}
                            className={`${compactToggle(orderSize === s)} px-0.5 text-[11px] sm:text-sm`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rh-label-compact mb-0">Color</span>
                      <div className="flex gap-1.5">
                        {COLORS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setSelectedColor(c)}
                            className={`h-7 w-7 rounded-full border transition ${
                              selectedColor.value === c.value
                                ? 'border-neutral-900 ring-2 ring-neutral-900/20'
                                : 'border-neutral-300 hover:border-neutral-400'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                            aria-label={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="rh-label-compact">Print</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-pressed={expressionMode === 'price'}
                      onClick={() => setExpressionMode('price')}
                      className={compactToggle(expressionMode === 'price')}
                    >
                      Price
                    </button>
                    <button
                      type="button"
                      aria-pressed={expressionMode === 'option'}
                      onClick={() => setExpressionMode('option')}
                      className={compactToggle(expressionMode === 'option')}
                    >
                      Option
                    </button>
                  </div>
                </div>

                <div
                  className={`relative z-30 grid gap-2 ${
                    expressionMode === 'price' ? 'grid-cols-2' : 'grid-cols-4'
                  }`}
                >
                  <div className="relative">
                    <label className="rh-label-compact" htmlFor="ticker">
                      Ticker
                    </label>
                    <input
                      id="ticker"
                      type="text"
                      value={ticker}
                      onChange={(e) => {
                        setTickerPrefilledFromUrl(false)
                        setTicker(e.target.value.toUpperCase())
                        setTickerMenuOpen(true)
                      }}
                      onFocus={() => {
                        if (ticker.trim()) setTickerMenuOpen(true)
                      }}
                      onBlur={() => {
                        window.setTimeout(() => setTickerMenuOpen(false), 150)
                      }}
                      placeholder="TSLA"
                      maxLength={6}
                      className="rh-input-compact"
                      autoComplete="off"
                      role="combobox"
                      aria-expanded={tickerMenuOpen}
                      aria-controls="ticker-suggestions"
                    />
                    {tickerMenuOpen && ticker && (tickerSuggestions.length > 0 || tickerSuggestionLoading) && (
                      <div
                        id="ticker-suggestions"
                        role="listbox"
                        className="absolute left-0 top-full z-50 mt-1 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
                      >
                        {tickerSuggestions.length === 0 && tickerSuggestionLoading ? (
                          <p className="px-3 py-2 text-sm text-neutral-400">Searching…</p>
                        ) : (
                          tickerSuggestions.map((item) => (
                            <button
                              key={`${item.symbol}-${item.name}`}
                              type="button"
                              role="option"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                setTickerPrefilledFromUrl(true)
                                setTicker(item.symbol)
                                setTickerSuggestions([])
                                setTickerMenuOpen(false)
                              }}
                              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-neutral-50"
                            >
                              <span className="font-semibold">{item.symbol}</span>
                              <span className="ml-3 truncate text-sm text-neutral-400">{item.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {expressionMode === 'price' ? (
                    <div>
                      <label className="rh-label-compact" htmlFor="price">
                        Price
                      </label>
                      <input
                        id="price"
                        type="text"
                        inputMode="decimal"
                        value={numberValue}
                        onChange={(e) => {
                          const next = e.target.value.replace(/[^0-9.]/g, '')
                          const normalized = next.replace(/^\./, '').replace(/(\..*)\./g, '$1')
                          setNumberValue(normalized)
                        }}
                        placeholder="500"
                        className="rh-input-compact"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="rh-label-compact" htmlFor="option-type">
                          Type
                        </label>
                        <select
                          id="option-type"
                          value={optionType}
                          onChange={(e) => setOptionType(e.target.value === 'PUT' ? 'PUT' : 'CALL')}
                          className="rh-input-compact"
                        >
                          <option value="CALL">Call</option>
                          <option value="PUT">Put</option>
                        </select>
                      </div>
                      <div>
                        <label className="rh-label-compact" htmlFor="expiration">
                          Exp
                        </label>
                        <select
                          id="expiration"
                          value={selectedExpiration}
                          onChange={(e) => setSelectedExpiration(e.target.value)}
                          className="rh-input-compact"
                        >
                          {optionDataLoading && expirationDates.length === 0 ? (
                            <option value="">Loading…</option>
                          ) : expirationDates.length === 0 ? (
                            <option value="">{optionDataError ? 'Unavailable' : '—'}</option>
                          ) : (
                            expirationDates.map((date) => (
                              <option key={date} value={String(date)}>
                                {formatOptionDateShort(date)}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="rh-label-compact" htmlFor="strike">
                          Strike
                        </label>
                        <select
                          id="strike"
                          value={selectedStrike}
                          onChange={(e) => setSelectedStrike(e.target.value)}
                          className="rh-input-compact"
                        >
                          {optionDataLoading && activeStrikes.length === 0 ? (
                            <option value="">Loading…</option>
                          ) : activeStrikes.length === 0 ? (
                            <option value="">{optionDataError ? 'Unavailable' : '—'}</option>
                          ) : (
                            activeStrikes.map((strike) => (
                              <option key={strike} value={String(strike)}>
                                {strike}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopyShareLink()}
                  className="self-start text-xs text-neutral-400 hover:text-neutral-700"
                >
                  {shareStatus || 'Copy link'}
                </button>
              </div>

              <div className="min-h-0 min-w-0 flex-1">
                {generatedDesign ? (
                  <TShirtPreview
                    key={productType}
                    embedded
                    className="h-full w-full"
                    design={generatedDesign}
                    topic={generatedDesign.topic}
                    productType={productType}
                    orderSize={orderSize}
                    onOrderSizeChange={setOrderSize}
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
                ) : (
                  <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 text-center">
                    <p className="text-sm text-neutral-500">
                      {designGenerating ? 'Building preview…' : 'Enter a ticker and price to preview'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 flex shrink-0 items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 sm:px-4">
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
                <p className="text-lg font-semibold tabular-nums leading-tight">${orderTotalPreview}</p>
                <p className="truncate text-[11px] leading-tight text-neutral-500">
                  ${orderSubtotal.toFixed(2)} + ${shippingFlatRate.toFixed(2)} shipping
                  {checkoutTax > 0 ? ` + $${checkoutTax.toFixed(2)} tax` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={!canCheckout}
                className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {designGenerating && !generatedDesign ? '…' : 'Checkout'}
              </button>
            </div>
          </>
        )}

        {(step === 'shipping' || step === 'payment') && generatedDesign && (
          <>
            <button
              type="button"
              onClick={() => goToStep(step === 'payment' ? 'shipping' : 'create')}
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              ← Back
            </button>
            <p className="mt-4 text-sm text-neutral-500">
              {generatedDesign.topic}
              {' · '}
              {productType === 'mug' ? 'Mug' : 'Tee'}
              {' · '}
              {orderSize}
              {productType !== 'mug' ? ` · ${selectedColor.name}` : ''}
              {' · '}
              Qty {quantity}
            </p>
            <div className="mt-1 flex items-baseline justify-between">
              <h1 className="text-2xl font-semibold tracking-tight">
                {step === 'shipping' ? 'Shipping' : 'Payment'}
              </h1>
              {step === 'shipping' && (
                <p className="text-lg font-semibold tabular-nums">${orderTotalPreview}</p>
              )}
            </div>
            <div className="mt-6">
              <Checkout
                embedded
                wizardMode
                wizardStep={step}
                onWizardStepChange={(next) => goToStep(next)}
                onWizardBack={() => goToStep('create')}
                onTaxUpdate={(tax) => setCheckoutTax(tax)}
                design={generatedDesign}
                designTitle={generatedDesign.topic}
                productType={productType}
                orderSize={orderSize}
                onOrderSizeChange={setOrderSize}
                selectedColor={selectedColor}
                quantity={quantity}
                onQuantityChange={setQuantity}
              />
            </div>
          </>
        )}
      </div>
    </main>
  )
}
