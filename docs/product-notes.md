# Internal product notes

Private reminders for positioning and messaging—not a spec or roadmap unless noted.

## Merch drops (primary wedge)

**Idea:** Not a catalog store and not generic dropshipping. Run **timed conviction drops**: ticker/option joke → live mockup → pay → Printful ships. ChatGPT can’t own the buy button.

**Shipped UX (drop pass):**
- Mockup-first create flow
- Featured TSLA/$500 landing when no share link
- Mug default for instant preview; tee one tap away
- Quick ticker chips + Share (Web Share / copy link)
- Post-order “Flex this drop” using `lib/drop-share.ts` + sessionStorage
- Gift line under Buy CTA
- Sync design render so preview never stays blank waiting on fonts

**Ops:** One moment at a time. Post the mockup image + share URL where the joke already lives. Goal: 5 organic paid orders before ads.

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
