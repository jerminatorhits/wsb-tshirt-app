import { NextResponse } from 'next/server'
import {
  getAppRuntimeEnv,
  isPrintfulDryRun,
  isStagingRuntime,
} from '@/lib/env-safety'

/**
 * Public, non-secret status for verifying a staging deploy is safe.
 * Never returns key material — only mode flags / prefixes.
 */
export async function GET() {
  const secret = process.env.STRIPE_SECRET_KEY || ''
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

  const stripeSecretMode = secret.startsWith('sk_live_')
    ? 'live'
    : secret.startsWith('sk_test_')
      ? 'test'
      : secret
        ? 'unknown'
        : 'missing'
  const stripePublishableMode = publishable.startsWith('pk_live_')
    ? 'live'
    : publishable.startsWith('pk_test_')
      ? 'test'
      : publishable
        ? 'unknown'
        : 'missing'

  const staging = isStagingRuntime()
  const unsafeLiveOnStaging =
    staging && (stripeSecretMode === 'live' || stripePublishableMode === 'live')

  return NextResponse.json({
    runtime: getAppRuntimeEnv(),
    vercelEnv: process.env.VERCEL_ENV || null,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    stripeSecretMode,
    stripePublishableMode,
    printfulDryRun: isPrintfulDryRun(),
    printfulKeyConfigured: Boolean(process.env.PRINTFUL_API_KEY),
    webhookSecretConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    safe: !unsafeLiveOnStaging && !(staging && !isPrintfulDryRun()),
  })
}
