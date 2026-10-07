/**
 * Runtime guards so staging/preview never charge real cards or print real merch by mistake.
 */

export type AppRuntimeEnv = 'production' | 'staging' | 'development'

export function getAppRuntimeEnv(): AppRuntimeEnv {
  const explicit = (process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || '')
    .trim()
    .toLowerCase()
  if (explicit === 'staging' || explicit === 'preview') return 'staging'
  if (explicit === 'production') return 'production'
  // Dedicated staging Vercel project (name contains "staging") even when VERCEL_ENV=production
  const project = (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || '')
    .trim()
    .toLowerCase()
  if (project.includes('staging')) return 'staging'
  if (process.env.VERCEL_ENV === 'preview') return 'staging'
  if (process.env.VERCEL_ENV === 'production') return 'production'
  return 'development'
}

export function isStagingRuntime(): boolean {
  return getAppRuntimeEnv() === 'staging'
}

/** Staging/preview must never use live Stripe keys. */
export function assertStripeKeysSafeForRuntime(): void {
  if (!isStagingRuntime()) return

  const secret = process.env.STRIPE_SECRET_KEY || ''
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

  if (secret.startsWith('sk_live_') || publishable.startsWith('pk_live_')) {
    throw new Error(
      'Staging/preview refuses live Stripe keys. Set sk_test_ / pk_test_ for Preview (and APP_ENV=staging).'
    )
  }
}

/**
 * When true, fulfillment skips Printful order creation.
 * Defaults ON for staging/preview unless PRINTFUL_DRY_RUN=false.
 */
export function isPrintfulDryRun(): boolean {
  const raw = (process.env.PRINTFUL_DRY_RUN || '').toLowerCase().trim()
  if (raw === 'false' || raw === '0' || raw === 'off') return false
  if (raw === 'true' || raw === '1' || raw === 'on') return true
  return isStagingRuntime()
}
