import type { SloganLayout } from '@/lib/slogan-design'
import type { DropProduct } from '@/lib/drops'

type RawMug = {
  title: string
  lines: string[]
  blurb: string
}

const LAYOUTS: SloganLayout[] = ['stamp', 'tape', 'poster', 'ledger', 'ticket']

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[''′]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\$/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72)
}

function toProduct(raw: RawMug, index: number): DropProduct {
  const slug = slugify(raw.title)
  return {
    id: slug,
    slug,
    title: raw.title,
    blurb: raw.blurb,
    lines: raw.lines,
    layout: LAYOUTS[index % LAYOUTS.length],
    productType: 'mug',
    size: '11 oz',
  }
}

/**
 * Live drop — week of Nov 17–21, 2026.
 * S&P/Dow in correction, Nasdaq red YTD, AI/chip unwind.
 * Prior bank lives in `lib/mug-catalog-archive.ts`.
 */
const RAW_MUGS: RawMug[] = [
  {
    title: 'Officially a Correction',
    lines: ['OFFICIALLY', 'A CORRECTION'],
    blurb: 'Down 10% from the high. They have a word for it now.',
  },
  {
    title: 'Nasdaq Red for the Year',
    lines: ['NASDAQ', 'RED FOR', 'THE YEAR'],
    blurb: '2026 gains: returned to sender.',
  },
  {
    title: 'AI Trade Melted',
    lines: ['AI TRADE', 'MELTED'],
    blurb: 'The thesis was fine. The chart disagreed.',
  },
  {
    title: 'Sell the News',
    lines: ['SELL THE', 'NEWS'],
    blurb: 'IPO pops. Portfolio drops. Classic.',
  },
  {
    title: 'Chip Carnage',
    lines: ['CHIP', 'CARNAGE'],
    blurb: 'Semiconductors leading the parade. Downhill.',
  },
  {
    title: 'NVDA November',
    lines: ['NVDA', 'NOVEMBER'],
    blurb: 'A month that felt like a year.',
  },
  {
    title: 'I Bought the Dip Again',
    lines: ['I BOUGHT', 'THE DIP', 'AGAIN'],
    blurb: 'Practice makes poorer.',
  },
  {
    title: 'My Calls Are Ash',
    lines: ['MY CALLS', 'ARE ASH'],
    blurb: 'Premium paid. Lesson received.',
  },
  {
    title: 'Worst Week Energy',
    lines: ['WORST WEEK', 'ENERGY'],
    blurb: 'For portfolios that needed a hug and got a margin call.',
  },
  {
    title: 'This Is Fine My Portfolio Is Not',
    lines: ['THIS IS FINE.', 'MY PORTFOLIO', 'IS NOT.'],
    blurb: 'House on fire. Still refreshing the quote.',
  },
  {
    title: 'Bagholding GPUs',
    lines: ['BAGHOLDING', 'GPUS'],
    blurb: 'Conviction: high. Mark-to-market: rude.',
  },
  {
    title: 'Still Long AI Cope Edition',
    lines: ['STILL LONG AI', 'COPE EDITION'],
    blurb: 'The narrative survived. The P&L did not.',
  },
  {
    title: 'Red Candles Only',
    lines: ['RED CANDLES', 'ONLY'],
    blurb: 'A week with no green on purpose.',
  },
  {
    title: 'I Survived the AI Unwind',
    lines: ['I SURVIVED', 'THE AI', 'UNWIND'],
    blurb: 'Participation trophy for living through Friday.',
  },
  {
    title: 'Down Bad Since October',
    lines: ['DOWN BAD', 'SINCE', 'OCTOBER'],
    blurb: 'From the highs. Into the lore.',
  },
  {
    title: 'Correction Mode Activated',
    lines: ['CORRECTION', 'MODE', 'ACTIVATED'],
    blurb: 'Wall Street’s polite word for pain.',
  },
]

/** Live storefront SKUs (de-dupe by slug). */
export const ALL_MUG_PRODUCTS: DropProduct[] = (() => {
  const seen = new Set<string>()
  const out: DropProduct[] = []
  RAW_MUGS.forEach((raw, index) => {
    const product = toProduct(raw, index)
    if (seen.has(product.slug)) return
    seen.add(product.slug)
    out.push(product)
  })
  return out
})()
