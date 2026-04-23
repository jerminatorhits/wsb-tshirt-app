# Manual Refund Procedure

Use this when a customer requests a refund or when fulfillment fails after charge.

## 1) Gather Required Info

- Payment Intent ID (preferred) or order confirmation details
- Customer email used at checkout
- Reason for refund (defect, duplicate charge, cancellation, etc.)

## 2) Verify Order State

1. Check payment status in Stripe (`succeeded`, amount, charge ID).
2. Check fulfillment status:
   - If `printfulOrderId` exists, determine whether order is already in production/shipped.
3. Review support conversation and any evidence (photos for defects).

## 3) Decide Refund Type

- **Full refund**: severe defect, cancellation before production, duplicate charge.
- **Partial refund**: agreed adjustment.
- **No refund**: outside policy or custom order already fulfilled without defect.

## 4) Execute in Stripe

1. Open the payment in Stripe Dashboard.
2. Click **Refund** and choose amount.
3. Add internal note with reason and support ticket reference.

## 5) Customer Communication

Send confirmation including:

- refunded amount
- expected timeline for funds to appear (typically 5-10 business days)
- any next steps (replacement, re-order link, etc.)

## 6) Recordkeeping

- Update support ticket with final outcome.
- Track recurring causes (e.g., bad address, print defect, size confusion) for prevention.

