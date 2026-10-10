/**
 * Drop slogan art — each layout is a distinct composition so SKUs don’t
 * look like the same Canva template with swapped words.
 */

import { fontAnton, fontJetbrains } from '@/lib/design-fonts'

const CANVAS = 1800
const FONT_ANTON = `${fontAnton.style.fontFamily}, Impact, "Arial Narrow", system-ui, sans-serif`
const FONT_MONO = `${fontJetbrains.style.fontFamily}, ui-monospace, monospace`

export type SloganLayout = 'poster' | 'ticket' | 'stamp' | 'tape' | 'ledger'

export type SloganRenderOptions = {
  lines: string[]
  collectibleMark: string
  layout?: SloganLayout
  useLightInk?: boolean
}

function fitSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  start: number,
  min: number,
  maxW: number,
  family: string,
  weight: string | number = 400
): number {
  let size = Math.round(start)
  const floor = Math.max(36, Math.round(min))
  while (size > floor) {
    ctx.font = `${weight} ${size}px ${family}`
    if (ctx.measureText(text).width <= maxW) break
    size -= 4
  }
  return Math.max(floor, size)
}

function inkPair(useLightInk: boolean) {
  if (useLightInk) {
    return { ink: '#fafafa', muted: '#cbd5e1', hair: 'rgba(248,250,252,0.35)' }
  }
  return { ink: '#0f172a', muted: '#64748b', hair: 'rgba(15,23,42,0.22)' }
}

function drawAnton(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  ink: string,
  useLightInk: boolean,
  align: CanvasTextAlign = 'center',
  track = 0
) {
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.font = `400 ${size}px ${FONT_ANTON}`
  ctx.letterSpacing = track ? `${track}px` : '0px'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  ctx.lineWidth = Math.max(2, Math.round(size * 0.016))
  ctx.strokeStyle = useLightInk ? 'rgba(3, 7, 18, 0.55)' : 'rgba(248, 250, 252, 0.4)'
  ctx.strokeText(text, x, y)
  ctx.fillStyle = ink
  ctx.fillText(text, x, y)
  ctx.letterSpacing = '0px'
}

function drawMono(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center',
  weight: number = 600,
  track = 1.5
) {
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.font = `${weight} ${size}px ${FONT_MONO}`
  ctx.letterSpacing = `${track}px`
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
  ctx.letterSpacing = '0px'
}

function lineMetrics(ctx: CanvasRenderingContext2D, text: string, size: number, track: number) {
  ctx.letterSpacing = track ? `${track}px` : '0px'
  ctx.font = `400 ${size}px ${FONT_ANTON}`
  const m = ctx.measureText(text)
  ctx.letterSpacing = '0px'
  return {
    ascent: m.actualBoundingBoxAscent || size * 0.72,
    descent: m.actualBoundingBoxDescent || size * 0.22,
    width: m.width,
  }
}

function drawBrandColophon(
  ctx: CanvasRenderingContext2D,
  mark: string,
  ink: string,
  hair: string
) {
  const cx = CANVAS / 2
  const y = CANVAS - 100
  ctx.strokeStyle = hair
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(CANVAS * 0.28, y - 28)
  ctx.lineTo(CANVAS * 0.72, y - 28)
  ctx.moveTo(CANVAS * 0.28, y + 22)
  ctx.lineTo(CANVAS * 0.72, y + 22)
  ctx.stroke()
  drawMono(ctx, mark.toUpperCase(), cx, y + 8, 28, ink, 'center', 600, 3)
}

function layoutPoster(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  mark: string,
  useLightInk: boolean
) {
  const { ink, muted, hair } = inkPair(useLightInk)
  const maxW = 1420
  let size = 210
  for (const line of lines) size = Math.min(size, fitSize(ctx, line, 210, 70, maxW, FONT_ANTON))
  const track = Math.round(size * 0.018)
  const gap = Math.max(10, Math.round(size * 0.12))
  const metrics = lines.map((l) => lineMetrics(ctx, l, size, track))
  const stackH = metrics.reduce(
    (a, m, i) => a + m.ascent + m.descent + (i < metrics.length - 1 ? gap : 0),
    0
  )
  let cursor = CANVAS * 0.4 - stackH / 2
  const cx = CANVAS / 2

  drawMono(ctx, 'STONK', cx, 160, 28, muted, 'center', 600, 4)

  for (let i = 0; i < lines.length; i++) {
    const baseline = cursor + metrics[i].ascent
    drawAnton(ctx, lines[i], cx, baseline, size, ink, useLightInk, 'center', track)
    if (i === 0 && lines.length > 1) {
      const w = Math.min(metrics[i].width * 0.55, 420)
      ctx.strokeStyle = hair
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx - w / 2, baseline + metrics[i].descent + gap * 0.35)
      ctx.lineTo(cx + w / 2, baseline + metrics[i].descent + gap * 0.35)
      ctx.stroke()
    }
    cursor += metrics[i].ascent + metrics[i].descent + (i < lines.length - 1 ? gap : 0)
  }

  drawBrandColophon(ctx, mark, ink, hair)
}

