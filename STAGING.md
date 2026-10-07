# Staging deploy

Staging runs on a **separate Vercel project** (`wsb-tshirt-app-staging`) so it never shares live Stripe keys with `www.wsbtees.com`.

## Safety guarantees

| Concern | Staging behavior |
|--------|-------------------|
| Stripe | **Test keys only** (`sk_test_` / `pk_test_`). Live keys throw at runtime. |
| Printful orders | **`PRINTFUL_DRY_RUN=true`** — payments can succeed in test mode; no Printful order is created. |
| Printful catalog | API key may still be present for blank mug/tee mockups (read-only). |
| UI | Amber **STAGING** banner at top of every page. |

Check: `GET /api/staging-status` → `safe: true`, `stripeSecretMode: "test"`, `printfulDryRun: true`.

## Deploy

```bash
# Link CLI to staging project (not production wsbtees)
vercel link --project wsb-tshirt-app-staging --yes

vercel --prod --yes
```

Production site remains: Vercel project `wsb-tshirt-app-s98k` → https://www.wsbtees.com

## Stripe test cards

Use Stripe test mode cards (e.g. `4242 4242 4242 4242`). No real charges.

## Webhooks (optional)

Point a **test-mode** Stripe webhook at:

`https://wsb-tshirt-app-staging.vercel.app/api/webhooks/stripe`

Set `STRIPE_WEBHOOK_SECRET` on the staging project only (test endpoint signing secret).
