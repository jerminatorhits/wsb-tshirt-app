/**
 * Public support: we never publish a personal inbox.
 * Contact form → /api/contact → Web3Forms (or Resend) delivers privately.
 *
 * Vercel env (server only, not NEXT_PUBLIC_):
 * - WEB3FORMS_ACCESS_KEY — get at https://web3forms.com (enter your Gmail; key is public-safe enough server-side)
 * Optional later:
 * - RESEND_API_KEY + SUPPORT_INBOX + RESEND_FROM
 */
export function isContactDeliveryConfigured(): boolean {
  return Boolean(
    process.env.WEB3FORMS_ACCESS_KEY?.trim() ||
      (process.env.RESEND_API_KEY?.trim() && process.env.SUPPORT_INBOX?.trim())
  )
}