function layoutTicket(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  mark: string,
  useLightInk: boolean
) {
  const { ink, muted, hair } = inkPair(useLightInk)
  const pad = 160
  const boxX = pad
  const boxY = 220
  const boxW = CANVAS - pad * 2
  const boxH = 1180

  ctx.strokeStyle = ink
  ctx.lineWidth = 8
  ctx.strokeRect(boxX, boxY, boxW, boxH)
  ctx.strokeStyle = hair
  ctx.lineWidth = 2
  ctx.strokeRect(boxX + 18, boxY + 18, boxW - 36, boxH - 36)

  ctx.fillStyle = muted
  for (let y = boxY + 60; y < boxY + boxH - 40; y += 36) {
    ctx.beginPath()
    ctx.arc(boxX + boxW - 8, y, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  drawMono(ctx, 'STONKMUGS  ·  TRADE TICKET', boxX + 56, boxY + 70, 26, muted, 'left', 600, 2)
  drawMono(ctx, 'LIVE', boxX + boxW - 56, boxY + 70, 26, ink, 'right', 700, 2)

  ctx.strokeStyle = hair
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(boxX + 48, boxY + 100)
  ctx.lineTo(boxX + boxW - 48, boxY + 100)
  ctx.stroke()

  const maxW = boxW - 140
  let size = 168
  for (const line of lines) size = Math.min(size, fitSize(ctx, line, 168, 56, maxW, FONT_ANTON))
  const track = Math.round(size * 0.02)
  const gap = Math.max(8, Math.round(size * 0.1))
  const metrics = lines.map((l) => lineMetrics(ctx, l, size, track))
  const stackH = metrics.reduce(
    (a, m, i) => a + m.ascent + m.descent + (i < metrics.length - 1 ? gap : 0),
    0
  )
  let cursor = boxY + boxH * 0.42 - stackH / 2

  for (let i = 0; i < lines.length; i++) {
    const baseline = cursor + metrics[i].ascent
    drawAnton(ctx, lines[i], boxX + 70, baseline, size, ink, useLightInk, 'left', track)
    cursor += metrics[i].ascent + metrics[i].descent + (i < lines.length - 1 ? gap : 0)
  }

  drawMono(ctx, mark.toUpperCase(), boxX + 56, boxY + boxH - 48, 24, muted, 'left', 600, 2)
  drawMono(ctx, 'NOT FINANCIAL ADVICE', boxX + boxW - 56, boxY + boxH - 48, 22, muted, 'right', 600, 1.5)
}

function layoutStamp(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  mark: string,
  useLightInk: boolean
) {
  const { ink, muted, hair } = inkPair(useLightInk)
  const cx = CANVAS / 2
  const cy = CANVAS * 0.44
  const r = 620

  ctx.strokeStyle = ink
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 4
  ctx.strokeStyle = hair
  ctx.beginPath()
  ctx.arc(cx, cy, r - 28, 0, Math.PI * 2)
  ctx.stroke()

  drawMono(ctx, 'STONKMUGS', cx, cy - r + 90, 28, muted, 'center', 600, 4)
  drawMono(ctx, 'LIVE', cx, cy + r - 70, 26, ink, 'center', 700, 3)

  const maxW = r * 1.35
  let size = 150
  for (const line of lines) size = Math.min(size, fitSize(ctx, line, 150, 52, maxW, FONT_ANTON))
  const track = Math.round(size * 0.025)
  const gap = Math.max(6, Math.round(size * 0.08))
  const metrics = lines.map((l) => lineMetrics(ctx, l, size, track))
  const stackH = metrics.reduce(
    (a, m, i) => a + m.ascent + m.descent + (i < metrics.length - 1 ? gap : 0),
    0
  )
  let cursor = cy - stackH / 2

  for (let i = 0; i < lines.length; i++) {
    const baseline = cursor + metrics[i].ascent
    drawAnton(ctx, lines[i], cx, baseline, size, ink, useLightInk, 'center', track)
    cursor += metrics[i].ascent + metrics[i].descent + (i < lines.length - 1 ? gap : 0)
  }

  drawMono(ctx, mark.toUpperCase(), cx, CANVAS - 90, 24, muted, 'center', 600, 2)
}

function layoutTape(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  mark: string,
  useLightInk: boolean
) {
  const { ink, muted, hair } = inkPair(useLightInk)
  const cx = CANVAS / 2

  drawMono(ctx, 'TAPE READ', cx, 200, 30, muted, 'center', 600, 4)

  ctx.strokeStyle = ink
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(280, 250)
  ctx.lineTo(CANVAS - 280, 250)
  ctx.stroke()
  ctx.strokeStyle = hair
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(280, 262)
  ctx.lineTo(CANVAS - 280, 262)
  ctx.stroke()

  const maxW = 1400
  const lead = lines[0]
  const rest = lines.slice(1)
  const leadSize = fitSize(ctx, lead, 200, 72, maxW, FONT_ANTON)
  const leadTrack = Math.round(leadSize * 0.02)
  const leadM = lineMetrics(ctx, lead, leadSize, leadTrack)
  let y = CANVAS * 0.4
  drawAnton(ctx, lead, cx, y, leadSize, ink, useLightInk, 'center', leadTrack)
  y += leadM.descent + 48

  for (const line of rest) {
    const size = fitSize(ctx, line, 72, 40, maxW, FONT_MONO, 700)
    drawMono(ctx, line, cx, y + size * 0.75, size, muted, 'center', 700, 2)
    y += size + 28
  }

  ctx.strokeStyle = hair
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(280, CANVAS - 200)
  ctx.lineTo(CANVAS - 280, CANVAS - 200)
  ctx.stroke()
  drawMono(ctx, mark.toUpperCase(), cx, CANVAS - 150, 26, ink, 'center', 600, 2)
}

function layoutLedger(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  mark: string,
  useLightInk: boolean
) {
  const { ink, muted, hair } = inkPair(useLightInk)
  const left = 200

  drawMono(ctx, 'POSITION', left, 220, 26, muted, 'left', 600, 3)
  ctx.strokeStyle = hair
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(left, 250)
  ctx.lineTo(CANVAS - 200, 250)
  ctx.stroke()

  const maxW = 1400
  let size = 180
  for (const line of lines) size = Math.min(size, fitSize(ctx, line, 180, 60, maxW, FONT_ANTON))
  const track = Math.round(size * 0.02)
  const gap = Math.max(10, Math.round(size * 0.11))
  const metrics = lines.map((l) => lineMetrics(ctx, l, size, track))
  let cursor = 340

  for (let i = 0; i < lines.length; i++) {
    const baseline = cursor + metrics[i].ascent
    drawAnton(ctx, lines[i], left, baseline, size, ink, useLightInk, 'left', track)
    ctx.strokeStyle = hair
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(left, baseline + metrics[i].descent + gap * 0.45)
    ctx.lineTo(CANVAS - 200, baseline + metrics[i].descent + gap * 0.45)
    ctx.stroke()
    cursor += metrics[i].ascent + metrics[i].descent + gap
  }

  drawBrandColophon(ctx, mark, ink, hair)
}

/** Render a drop slogan to a Printful-ready 1800×1800 PNG data URL. */
export function renderSloganToDataURL(opts: SloganRenderOptions): string {
  const { lines, collectibleMark, layout = 'poster', useLightInk = false } = opts
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS
  canvas.height = CANVAS
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not render slogan')

  const cleaned = lines.map((l) => l.trim()).filter(Boolean)
  if (cleaned.length === 0) throw new Error('Slogan needs at least one line')

  ctx.clearRect(0, 0, CANVAS, CANVAS)

  switch (layout) {
    case 'ticket':
      layoutTicket(ctx, cleaned, collectibleMark, useLightInk)
      break
    case 'stamp':
      layoutStamp(ctx, cleaned, collectibleMark, useLightInk)
      break
    case 'tape':
      layoutTape(ctx, cleaned, collectibleMark, useLightInk)
      break
    case 'ledger':
      layoutLedger(ctx, cleaned, collectibleMark, useLightInk)
      break
    default:
      layoutPoster(ctx, cleaned, collectibleMark, useLightInk)
  }

  return canvas.toDataURL('image/png')
}

export async function ensureSloganFontsLoaded(): Promise<void> {
  if (typeof window === 'undefined' || !document.fonts?.load) return
  try {
    await Promise.all([
      document.fonts.load(`400 120px ${fontAnton.style.fontFamily}`),
      document.fonts.load(`600 48px ${fontJetbrains.style.fontFamily}`),
      document.fonts.load(`700 48px ${fontJetbrains.style.fontFamily}`),
    ])
    await document.fonts.ready
  } catch {
    /* system fallback */
  }
}
