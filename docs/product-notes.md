# Internal product notes

Private reminders for positioning and messaging—not a spec or roadmap unless noted.

## Orders (Stripe as system of record)

No app DB for v1. Confirmation `orderNumber` (`WSB-…`) lives on PaymentIntent metadata with item/shipping/Printful id. Success page shows summary; `/orders` looks up by number + email via Stripe Search. Full “my orders” account history deferred.

## Merch drops (primary wedge)

**Idea:** The fastest merch brand on the internet — not a catalog. Curated **WSB Drop** collections are the storefront; the ticker generator is secondary. Cadence = whenever a joke is worth printing (same-day is fine), not a fixed weekly schedule.

**Storefront (drops-first):**
- `/` — brand + current drop grid → generator CTA
- `/drop/[slug]` — product + buy (collectible stamp in print file)
- `/create` — ticker generator (former homepage)
- Pricing: mug **$24.99 + $6.99 ship**; edit `lib/products.ts` / catalog anytime
- Brand: **stonkmugs** — collectible mark `STONKMUGS` on the art (no drop numbers — ad hoc cadence)

**Ops:** Market event → WSB reaction → ship the mug → Reddit post → unlist when it’s cold. Goal: 5 organic paid orders before ads.

## Gift / social angle (keep in mind)

**Idea:** Lean into the **gift-giving** market, not only self-purchase. A friend can buy a shirt **for** a friend who shared an inspiring trade (celebration, inside joke, “you actually printed” energy).

**Status:** Soft copy under Buy CTA; shipping form already supports any address.

## Garment ink (auto mode)

Heather **gray** and saturated **red** tees (Printful-style) usually need **light / near-white** art for the same reason as black/navy: mid-tone or chromatic fabric swallows cool dark grays (`#0f172a`). Auto light-ink includes `gray` and `red` in `isDarkShirtColor()` in `lib/text-design.ts`. Users can still force Dark / Light in Advanced.

## “Purchase like a trade” (experience / positioning)

**Idea:** The buying flow should **feel like placing a stock or option**—same mental model and similar actions (select instrument / terms, confirm, “execute”). Reinforces the WSB / markets identity and makes checkout feel intentional, not generic merch.

**Status:** Confetti on `/order-success` is implemented; success headline uses “Order filled.”

## Conviction / “skin in the game” (copy hook)

**Idea:** Appeal to **conviction** about a trade—owning the shirt is a silly but legible signal that you meant the play.

**Status:** Homepage H1 uses conviction framing.

---

*Add dated bullets below when new themes come up.*
