import type { DropCollection } from '@/lib/drops'

/** Format an endsAt ISO date for storefront (e.g. "Nov 27"). */
export function formatDropEndsLabel(endsAt: string): string {
  const d = new Date(endsAt)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  })
}

export function isDropLive(drop: Pick<DropCollection, 'endsAt'>, now = new Date()): boolean {
  if (!drop.endsAt) return true
  return now.getTime() <= new Date(drop.endsAt).getTime()
}

export function dropAvailabilityLine(drop: Pick<DropCollection, 'endsAt'>): string | null {
  if (!drop.endsAt) return null
  const label = formatDropEndsLabel(drop.endsAt)
  if (!label) return null
  if (!isDropLive(drop)) return `This drop ended ${label}`
  return `Available through ${label}`
}
