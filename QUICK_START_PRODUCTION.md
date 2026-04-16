# 🚀 Quick Start: Deploy to Production

## TL;DR - Fastest Path to Production

### 1. Get Your API Keys (15 minutes)

**Stripe** (Required for payments):
1. Go to [stripe.com](https://stripe.com) → Sign up
2. Get keys from Dashboard → Developers → API keys
3. Create webhook: Dashboard → Webhooks → Add endpoint
   - URL: `https://your-app.vercel.app/api/webhooks/stripe`
   - Event: `checkout.session.completed`
   - Copy the signing secret

**Pollinations.ai** (Recommended - for image generation):
1. Go to [enter.pollinations.ai](https://enter.pollinations.ai)
2. Sign in with GitHub
3. Copy your API key

**Printful** (Required for order fulfillment):
1. Go to [printful.com](https://www.printful.com) → Sign up
2. Dashboard → Stores → API → Generate key

### 2. Deploy to Vercel (5 minutes)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
3. Import your repository
4. Add environment variables:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   POLLINATIONS_API_KEY=...
   PRINTFUL_API_KEY=...
   ```
5. Deploy!

### 3. Configure Stripe Webhook (2 minutes)

1. In Stripe Dashboard → Webhooks
2. Update webhook URL to your Vercel URL
3. Copy signing secret to Vercel environment variables
4. Redeploy

**Done! Your app is live! 🎉**

---

## Required Environment Variables

| Variable | Where to Get It | Required? |
|----------|----------------|-----------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys | ✅ Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API Keys | ✅ Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks | ✅ Yes |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL | ✅ Yes |
| `POLLINATIONS_API_KEY` | enter.pollinations.ai | ⚠️ Recommended |
| `PRINTFUL_API_KEY` | Printful Dashboard | ⚠️ Recommended |
| `IMGBB_API_KEY` | api.imgbb.com | ❌ Optional |

---

## Testing Your Deployment

1. **Test Image Generation**:
   - Enter text like "Space exploration"
   - Click "Generate T-Shirt Design"
   - Should see AI-generated image

2. **Test Payment** (Use test mode first!):
   - Add item to cart
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout
   - Verify order appears in Printful

3. **Test Webhook**:
   - Complete a test order
   - Check Stripe Dashboard → Webhooks → Recent events
   - Should see `checkout.session.completed` event

---

## ⚠️ Important Notes

1. **Start in Test Mode**: Use Stripe test keys first (`sk_test_`, `pk_test_`)
2. **Switch to Live Mode**: Only after thorough testing
3. **Never Commit API Keys**: Always use environment variables
4. **Monitor Costs**: Track API usage, especially image generation

---

## Need More Details?

- **Full deployment guide**: See `DEPLOYMENT.md`
- **Step-by-step checklist**: See `PRODUCTION_CHECKLIST.md`
- **Stripe setup**: See `GET_STRIPE_KEYS.md`
- **API setup**: See `API_KEYS_SETUP.md`

---

## Common Issues

**Build fails?**
- Check Node.js version (needs 18+)
- Verify all dependencies in `package.json`

**Environment variables not working?**
- Check variable names match exactly
- Redeploy after adding variables

**Webhook not working?**
- Verify webhook URL is correct
- Check webhook secret matches
- Look at Stripe dashboard for events

---

**Ready to deploy? Follow the steps above and you'll be live in ~20 minutes! 🚀**

