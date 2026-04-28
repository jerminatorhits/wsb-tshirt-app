# Internal product notes

Private reminders for positioning and messaging—not a spec or roadmap unless noted.

## Gift / social angle (keep in mind)

**Idea:** Lean into the **gift-giving** market, not only self-purchase. A friend can buy a shirt **for** a friend who shared an inspiring trade (celebration, inside joke, “you actually printed” energy).

**Status:** No extra product implementation committed yet. Treat this as a **marketing / copy / positioning** thread to revisit (site copy, ads, packaging inserts, holiday pushes, etc.).

## Garment ink (auto mode)

Heather **gray** and saturated **red** tees (Printful-style) usually need **light / near-white** art for the same reason as black/navy: mid-tone or chromatic fabric swallows cool dark grays (`#0f172a`). Auto light-ink includes `gray` and `red` in `isDarkShirtColor()` in `lib/text-design.ts`. Users can still force Dark / Light in Advanced.

## “Purchase like a trade” (experience / positioning)

**Idea:** The buying flow should **feel like placing a stock or option**—same mental model and similar actions (select instrument / terms, confirm, “execute”). Reinforces the WSB / markets identity and makes checkout feel intentional, not generic merch.

**Possible polish (later):** lightweight celebration moments—**confetti** or similar on order confirmation / payment success, copy that mirrors broker language (“Review order,” “Submit,” “Filled,” etc.) where it does not confuse legally or with real trading.

**Status:** Marketing and UX direction to keep in mind. Confetti on `/order-success` is implemented; other copy ideas below are optional.

## Conviction / “skin in the game” (copy hook)

**Idea:** Appeal to **conviction** about a trade—owning the shirt is a silly but legible signal that you meant the play. Example angles:

- *“If you don’t have a shirt, do you really believe in your play?”* (provocative, shareable)
- Softer: *“Put your conviction on your chest.”* / *“You didn’t YOLO if there’s no tee.”*

**Use with care:** Playful for the brand; avoid sounding like financial advice or shaming people who don’t buy. Good for **ads, social, email, optional homepage subline**—not a hard requirement for checkout.

**Status:** Messaging only; no product work required unless you A/B test copy.

---

*Add dated bullets below when new themes come up.*
