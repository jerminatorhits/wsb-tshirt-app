# Rollback Plan

Use this if production checkout or fulfillment regressions are detected.

## Trigger Conditions

- Sustained payment failures (`payment_intent.create.failed`)
- Webhook signature failures after deploy
- Fulfillment failures spike (`fulfill_order.failed` / webhook fulfill failures)
- Customer-impacting checkout outage

## Immediate Actions (0-10 min)

1. Pause traffic sources if possible (ads/campaign links).
2. Announce incident in internal channel.
3. Identify last known good deployment.

## Rollback Steps

1. Re-deploy previous stable build.
2. Validate:
   - checkout page loads
   - payment intent creation works
   - webhook endpoint responds 2xx for test events
3. Monitor logs for 15-30 minutes.

## Data Safety Checks

- Confirm no duplicate fulfillment triggered during incident.
- Review payment intents created during incident window.
- If needed, manually reconcile affected orders/refunds.

## Post-Rollback Follow-Up

1. Create incident summary:
   - timeline
   - root cause
   - customer impact
   - remediation
2. Add preventive action item(s) to backlog.

