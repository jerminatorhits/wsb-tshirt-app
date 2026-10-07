import { isStagingRuntime } from '@/lib/env-safety'

/** Visible marker so staging is never mistaken for production checkout. */
export default function StagingBanner() {
  if (!isStagingRuntime()) return null

  return (
    <div className="shrink-0 bg-amber-400 px-3 py-1.5 text-center text-xs font-semibold text-neutral-900">
      STAGING — test Stripe only · Printful dry-run (no real prints)
    </div>
  )
}
