# Observability Playbook

This project emits structured JSON logs for critical payment and fulfillment endpoints.

## Request IDs

- Every response from these routes includes `x-request-id`:
  - `/api/create-payment-intent`
  - `/api/fulfill-order`
  - `/api/webhooks/stripe`
- Use this value to correlate client-side errors with server logs.

## Structured Log Events

Current event names include:

- `payment_intent.create.requested`
- `payment_intent.create.rate_limited`
- `payment_intent.create.succeeded`
- `payment_intent.create.failed`
- `fulfill_order.requested`
- `fulfill_order.succeeded`
- `fulfill_order.failed`
- `fulfill_order.exception`
- `webhook.stripe.received`
- `webhook.stripe.invalid_signature`
- `webhook.stripe.checkout_session.fulfill_failed`
- `webhook.stripe.payment_intent.fulfill_failed`

## Search Queries (examples)

Use your platform's log search with event names and levels:

- Payment creation failures:
  - `event="payment_intent.create.failed"`
- Fulfillment failures:
  - `event="fulfill_order.failed" OR event="fulfill_order.exception"`
- Webhook signature issues:
  - `event="webhook.stripe.invalid_signature"`
- By request id:
  - `requestId="<x-request-id value>"`

## Alert Recommendations

Set alerts over 5-minute windows:

1. **High Payment Failures**
   - Condition: `payment_intent.create.failed` >= 5
2. **Fulfillment Failures**
   - Condition: `fulfill_order.failed OR fulfill_order.exception` >= 3
3. **Webhook Signature Failures**
   - Condition: `webhook.stripe.invalid_signature` >= 1
4. **Webhook Fulfillment Failures**
   - Condition: `webhook.stripe.*.fulfill_failed` >= 3

## Retention

Set your hosting provider's log retention to at least 14-30 days for launch.
Recommended: export critical logs to a centralized store (Datadog, Logtail, CloudWatch, etc.).

