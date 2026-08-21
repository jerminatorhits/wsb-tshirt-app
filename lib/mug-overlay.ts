import { isMugSize, type MugSizeKey } from '@/lib/products'

/** Printful Front-view blank (product 19) — local so preview never waits on the mockup API. */
export const MUG_BLANK_BY_SIZE: Record<MugSizeKey, string> = {
  '11 oz': '/mugs/blank-11oz.jpg',
  '15 oz': '/mugs/blank-15oz.jpg',
  '20 oz': '/mugs/blank-20oz.jpg',
}

/**
 * Overlay box is the Printful Front-view print AABB (measured from full-bleed
 * magenta mockups on variants 1320 / 4830 / 16586). Warp params were tuned
 * against those mockups plus GME / TSLA / options lockups on the same blanks.
 */
export type MugOverlaySpec = {
  left: number
  top: number
  width: number
  height: number
  /** Visible wrap angle (radians) for cylindrical projection. */
  thetaMax: number
  /** Vertical squeeze at the wrap edges. */
  vCurve: number
  /** Downward bow so horizontals follow the camera-from-above ellipse. */
  bow: number
  /** Uniform shrink inside the measured AABB. */
  scale: number
}

export const MUG_OVERLAY_BY_SIZE: Record<MugSizeKey, MugOverlaySpec> = {
  '11 oz': {
    left: 0.269,
    top: 0.242,
    width: 0.459,
    height: 0.551,
    thetaMax: 1.2,
    vCurve: 0.1,
    bow: 0.04,
    scale: 0.86,
  },
  '15 oz': {
    left: 0.299,
    top: 0.236,
    width: 0.415,
    height: 0.548,
    thetaMax: 1.15,
    vCurve: 0.09,
    bow: 0.04,
    scale: 0.88,
  },
  '20 oz': {
    left: 0.257,
    top: 0.228,
    width: 0.462,
    height: 0.586,
    thetaMax: 1.22,
    vCurve: 0.1,
    bow: 0.045,
    scale: 0.86,
  },
}

export function mugBlankSrc(size: string): string {
  return MUG_BLANK_BY_SIZE[isMugSize(size) ? size : '11 oz']
}

export function mugOverlaySpec(size: string): MugOverlaySpec {
  return MUG_OVERLAY_BY_SIZE[isMugSize(size) ? size : '11 oz']
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

/** Map the 1800×1800 print file onto the mug face with a front-view cylinder warp. */
export function drawMugDesignOnCanvas(
  ctx: CanvasRenderingContext2D,
  design: CanvasImageSource,
  canvasW: number,
  canvasH: number,
  spec: MugOverlaySpec
) {
  const dw =
    'naturalWidth' in design && typeof design.naturalWidth === 'number' && design.naturalWidth > 0
      ? design.naturalWidth
      : (design as { width: number }).width
  const dh =
    'naturalHeight' in design && typeof design.naturalHeight === 'number' && design.naturalHeight > 0
      ? design.naturalHeight
      : (design as { height: number }).height
  if (!dw || !dh) return

  const scale = spec.scale
  const boxW = canvasW * spec.width * scale
  const boxH = canvasH * spec.height * scale
  const originX = canvasW * (spec.left + (spec.width * (1 - scale)) / 2)
  const originY = canvasH * (spec.top + (spec.height * (1 - scale)) / 2)

  const thetaMax = spec.thetaMax
  const sinTm = Math.sin(Math.min(thetaMax, 1.52))
  const slices = 56

  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  for (let i = 0; i < slices; i++) {
    const x0 = (i / slices) * 2 - 1
    const x1 = ((i + 1) / slices) * 2 - 1
    const xc = (x0 + x1) / 2

    const u0 = (Math.asin(clamp(x0 * sinTm, -0.999, 0.999)) / thetaMax + 1) / 2
    const u1 = (Math.asin(clamp(x1 * sinTm, -0.999, 0.999)) / thetaMax + 1) / 2
    const theta = Math.asin(clamp(xc * sinTm, -0.999, 0.999))
    const pad = spec.vCurve * boxH * (1 - Math.cos(theta))
    const bowOff = spec.bow * boxH * (1 - xc * xc)

    const dx = originX + (i / slices) * boxW
    const dSliceW = Math.max(0.6, boxW / slices + 0.35)
    const dy = originY + pad + bowOff
    const dSliceH = Math.max(1, boxH - 2 * pad)

    const sx = u0 * dw
    const sSliceW = Math.max(0.5, (u1 - u0) * dw)

    ctx.drawImage(design, sx, 0, sSliceW, dh, dx, dy, dSliceW, dSliceH)
  }

  ctx.restore()
}
