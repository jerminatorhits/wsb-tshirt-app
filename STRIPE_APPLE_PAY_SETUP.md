# Setting Up Apple Pay with Stripe

Apple Pay only appears after `stonkmugs.com` is registered and verified with Stripe. Until then, checkout falls back to card entry (what you saw on iPhone).

## Why it failed

`https://stonkmugs.com/.well-known/apple-developer-merchantid-domain-association` was missing (404). Stripe’s `canMakePayment()` then returns no Apple Pay, so the button never renders.

## One-time setup (Live mode — production)

Do this in the **same mode as production keys** (Live if `stonkmugs.com` uses `sk_live_` / `pk_live_`).

1. Stripe Dashboard → **Settings** → **Payment methods** → **Apple Pay**
2. **Add domain**: `stonkmugs.com` (no `https://`, no trailing slash)
3. Deploy this repo so the verification file is live at:
   ```
   https://stonkmugs.com/.well-known/apple-developer-merchantid-domain-association
   ```
   File path in repo: `public/.well-known/apple-developer-merchantid-domain-association`
4. In Stripe, click **Verify** next to the domain (green check)
5. Also add `www.stonkmugs.com` if you ever serve checkout there (we redirect www → apex, but register both if unsure)
6. Hard-refresh Safari on iPhone → Payment step → **Pay with Apple Pay** should appear above the card form

## Test mode (local / staging)

Register the same domain under **Test mode** in Stripe if you test with `sk_test_` keys. Test and Live domain lists are separate.

## Device checklist

- Safari on iPhone/Mac (not Chrome for Apple Pay)
- At least one card in Apple Wallet
- Apple Pay enabled in Settings → Wallet & Apple Pay

## Code notes

- Checkout collects shipping first, then wallets confirm with that address (`requestShipping: false`)
- Apple Pay / Google Pay use Stripe Payment Request; card uses Payment Element
