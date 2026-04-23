# Known Issues

Track current non-blocking issues and operational caveats.

## Open

- Apple Pay / Google Pay availability depends on browser/device + Stripe dashboard configuration.
- Mockup generation may rate-limit intermittently from upstream providers.
- In-memory rate limits reset on server restart (acceptable for initial launch; replace with durable store for scale).

## Recently Resolved

- Stripe metadata size errors from base64 image URLs (now normalized to hosted URLs before metadata write).
- Duplicate fulfillment risk on retries (idempotent fulfillment path now returns already-fulfilled).
- Ticker suggestion dropdown reopening after selection (suppressed until user edits ticker again).

