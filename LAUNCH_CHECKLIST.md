# Launch Checklist

Use this as the source of truth before going live.  
Mark items as complete as they are verified in the production-like environment.

## 1) Payments & Checkout (Must-Have)

- [ ] Card payment success path validated end-to-end
- [ ] Apple Pay / Google Pay success path validated (where available)
- [ ] Declined card flow shows clean, actionable error
- [ ] 3DS / additional auth flow validated (if triggered)
- [ ] "Back" navigation between shipping/payment steps works cleanly
- [ ] No duplicate payment intents created unexpectedly in normal flow

## 2) Webhooks & Idempotency (Must-Have)

- [ ] `STRIPE_WEBHOOK_SECRET` configured in production
- [ ] Stripe webhook endpoint receives and verifies signatures
- [ ] `payment_intent.succeeded` event path tested
- [ ] Webhook replay does **not** create duplicate fulfillment
- [x] Duplicate fulfill attempts return "already fulfilled" behavior

## 3) Fulfillment Safety (Must-Have)

- [ ] Successful payment creates exactly one Printful order
- [ ] Failed fulfillment surfaces clear support-facing diagnostics
- [x] Shipping validation blocks invalid addresses before payment
- [x] Metadata for fulfillment (design/size/color/qty/imageUrl) present and correct
- [x] Base64 design payloads are normalized to hosted URLs before Stripe metadata

## 4) Production Configuration (Must-Have)

- [ ] `STRIPE_SECRET_KEY` set
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` set
- [ ] `STRIPE_WEBHOOK_SECRET` set
- [ ] `PRINTFUL_API_KEY` set
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] Any staging/local fallback URLs removed from production config

## 5) Trust, Policy, and Support (Must-Have)

- [x] Top navigation links accessible: Shipping, Returns, Contact, Privacy, Terms
- [ ] Policy page copy reviewed for legal/business accuracy
- [ ] Support contact email/domain is real and monitored
- [ ] Footer trust copy reviewed and accurate

## 6) Reliability & Abuse Protection (Strongly Recommended)

- [x] Rate limiting added for public API routes (payment + generation + search)
- [x] Basic abuse/bot protection strategy in place
- [ ] Server logs retained and searchable
- [x] Structured JSON logs + request IDs added for payment/fulfillment/webhook routes
- [ ] Alerts configured for payment failures, webhook failures, fulfillment failures

## 7) QA Matrix (Strongly Recommended)

- [ ] Chrome desktop checkout pass
- [ ] Safari desktop checkout pass
- [ ] Mobile Safari checkout pass
- [ ] Mobile Chrome checkout pass
- [ ] Shared design link prefill flow validated
- [ ] Ticker search suggestion behavior validated (no duplicate re-open bug)

## 8) Post-Launch Readiness

- [x] Manual refund/issue handling procedure documented
- [x] Known-issues list created
- [x] Rollback plan documented
- [ ] Owner assigned for launch-day monitoring

---

## Quick Go/No-Go Script (30-60 min)

1. Place one successful test order from design creation through payment and fulfillment.
2. Confirm one payment -> one Printful order.
3. Trigger one failed payment and confirm UX recovery.
4. Replay webhook event and confirm idempotent behavior.
5. Verify top nav/policy/contact links and support address.
6. If all pass, proceed to launch.

