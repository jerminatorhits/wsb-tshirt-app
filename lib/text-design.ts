/**
 * Canvas text designs for Printful front print (1800×1800 art → 1800×1800 placement in template).
 * Arena / chest: Anton display at matched px (ticker + price read as one lockup), solid fill + edge stroke.
 * Editorial: JetBrains Mono, matched sizes, flat ink + hairline rule.
 */

import { fontAnton, fontJetbrains } from '@/lib/design-fonts'

export type DesignLayoutPreset = 'classic' | 'corner' | 'editorial'

export const DESIGN_LAYOUT_OPTIONS: {
  id: DesignLayoutPreset
  title: string
  subtitle: string
}[] = [
  {
    id: 'classic',
    title: 'Arena',
    subtitle: 'Anton lockup — ticker & price same point size, solid fill, silkscreen edge.',
  },
  {
    id: 'corner',
    title: 'Chest mark',
    subtitle: 'Upper-right Anton badge — matched type, bold but compact.',
  },
  {
    id: 'editorial',
    title: 'Tape read',
    subtitle: 'Mono at one optical size — ticker, rule, figures; terminal clarity.',
  },
]

const CANVAS = 1800

const FONT_ANTON = `${fontAnton.style.fontFamily}, Impact, "Arial Narrow", system-ui, sans-serif`
const FONT_MONO = `${fontJetbrains.style.fontFamily}, ui-monospace, monospace`

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  startSize: number,
  minSize: number,
  maxWidth: number,
  weight: number | string,
  family: string
): number {
  let size = Math.round(startSize)
  const floor = Math.max(48, Math.round(minSize))
  while (size > floor) {
    ctx.font = `${weight} ${size}px ${family}`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 4
  }
  return Math.max(floor, size)
}

function fitFontSizeTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  startSize: number,
  minSize: number,
  maxWidth: number,
  weight: number | string,
  family: string,
  letterSpacingPx: number
): number {
  let size = Math.round(startSize)
  const floor = Math.max(48, Math.round(minSize))
  while (size > floor) {
    ctx.letterSpacing = letterSpacingPx ? `${letterSpacingPx}px` : '0px'
    ctx.font = `${weight} ${size}px ${family}`
    const w = ctx.measureText(text).width
    ctx.letterSpacing = '0px'
    if (w <= maxWidth) return size
    size -= 4
  }
  return floor
}

/**
 * Price mode: one matched size (ticker + figure lockup).
 * Option mode: ticker stays large; position string gets a lower starting size from length, then capped ≤ ticker.
 */
/** Anton is condensed/tall — extra tracking improves legibility at shirt scale. */
function antonPrimaryTrackPx(sc: number): number {
  return Math.round(0.55 * sc)
}

function computeAntonPairSizes(
  ctx: CanvasRenderingContext2D,
  tickerLine: string,
  primaryText: string,
  expressionMode: 'price' | 'option',
  maxW: number,
  sc: number,
  tickerTrack: number,
  corner: boolean
): { tickerSize: number; primarySize: number } {
  const primaryTrack = antonPrimaryTrackPx(sc)
  // Slightly lower starts than before — reads less “towering” on chest prints.
  const tickerStart = corner ? 228 * sc : 278 * sc
  const tickerMin = corner ? 88 * sc : 100 * sc

  if (expressionMode === 'price') {
    const heroSize = matchedLockupSize(
      ctx,
      [
        { text: tickerLine, weight: 400, letterSpacingPx: tickerTrack, maxW },
        { text: primaryText, weight: 400, letterSpacingPx: primaryTrack, maxW },
      ],
      FONT_ANTON,
      tickerStart,
      tickerMin
    )
    return { tickerSize: heroSize, primarySize: heroSize }
  }

  const tickerSize = fitFontSizeTracked(ctx, tickerLine, tickerStart, tickerMin, maxW, 400, FONT_ANTON, tickerTrack)

  const len = primaryText.length
  const primaryStart = Math.max(
    78 * sc,
    Math.min(tickerStart, tickerStart - Math.max(0, len - 8) * 8.5 * sc)
  )
  const primaryMin = Math.max(52 * sc, tickerMin * 0.78)
  let primarySize = fitFontSizeTracked(
    ctx,
    primaryText,
    primaryStart,
    primaryMin,
    maxW,
    400,
    FONT_ANTON,
    primaryTrack
  )
  primarySize = Math.min(primarySize, tickerSize)
  return { tickerSize, primarySize }
}

