/** Shared merch types/constants (must not live in `app/page.tsx` — Next disallows non-page exports there). */

export interface GeneratedDesign {
  id: string
  topic: string
  imageUrl: string
  prompt: string
  createdAt: string
  message?: string
  isFallback?: boolean
}

export const COLORS = [
  { name: 'White', value: 'white', hex: '#FFFFFF' },
  { name: 'Black', value: 'black', hex: '#1a1a1a' },
  { name: 'Navy', value: 'navy', hex: '#1E3A5F' },
  { name: 'Gray', value: 'gray', hex: '#6B7280' },
  { name: 'Red', value: 'red', hex: '#DC2626' },
] as const

export type ColorOption = (typeof COLORS)[number]

export interface TrendingTopic {
  id: string
  title: string
  source: string
  upvotes?: number
}
