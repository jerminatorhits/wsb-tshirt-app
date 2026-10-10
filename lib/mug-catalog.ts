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
 * Selling priority first (top 10), then the rest of the bank.
 * All are live buyable SKUs — unlist by commenting out / moving to ARCHIVE.
 */
const RAW_MUGS: RawMug[] = [
  // —— Top 10 ——
  {
    title: 'I Survived CPI',
    lines: ['I SURVIVED', 'CPI'],
    blurb: 'For anyone who lived through 8:30am.',
  },
  {
    title: 'AI. Just AI',
    lines: ['AI.', 'JUST AI'],
    blurb: 'When the thesis is one word long.',
  },
  {
    title: 'Open the Casino',
    lines: ['OPEN THE', 'CASINO'],
    blurb: 'Market open. Degeneracy approved.',
  },
  {
    title: 'Do It Daddy Jensen',
    lines: ['DO IT', 'DADDY', 'JENSEN'],
    blurb: 'Guidance day energy. Unironically.',
  },
  {
    title: "I'm Done With SPY — Until Tomorrow",
    lines: ["I'M DONE", 'WITH SPY', 'UNTIL TOMORROW'],
    blurb: 'You say this every quarter. We know.',
  },
  {
    title: 'Fresh Batch of Calls Vaporized',
    lines: ['FRESH BATCH OF', 'CALLS', 'VAPORIZED'],
    blurb: 'A receipt for the ones that didn’t print.',
  },
  {
    title: '0DTE & Caffeine',
    lines: ['0DTE', '&', 'CAFFEINE'],
    blurb: 'Breakfast of regarded champions.',
  },
  {
    title: "It's Not a Loss Until I Sell",
    lines: ["IT'S NOT A LOSS", 'UNTIL I SELL'],
    blurb: 'Accounting creative enough for the SEC.',
  },
  {
    title: 'Source: Trust Me Bro',
    lines: ['SOURCE:', 'TRUST ME BRO'],
    blurb: 'Peer-reviewed by the timeline.',
  },
  {
    title: 'Financially Regarded',
    lines: ['FINANCIALLY', 'REGARDED'],
    blurb: 'A medical condition. A lifestyle.',
  },

  // —— Floor classics ——
  {
    title: 'Just Like That',
    lines: ['JUST LIKE', 'THAT'],
    blurb: 'The chart said what it said.',
  },
  {
    title: 'What in the Actual Hell Happened Today?',
    lines: ['WHAT IN THE', 'ACTUAL HELL', 'HAPPENED TODAY?'],
    blurb: 'End-of-day journal entry.',
  },
  {
    title: 'Size Position Big — Massive Loss',
    lines: ['SIZE POSITION BIG', 'MASSIVE LOSS'],
    blurb: 'Risk on. Results optional.',
  },
  {
    title: 'Size Position Small — Smallest Gain on Earth',
    lines: ['SIZE POSITION SMALL', 'SMALLEST GAIN', 'ON EARTH'],
    blurb: 'Precision underperformance.',
  },
  {
    title: 'NVDA to $10T Is Not a Meme Anymore',
    lines: ['NVDA TO $10T', 'IS NOT A MEME', 'ANYMORE'],
    blurb: 'Normalizing the absurd.',
  },
  {
    title: 'Jensen, My Future Depends on You',
    lines: ['JENSEN,', 'MY FUTURE', 'DEPENDS ON YOU'],
    blurb: 'Career advice from the keynote.',
  },
  {
    title: 'I Picked the Wrong Week to Stop Sniffing Glue',
    lines: ['I PICKED THE', 'WRONG WEEK TO', 'STOP SNIFFING GLUE'],
    blurb: 'Airplane movie energy. Market edition.',
  },
  {
    title: 'Welp… Zips Up Pants',
    lines: ['WELP…', 'ZIPS UP PANTS'],
    blurb: 'Post-trade composure protocol.',
  },
  {
    title: 'Chat, Why Are We Pumping?',
    lines: ['CHAT,', 'WHY ARE WE', 'PUMPING?'],
    blurb: 'Asking the important questions.',
  },
  {
    title: 'Nothing Matters Till 8:30',
    lines: ['NOTHING MATTERS', 'TILL 8:30'],
    blurb: 'Macro breakfast. Bring coffee.',
  },
  {
    title: "I'm Not Having Fun",
    lines: ["I'M NOT", 'HAVING FUN'],
    blurb: 'Honest portfolio commentary.',
  },
  {
    title: "One Day You're Calling Bottoms — The Next You're Blowing Tops",
    lines: ["ONE DAY YOU'RE", 'CALLING BOTTOMS', "THE NEXT YOU'RE", 'BLOWING TOPS'],
    blurb: 'Range: unlimited. Dignity: not.',
  },
  {
    title: 'GUH',
    lines: ['GUH'],
    blurb: 'The only technical analysis you need.',
  },
  {
    title: 'Good Morning Vietnam',
    lines: ['GOOD MORNING', 'VIETNAM'],
    blurb: 'Pre-market wake-up call.',
  },
  {
    title: 'The Casino Is Open',
    lines: ['THE CASINO', 'IS OPEN'],
    blurb: 'Bell rings. Degens assemble.',
  },
  {
    title: 'Bullish Until Further Notice',
    lines: ['BULLISH UNTIL', 'FURTHER NOTICE'],
    blurb: 'Official positioning statement.',
  },
  {
    title: 'Priced In',
    lines: ['PRICED IN'],
    blurb: 'The three most expensive words.',
  },
  {
    title: 'Already Priced In',
    lines: ['ALREADY', 'PRICED IN'],
    blurb: 'Yes, even that.',
  },
  {
    title: 'It Was Priced In',
    lines: ['IT WAS', 'PRICED IN'],
    blurb: 'Hindsight, but make it smug.',
  },
  {
    title: 'My Calls Were Not Priced In',
    lines: ['MY CALLS WERE', 'NOT PRICED IN'],
    blurb: 'The exception that proves the wipeout.',
  },
  {
    title: 'Buy the Dip — Again.',
    lines: ['BUY THE DIP', 'AGAIN.'],
    blurb: 'Practice makes poorer.',
  },
  {
    title: 'This Is Fine. My 0DTEs Are Not.',
    lines: ['THIS IS FINE.', 'MY 0DTES', 'ARE NOT.'],
    blurb: 'House on fire. Theta smiling.',
  },
  {
    title: 'Earnings Are My Super Bowl',
    lines: ['EARNINGS ARE', 'MY SUPER BOWL'],
    blurb: 'Tailgate starts at AH.',
  },
  {
    title: 'Inverse Cramer',
    lines: ['INVERSE', 'CRAMER'],
    blurb: 'The only hedge that backtests.',
  },
  {
    title: 'I Did My Own Research',
    lines: ['I DID MY', 'OWN RESEARCH'],
    blurb: 'YouTube counts. We checked.',
  },
  {
    title: 'Due Diligence Was Performed',
    lines: ['DUE DILIGENCE', 'WAS PERFORMED'],
    blurb: 'Box checked. Soul not.',
  },
  {
    title: 'My Portfolio Has Character',
    lines: ['MY PORTFOLIO', 'HAS CHARACTER'],
    blurb: 'Volatility as personality.',
  },
  {
    title: 'Risk Management Is for Cowards',
    lines: ['RISK MANAGEMENT', 'IS FOR COWARDS'],
    blurb: 'Said nobody solvent.',
  },
  {
    title: 'Diversification Is a Personal Attack',
    lines: ['DIVERSIFICATION', 'IS A PERSONAL', 'ATTACK'],
    blurb: 'All-in is a love language.',
  },
  {
    title: 'I Have a Very High Risk Tolerance',
    lines: ['I HAVE A VERY', 'HIGH RISK', 'TOLERANCE'],
    blurb: 'Verified by max pain.',
  },
  {
    title: 'Long-Term Investor — Since 9:31 AM',
    lines: ['LONG-TERM INVESTOR', 'SINCE 9:31 AM'],
    blurb: 'Horizon: lunch.',
  },
  {
    title: 'Diamond Hands, Paper Balance',
    lines: ['DIAMOND HANDS,', 'PAPER BALANCE'],
    blurb: 'Conviction intact. Equity less so.',
  },
  {
    title: 'Generational Wealth Pending',
    lines: ['GENERATIONAL', 'WEALTH PENDING'],
    blurb: 'Status: spinning.',
  },
  {
    title: 'Down 87% — Still Bullish',
    lines: ['DOWN 87%', 'STILL BULLISH'],
    blurb: 'Optimism as a disability.',
  },
  {
    title: "I'm Just Waiting for the Reversal",
    lines: ["I'M JUST WAITING", 'FOR THE', 'REVERSAL'],
    blurb: 'Patience, but make it cope.',
  },
  {
    title: 'One More Trade',
    lines: ['ONE MORE', 'TRADE'],
    blurb: 'Famous last fills.',
  },
  {
    title: 'One More 0DTE',
    lines: ['ONE MORE', '0DTE'],
    blurb: 'Tomorrow’s problem is today’s premium.',
  },
  {
    title: "Surely It Can't Go Lower",
    lines: ['SURELY IT', "CAN'T GO", 'LOWER'],
    blurb: 'Narrator: it could.',
  },
  {
    title: "Surely It Can't Go Higher",
    lines: ['SURELY IT', "CAN'T GO", 'HIGHER'],
    blurb: 'Narrator: hold my beer.',
  },
  {
    title: 'GUH 2: Electric Boogaloo',
    lines: ['GUH 2:', 'ELECTRIC', 'BOOGALOO'],
    blurb: 'The sequel nobody priced in.',
  },

  // —— NVDA / Jensen ——
  {
    title: 'Release the NVDA Files',
    lines: ['RELEASE THE', 'NVDA FILES'],
    blurb: 'Transparency, but for GPUs.',
  },
  {
    title: 'Jensen Please',
    lines: ['JENSEN', 'PLEASE'],
    blurb: 'Polite. Desperate. Effective.',
  },
  {
    title: 'NVDA or Bust',
    lines: ['NVDA', 'OR BUST'],
    blurb: 'Binary outcome. Binary brain.',
  },
  {
    title: 'NVDA to $10T',
    lines: ['NVDA', 'TO $10T'],
    blurb: 'Round numbers hit different.',
  },
  {
    title: 'Jensen, Open the Casino',
    lines: ['JENSEN,', 'OPEN THE', 'CASINO'],
    blurb: 'Keynote as market open.',
  },
  {
    title: 'Made on an NVDA GPU',
    lines: ['MADE ON AN', 'NVDA GPU'],
    blurb: 'Meta. Expensive. Accurate.',
  },
  {
    title: 'My Future Depends on NVDA',
    lines: ['MY FUTURE', 'DEPENDS ON', 'NVDA'],
    blurb: 'Career path: CUDA.',
  },
  {
    title: 'Just NVDA Things',
    lines: ['JUST NVDA', 'THINGS'],
    blurb: 'Lifestyle brand energy.',
  },
  {
    title: 'NVDA Earnings Survivor',
    lines: ['NVDA EARNINGS', 'SURVIVOR'],
    blurb: 'After-hours PTSD badge.',
  },

  // —— Options desk ——
  {
    title: 'My Puts Are Fine',
    lines: ['MY PUTS', 'ARE FINE'],
    blurb: 'Said calmly. Incorrectly.',
  },
  {
    title: 'My Calls Are Fine',
    lines: ['MY CALLS', 'ARE FINE'],
    blurb: 'Also said calmly. Also incorrectly.',
  },
  {
    title: '0DTE Survivor',
    lines: ['0DTE', 'SURVIVOR'],
    blurb: 'Lived to expiry. Barely.',
  },
  {
    title: 'Expiring Worthless Since 2026',
    lines: ['EXPIRING', 'WORTHLESS', 'SINCE 2026'],
    blurb: 'A tradition. A curse.',
  },
  {
    title: 'The Market Has No Memory',
    lines: ['THE MARKET', 'HAS NO', 'MEMORY'],
    blurb: 'You do. That’s the problem.',
  },
  {
    title: 'Theta Is My Enemy',
    lines: ['THETA IS', 'MY ENEMY'],
    blurb: 'Time decay: the silent killer.',
  },
  {
    title: 'Gambling, But Tax Deductible',
    lines: ['GAMBLING, BUT', 'TAX DEDUCTIBLE'],
    blurb: 'Ask your CPA. Then don’t.',
  },
  {
    title: "It's an Investment If I Believe",
    lines: ["IT'S AN INVESTMENT", 'IF I BELIEVE'],
    blurb: 'Faith-based finance.',
  },
  {
    title: 'I Could Have Bought SPY',
    lines: ['I COULD HAVE', 'BOUGHT SPY'],
    blurb: 'The counterfactual that hurts.',
  },

  // —— Survivor variants ——
  {
    title: 'I Survived FOMC',
    lines: ['I SURVIVED', 'FOMC'],
    blurb: 'Press conference scars.',
  },
  {
    title: 'I Survived Earnings',
    lines: ['I SURVIVED', 'EARNINGS'],
    blurb: 'Guidance was not guidance.',
  },
  {
    title: 'I Survived 0DTE',
    lines: ['I SURVIVED', '0DTE'],
    blurb: 'Same-day trauma bonding.',
  },
  {
    title: 'I Survived NVDA Earnings',
    lines: ['I SURVIVED', 'NVDA', 'EARNINGS'],
    blurb: 'Green candles optional.',
  },
]

/** De-dupe by slug (first wins — keeps top-10 ordering). */
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