function computeMonoPairSizes(
  ctx: CanvasRenderingContext2D,
  tickerUpper: string,
  primaryText: string,
  expressionMode: 'price' | 'option',
  maxW: number,
  sc: number,
  monoTrack: number
): { tickerSize: number; primarySize: number } {
  const monoStart = 312 * sc
  const monoMin = 104 * sc

  if (expressionMode === 'price') {
    const hero = matchedLockupSize(
      ctx,
      [
        { text: tickerUpper, weight: 600, letterSpacingPx: monoTrack, maxW },
        { text: primaryText, weight: 700, letterSpacingPx: 0, maxW },
      ],
      FONT_MONO,
      monoStart,
      monoMin
    )
    return { tickerSize: hero, primarySize: hero }
  }

  const tickerSize = fitFontSizeTracked(ctx, tickerUpper, monoStart, monoMin, maxW, 600, FONT_MONO, monoTrack)

  const len = primaryText.length
  const primaryStart = Math.max(
    78 * sc,
    Math.min(292 * sc, 292 * sc - Math.max(0, len - 9) * 7.2 * sc)
  )
  const primaryMin = Math.max(56 * sc, monoMin * 0.78)
  let primarySize = fitFontSize(ctx, primaryText, primaryStart, primaryMin, maxW, 700, FONT_MONO)
  primarySize = Math.min(primarySize, tickerSize)
  return { tickerSize, primarySize }
}

type LockSpec = {
  text: string
  weight: number | string
  letterSpacingPx: number
  maxW: number
}

/** One point size for every line so the lockup feels intentional (retail / jersey logic). */
function matchedLockupSize(
  ctx: CanvasRenderingContext2D,
  specs: LockSpec[],
  family: string,
  startSize: number,
  minSize: number
): number {
  let size = Math.round(startSize)
  const floor = Math.max(52, Math.round(minSize))
  while (size > floor) {
    const ok = specs.every(({ text, weight, letterSpacingPx, maxW }) => {
      ctx.letterSpacing = letterSpacingPx ? `${letterSpacingPx}px` : '0px'
      ctx.font = `${weight} ${size}px ${family}`
      const w = ctx.measureText(text).width
      ctx.letterSpacing = '0px'
      return w <= maxW
    })
    if (ok) return size
    size -= 4
  }
  return floor
}

/** Ascent/descent for alphabetic baseline stacking. */
function lineVisualMetrics(
  ctx: CanvasRenderingContext2D,
  text: string,
  weight: number | string,
  size: number,
  family: string,
  letterSpacingPx = 0
) {
  ctx.letterSpacing = letterSpacingPx ? `${letterSpacingPx}px` : '0px'
  ctx.font = `${weight} ${size}px ${family}`
  const m = ctx.measureText(text)
  ctx.letterSpacing = '0px'
  let ascent = m.actualBoundingBoxAscent
  let descent = m.actualBoundingBoxDescent
  if (!ascent || ascent < 1) ascent = size * 0.72
  if (!descent || descent < 1) descent = size * 0.22
  return { ascent, descent, width: m.width }
}

type StackLine = { ascent: number; descent: number; gapBelow: number }

function baselinesForCenteredStack(centerY: number, lines: StackLine[]): number[] {
  if (lines.length === 0) return []
  let total = 0
  for (let i = 0; i < lines.length; i++) {
    total += lines[i].ascent + lines[i].descent
    if (i < lines.length - 1) total += lines[i].gapBelow
  }
  const top = centerY - total / 2
  const baselines: number[] = []
  let cursor = top
  for (let i = 0; i < lines.length; i++) {
    const { ascent, descent, gapBelow } = lines[i]
    baselines.push(cursor + ascent)
    cursor += ascent + descent + (i < lines.length - 1 ? gapBelow : 0)
  }
  return baselines
}

/** Solid fill + hairline stroke for legibility on fabric. */
function drawAntonHeroLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseline: number,
  text: string,
  size: number,
  align: CanvasTextAlign,
  useLightInk: boolean,
  sc: number,
  letterSpacingPx: number
) {
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.font = `400 ${size}px ${FONT_ANTON}`
  ctx.letterSpacing = letterSpacingPx ? `${letterSpacingPx}px` : '0px'

  const fill = inkColors(useLightInk).primary
  const lw = Math.max(2, Math.round(2.5 * sc))
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  ctx.lineWidth = lw
  ctx.strokeStyle = useLightInk ? 'rgba(3, 7, 18, 0.55)' : 'rgba(248, 250, 252, 0.42)'
  ctx.strokeText(text, x, baseline)
  ctx.fillStyle = fill
  ctx.fillText(text, x, baseline)
  ctx.letterSpacing = '0px'
}

function drawMonoLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseline: number,
  text: string,
  size: number,
  weight: number | string,
  fill: string,
  align: CanvasTextAlign,
  letterSpacingPx: number
) {
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = fill
  ctx.font = `${weight} ${size}px ${FONT_MONO}`
  ctx.letterSpacing = letterSpacingPx ? `${letterSpacingPx}px` : '0px'
  ctx.fillText(text, x, baseline)
  ctx.letterSpacing = '0px'
}

/** Soft “tape” chip behind small caps / options line */
function drawMonoPillBehind(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseline: number,
  text: string,
  size: number,
  weight: number | string,
  letterSpacingPx: number,
  useLightInk: boolean
) {
  ctx.font = `${weight} ${size}px ${FONT_MONO}`
  ctx.letterSpacing = letterSpacingPx ? `${letterSpacingPx}px` : '0px'
  const m = ctx.measureText(text)
  const ascent = m.actualBoundingBoxAscent > 1 ? m.actualBoundingBoxAscent : size * 0.7
  const descent = m.actualBoundingBoxDescent > 1 ? m.actualBoundingBoxDescent : size * 0.22
  const w = m.width
  const padX = size * 0.55
  const padY = size * 0.22
  const left = cx - w / 2 - padX
  const top = baseline - ascent - padY
  const rw = w + padX * 2
  const rh = ascent + descent + padY * 2
  const r = Math.min(rh / 2, size * 0.45)

  ctx.save()
  ctx.fillStyle = useLightInk ? 'rgba(15, 23, 42, 0.35)' : 'rgba(15, 23, 42, 0.06)'
  roundRect(ctx, left, top, rw, rh, r)
  ctx.fill()
  ctx.restore()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

export async function ensureDesignFontsLoaded(): Promise<void> {
  if (typeof window === 'undefined' || !document.fonts?.load) return
  const px = 120
  const specs = [
    `400 ${px}px ${fontAnton.style.fontFamily}`,
    `500 ${px}px ${fontJetbrains.style.fontFamily}`,
    `600 ${px}px ${fontJetbrains.style.fontFamily}`,
    `700 ${px}px ${fontJetbrains.style.fontFamily}`,
  ]
  try {
    await Promise.all(specs.map((s) => document.fonts.load(s)))
    await document.fonts.ready
  } catch {
    /* fall back to system stack */
  }
}

/**
 * Auto “Ink on shirt” mode: use **light-colored art** on garments where dark ink falls apart in previews
 * (heather gray, saturated red, and true darks). Matches common POD / athletic-print practice: light ink on
 * mid-tone or chromatic tees, dark ink on white.
 */
export function isDarkShirtColor(colorValue: string): boolean {
  return colorValue === 'black' || colorValue === 'navy' || colorValue === 'gray' || colorValue === 'red'
}

export type DesignRenderOptions = {
  tickerText: string
  primaryText: string
  optionsText: string
  preset: DesignLayoutPreset
  scale: number
  useLightInk: boolean
  /** Option chains get a smaller, length-aware primary line vs the ticker. */
  expressionMode?: 'price' | 'option'
}

function inkColors(useLightInk: boolean): { primary: string; secondary: string } {
  if (useLightInk) {
    // Near-white hero + high-luminance secondary so mono / muted lines stay legible on red and charcoal heather.
    return { primary: '#fafafa', secondary: '#e2e8f0' }
  }
  return { primary: '#0f172a', secondary: '#475569' }
}

export function renderDesignToDataURL(opts: DesignRenderOptions): string {
  const { tickerText, primaryText, optionsText, preset, scale, useLightInk, expressionMode = 'price' } = opts
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS
  canvas.height = CANVAS
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not render design image')
  }

  const sc = Math.min(1.25, Math.max(0.75, scale))
  const { primary: ink, secondary: inkMuted } = inkColors(useLightInk)

  ctx.clearRect(0, 0, CANVAS, CANVAS)
  const tickerLine = `$${tickerText.toUpperCase()}`

  if (preset === 'classic') {
    const maxW = Math.round(1320 * sc)
    const tickerTrack = Math.round(2.05 * sc)
    const { tickerSize, primarySize } = computeAntonPairSizes(
      ctx,
      tickerLine,
      primaryText,
      expressionMode,
      maxW,
      sc,
      tickerTrack,
      false
    )

    const primaryTrack = antonPrimaryTrackPx(sc)
    const tM = lineVisualMetrics(ctx, tickerLine, 400, tickerSize, FONT_ANTON, tickerTrack)
    const pM = lineVisualMetrics(ctx, primaryText, 400, primarySize, FONT_ANTON, primaryTrack)
    const gapTickerPrimary = Math.max(2, Math.round(Math.min(tickerSize, primarySize) * 0.085))

    const stackLines: StackLine[] = [
      { ascent: tM.ascent, descent: tM.descent, gapBelow: gapTickerPrimary },
      { ascent: pM.ascent, descent: pM.descent, gapBelow: 0 },
    ]

    let optSize = 0
    let oM = { ascent: 0, descent: 0, width: 0 }
    if (optionsText) {
      const optTrack = Math.round(0.85 * sc)
      ctx.letterSpacing = `${optTrack}px`
      optSize = fitFontSize(ctx, optionsText, 100 * sc, 58 * sc, maxW, 600, FONT_MONO)
      oM = lineVisualMetrics(ctx, optionsText, 600, optSize, FONT_MONO, optTrack)
      ctx.letterSpacing = '0px'
      const gapPrimaryOptions = Math.max(7, Math.round(Math.max(tickerSize, primarySize) * 0.14))
      stackLines[1].gapBelow = gapPrimaryOptions
      stackLines.push({ ascent: oM.ascent, descent: oM.descent, gapBelow: 0 })
    }

    const opticalCenterY = CANVAS * 0.422
    const baselines = baselinesForCenteredStack(opticalCenterY, stackLines)
    const cx = CANVAS / 2

    drawAntonHeroLine(ctx, cx, baselines[0], tickerLine, tickerSize, 'center', useLightInk, sc, tickerTrack)
    drawAntonHeroLine(ctx, cx, baselines[1], primaryText, primarySize, 'center', useLightInk, sc, primaryTrack)

    if (optionsText && baselines.length > 2) {
      const optTrack = Math.round(0.85 * sc)
      drawMonoPillBehind(ctx, cx, baselines[2], optionsText, optSize, 600, optTrack, useLightInk)
      drawMonoLine(ctx, cx, baselines[2], optionsText, optSize, 600, inkMuted, 'center', optTrack)
    }
    return canvas.toDataURL('image/png')
  }

  if (preset === 'corner') {
    const maxW = Math.round(860 * sc)
    const anchorX = CANVAS - Math.round(96 * sc)
    const tickerTrack = Math.round(1.75 * sc)
    const { tickerSize, primarySize } = computeAntonPairSizes(
      ctx,
      tickerLine,
      primaryText,
      expressionMode,
      maxW,
      sc,
      tickerTrack,
      true
    )

    const primaryTrack = antonPrimaryTrackPx(sc)
    const tM = lineVisualMetrics(ctx, tickerLine, 400, tickerSize, FONT_ANTON, tickerTrack)
    const pM = lineVisualMetrics(ctx, primaryText, 400, primarySize, FONT_ANTON, primaryTrack)
    const gapTickerPrimary = Math.max(2, Math.round(Math.min(tickerSize, primarySize) * 0.08))

    const stackLines: StackLine[] = [
      { ascent: tM.ascent, descent: tM.descent, gapBelow: gapTickerPrimary },
      { ascent: pM.ascent, descent: pM.descent, gapBelow: 0 },
    ]

    let optSize = 0
    let oM = { ascent: 0, descent: 0, width: 0 }
    if (optionsText) {
      const optTrack = Math.round(0.4 * sc)
      ctx.letterSpacing = `${optTrack}px`
      optSize = fitFontSize(ctx, optionsText, 82 * sc, 50 * sc, maxW, 600, FONT_MONO)
      oM = lineVisualMetrics(ctx, optionsText, 600, optSize, FONT_MONO, optTrack)
      ctx.letterSpacing = '0px'
      const gapPrimaryOptions = Math.max(6, Math.round(Math.max(tickerSize, primarySize) * 0.12))
      stackLines[1].gapBelow = gapPrimaryOptions
      stackLines.push({ ascent: oM.ascent, descent: oM.descent, gapBelow: 0 })
    }

    const opticalCenterY = CANVAS * 0.335
    const baselines = baselinesForCenteredStack(opticalCenterY, stackLines)

    drawAntonHeroLine(ctx, anchorX, baselines[0], tickerLine, tickerSize, 'right', useLightInk, sc, tickerTrack)
    drawAntonHeroLine(ctx, anchorX, baselines[1], primaryText, primarySize, 'right', useLightInk, sc, primaryTrack)

    if (optionsText && baselines.length > 2) {
      const optTrack = Math.round(0.4 * sc)
      ctx.font = `600 ${optSize}px ${FONT_MONO}`
      ctx.letterSpacing = `${optTrack}px`
      const mOpt = ctx.measureText(optionsText)
      const w = mOpt.width
      ctx.letterSpacing = '0px'
      const ascent = mOpt.actualBoundingBoxAscent > 1 ? mOpt.actualBoundingBoxAscent : optSize * 0.7
      const descent = mOpt.actualBoundingBoxDescent > 1 ? mOpt.actualBoundingBoxDescent : optSize * 0.22
      const padX = optSize * 0.5
      const padY = optSize * 0.2
      const pillW = w + padX * 2
      const pillH = ascent + descent + padY * 2
      const left = anchorX - pillW
      const top = baselines[2] - ascent - padY
      ctx.fillStyle = useLightInk ? 'rgba(15, 23, 42, 0.35)' : 'rgba(15, 23, 42, 0.06)'
      roundRect(ctx, left, top, pillW, pillH, optSize * 0.4)
      ctx.fill()
      drawMonoLine(ctx, anchorX, baselines[2], optionsText, optSize, 600, inkMuted, 'right', optTrack)
    }
    return canvas.toDataURL('image/png')
  }

  // editorial — matched mono, flat ink, hairline between label and figure
  const tickerUpper = tickerLine.toUpperCase()
  const maxW = Math.round(1480 * sc)
  const monoTrack = Math.round(2 * sc)

  const { tickerSize: monoTickerSize, primarySize: monoPrimarySize } = computeMonoPairSizes(
    ctx,
    tickerUpper,
    primaryText,
    expressionMode,
    maxW,
    sc,
    monoTrack
  )

  const tM = lineVisualMetrics(ctx, tickerUpper, 600, monoTickerSize, FONT_MONO, monoTrack)
  const pM = lineVisualMetrics(ctx, primaryText, 700, monoPrimarySize, FONT_MONO, 0)
  const gapTickerPrimary = Math.max(10, Math.round(Math.min(monoTickerSize, monoPrimarySize) * 0.12))

  const stackLines: StackLine[] = [
    { ascent: tM.ascent, descent: tM.descent, gapBelow: gapTickerPrimary },
    { ascent: pM.ascent, descent: pM.descent, gapBelow: 0 },
  ]

  let optSize = 0
  let oM = { ascent: 0, descent: 0, width: 0 }
  if (optionsText) {
    const optTrack = Math.round(0.7 * sc)
    ctx.letterSpacing = `${optTrack}px`
    optSize = fitFontSize(ctx, optionsText, 96 * sc, 54 * sc, maxW, 500, FONT_MONO)
    oM = lineVisualMetrics(ctx, optionsText, 500, optSize, FONT_MONO, optTrack)
    ctx.letterSpacing = '0px'
    const gapPrimaryOptions = Math.max(6, Math.round(Math.max(monoTickerSize, monoPrimarySize) * 0.12))
    stackLines[1].gapBelow = gapPrimaryOptions
    stackLines.push({ ascent: oM.ascent, descent: oM.descent, gapBelow: 0 })
  }

  const opticalCenterY = CANVAS * 0.428
  const baselines = baselinesForCenteredStack(opticalCenterY, stackLines)
  const cx = CANVAS / 2

  drawMonoLine(ctx, cx, baselines[0], tickerUpper, monoTickerSize, 600, inkMuted, 'center', monoTrack)

  const midGapY = baselines[0] + tM.descent + gapTickerPrimary * 0.5
  const ruleW = Math.min(maxW * 0.42, 520 * sc)
  ctx.strokeStyle = useLightInk ? 'rgba(148, 163, 184, 0.55)' : 'rgba(71, 85, 105, 0.55)'
  ctx.lineWidth = Math.max(1.5, 1.8 * sc)
  ctx.beginPath()
  ctx.moveTo(cx - ruleW / 2, midGapY)
  ctx.lineTo(cx + ruleW / 2, midGapY)
  ctx.stroke()

  drawMonoLine(ctx, cx, baselines[1], primaryText, monoPrimarySize, 700, ink, 'center', 0)

  if (optionsText && baselines.length > 2) {
    const optTrack = Math.round(0.7 * sc)
    drawMonoPillBehind(ctx, cx, baselines[2], optionsText, optSize, 500, optTrack, useLightInk)
    drawMonoLine(ctx, cx, baselines[2], optionsText, optSize, 500, inkMuted, 'center', optTrack)
  }
  return canvas.toDataURL('image/png')
}

export function parseDesignLayoutPreset(value: string | null): DesignLayoutPreset | null {
  if (value === 'classic' || value === 'corner' || value === 'editorial') return value
  return null
}
