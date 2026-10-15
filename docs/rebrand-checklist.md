# Rebrand / domain change checklist

Use this when the **site name** and/or **domain** changes (e.g. away from stonkmugs / stonkmugs.com).  
Prior domains already in play: `wsbtees.com` → redirects to `stonkmugs.com`.

Split into: **name only** vs **domain change** (domain is the expensive one).

---

## A. Domain change (critical — do in order)

### DNS & hosting
- [ ] Buy / point new domain DNS to Vercel
- [ ] Add domain in **Vercel** → Project → Domains (apex + `www`)
- [ ] Update `vercel.json` redirects (today: `wsbtees.com` / `www` / `www.stonkmugs.com` → `stonkmugs.com`)
- [ ] Set `NEXT_PUBLIC_APP_URL` to `https://NEWdomain.com` (Production + Preview as needed)
- [ ] Keep old domain redirecting → new domain for a long time (SEO + shared links)

### Stripe (required for payments + wallets)
- [ ] **Customer-facing business name** — Stripe Dashboard → Settings → Business (shows on statements / Checkout / some receipts)
- [ ] **Statement descriptor** — what appears on bank/card statements (short ASCII; plan this with the new name)
- [ ] **Customer emails / receipts** — brand name in Stripe email settings if customized
- [ ] **Webhook endpoint URL** — must hit the new domain  
  `https://NEWdomain.com/api/webhooks/stripe`  
  Update in Stripe → Developers → Webhooks (Live + Test). Keep old endpoint until cutover is verified, or update in place.
- [ ] **Apple Pay domain** — Settings → Payment methods → Apple Pay → **add new domain**, download/verify association file  
  App already serves: `public/.well-known/apple-developer-merchantid-domain-association`  
  Must be reachable at: `https://NEWdomain.com/.well-known/apple-developer-merchantid-domain-association`  
  Also register `www.` if checkout can load there. Remove or leave old domain as needed.
- [ ] **Payment method domains / Google Pay** — ensure new domain is allowed for wallet payments (Dashboard payment method domains / PMC as you use today)
- [ ] **Stripe Tax** — no domain rename required, but confirm origin address / registrations still match the legal entity
- [ ] Test a **live** card (and Apple Pay on iPhone Safari, Google Pay on Chrome) on the new domain

### Printful
- [ ] Store display name in Printful dashboard (packing slips / customer-facing if shown)
- [ ] `PRINTFUL_STORE_NAME` env default is still `wsbtees` in code — update env (or rename store) so store resolution stays correct
- [ ] Confirm API key / `PRINTFUL_STORE_ID` still point at the intended store
- [ ] Optional: update branding on packing slip / email templates in Printful
- [ ] Note: **printed artwork** with old mark (`STONKMUGS` on the design) will still ship on already-generated art until you change art code and re-render drops

### Apple Pay / Google Pay (domain-specific)
- [ ] Apple Pay: new domain verified in Stripe (above) — **old domain verification does not transfer**
- [ ] Google Pay: works via Stripe on the new HTTPS domain once domain is registered; re-test in Chrome after cutover
- [ ] `localhost` remains a special case (wallets often flaky locally regardless of brand)

### Contact / email
- [ ] Web3Forms is tied to your **inbox**, not the domain — no change required for delivery
- [ ] Optional: add `support@NEWdomain` (Cloudflare Email Routing → Gmail) and reply **from** that address so replies don’t show personal Gmail
- [ ] Update contact email subjects in `app/api/contact/route.ts` (currently `stonkmugs support`)
- [ ] If you ever switch to Resend: verify **new** sending domain, update `RESEND_FROM` / `SUPPORT_INBOX`

### Legal / trust pages
- [ ] `/privacy`, `/terms`, `/shipping`, `/returns`, `/about`, `/contact` — replace old brand + domain mentions
- [ ] Update any “operated by” / contact language to match the legal name you’ll use

### SEO / sharing
- [ ] `app/layout.tsx` metadata (`title`, `description`)
- [ ] Open Graph / social previews if you add them later
- [ ] Reddit / social bios and pinned post links
- [ ] Google Search Console (if used): add new property, set redirects from old domain

---

## B. Brand name change (code + product)

### App UI copy
- [ ] Header / home / about: `stonkmugs` (`app/layout.tsx`, `app/page.tsx`, `app/about/page.tsx`)
- [ ] Share sheets: `navigator.share({ title: 'stonkmugs', … })` in `app/create/page.tsx`, `app/order-success/page.tsx`
- [ ] Contact API subject lines: `app/api/contact/route.ts`
- [ ] Proxy user-agent string: `app/api/proxy-shirt/route.ts` (`stonkmugs/1.0`)
- [ ] Docs: `docs/product-notes.md`, `STRIPE_APPLE_PAY_SETUP.md`, `STAGING.md`, this file

### On-product art (easy to forget)
- [ ] Collectible mark `STONKMUGS` — `lib/drops.ts` (`dropCollectibleMark`) and hard-coded strings in `lib/slogan-design.ts`
- [ ] Re-render / revisit live drops after mark change (old mockups may still show old stamp)

### Order numbers
- [ ] Prefix `WSB-…` — `lib/order-number.ts`, `/orders` placeholder, lookup validation  
  Changing the prefix is optional; if you change it, old orders still use `WSB-` in Stripe metadata (lookup should accept both)

### Repo / project cosmetics (optional)
- [ ] npm `package.json` name (`trending-tshirt-app`)
- [ ] Vercel project name
- [ ] GitHub repo name
- [ ] Stripe Dashboard business public name (again — customer-facing)

---

## C. Quick smoke test after cutover

1. Homepage loads on new domain; old domain redirects  
2. Buy → ship → pay (card) succeeds; webhook fulfills Printful (or dry-run in staging)  
3. Apple Pay on iPhone Safari (production domain)  
4. Google Pay on Chrome (if you expect it)  
5. `/contact` form delivers to your inbox  
6. `/orders` lookup with a real order number + email  
7. Stripe receipt / bank descriptor looks right  

---

## D. What usually does *not* need a change

- Stripe **API keys** (same account can serve a new domain)
- Printful **catalog product/variant IDs**
- Web3Forms access key (same inbox)
- ImgBB / other asset keys (unless URLs are domain-locked, which they generally aren’t)
