import { Anton, Bebas_Neue, JetBrains_Mono, Oswald } from 'next/font/google'

/** Tight all-caps display — hero ticker + price at matched sizes */
export const fontAnton = Anton({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-design-anton',
})

export const fontBebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-design-bebas',
})

export const fontOswald = Oswald({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-design-oswald',
})

export const fontJetbrains = JetBrains_Mono({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-design-mono',
})
