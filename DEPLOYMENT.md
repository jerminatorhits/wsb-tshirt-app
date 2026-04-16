# 🚀 Production Deployment Guide

This guide will walk you through deploying your Custom T-Shirt Generator to production.

## 📋 Pre-Deployment Checklist

### ✅ Code Readiness
- [x] Application is working locally
- [x] All features tested
- [x] Error handling in place
- [x] No console errors

### ✅ Environment Variables Required

You'll need to set these in your hosting platform:

#### **Required (Critical)**
1. **STRIPE_SECRET_KEY** - Your Stripe secret key (starts with `sk_live_` for production)
2. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** - Your Stripe publishable key (starts with `pk_live_` for production)
3. **STRIPE_WEBHOOK_SECRET** - Stripe webhook signing secret (get from Stripe dashboard)
4. **NEXT_PUBLIC_APP_URL** - Your production URL (e.g., `https://yourdomain.com`)

#### **Recommended (For Full Functionality)**
5. **POLLINATIONS_API_KEY** - For unlimited image generation (get from https://enter.pollinations.ai)
6. **PRINTFUL_API_KEY** - For order fulfillment and mockups (get from Printful dashboard)
7. **IMGBB_API_KEY** - For image hosting (optional, get from https://api.imgbb.com)

---

## 🎯 Step-by-Step Deployment

### Option 1: Deploy to Vercel (Recommended - Easiest)

Vercel is the creators of Next.js and offers the best integration.

#### Step 1: Prepare Your Code
```bash
# Make sure your code is committed to Git
git add .
git commit -m "Ready for production"
git push origin main
```

#### Step 2: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended) or email
3. Import your Git repository

#### Step 3: Configure Project
1. Click "Import Project"
2. Select your repository
3. Vercel will auto-detect Next.js settings
4. **Don't deploy yet** - we need to add environment variables first

#### Step 4: Add Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Add each variable:

```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
POLLINATIONS_API_KEY=your_key_here
PRINTFUL_API_KEY=your_key_here
IMGBB_API_KEY=your_key_here
```

3. Make sure to select **Production**, **Preview**, and **Development** environments
4. Click **Save**

#### Step 5: Deploy
1. Go to **Deployments** tab
2. Click **Redeploy** or push a new commit
3. Wait for build to complete (~2-3 minutes)
4. Your app will be live at `https://your-app.vercel.app`

#### Step 6: Configure Stripe Webhook
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Select events: `checkout.session.completed`
5. Copy the **Signing secret** and add it to Vercel as `STRIPE_WEBHOOK_SECRET`
6. Redeploy your app

---

### Option 2: Deploy to Netlify

#### Step 1: Prepare Code
Same as Vercel - commit and push to Git

#### Step 2: Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"

#### Step 3: Configure Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 18.x or higher

#### Step 4: Add Environment Variables
1. Go to **Site settings** → **Environment variables**
2. Add all required variables (same as Vercel)

#### Step 5: Deploy
1. Click **Deploy site**
2. Wait for build to complete
3. Configure Stripe webhook with your Netlify URL

---

### Option 3: Deploy to Railway

#### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

#### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository

#### Step 3: Configure
1. Railway auto-detects Next.js
2. Add environment variables in **Variables** tab
3. Deploy automatically starts

---

## 🔑 Getting Production API Keys

### Stripe Production Keys

1. **Switch to Live Mode**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Toggle from "Test mode" to "Live mode" (top right)

2. **Get Keys**:
   - Go to **Developers** → **API keys**
   - Copy **Publishable key** (`pk_live_...`)
   - Copy **Secret key** (`sk_live_...`)

3. **Create Webhook**:
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Select event: `checkout.session.completed`
   - Copy **Signing secret** (`whsec_...`)

⚠️ **Important**: Test thoroughly in test mode before switching to live mode!

### Pollinations.ai API Key

1. Go to [enter.pollinations.ai](https://enter.pollinations.ai)
2. Sign in with GitHub
3. Get your API key from the dashboard
4. Add to environment variables

### Printful API Key

1. Go to [Printful Dashboard](https://www.printful.com/dashboard)
2. Navigate to **Stores** → **API**
3. Generate a new API key
4. Copy and add to environment variables

### ImgBB API Key (Optional)

1. Go to [api.imgbb.com](https://api.imgbb.com)
2. Sign up for free account
3. Get your API key
4. Add to environment variables

---

## 🔒 Security Checklist

- [ ] All API keys are in environment variables (never in code)
- [ ] `.env` file is in `.gitignore` (should already be)
- [ ] Using production Stripe keys (not test keys)
- [ ] Webhook secret is configured correctly
- [ ] HTTPS is enabled (automatic on Vercel/Netlify)
- [ ] Domain is configured (optional but recommended)

---

## 🧪 Testing Production Deployment

### 1. Test Image Generation
- Enter custom text
- Generate a design
- Verify image appears correctly

### 2. Test Payment Flow
- Add item to cart
- Go through checkout
- Use Stripe test card: `4242 4242 4242 4242`
- Verify payment processes

### 3. Test Order Fulfillment
- Complete a test order
- Check Printful dashboard for order
- Verify webhook is receiving events

### 4. Test Error Handling
- Try generating without API key (should show error)
- Try invalid payment (should decline gracefully)

---

## 📊 Monitoring & Analytics

### Recommended Tools:
1. **Vercel Analytics** (if using Vercel) - Built-in
2. **Sentry** - Error tracking
3. **Google Analytics** - User analytics
4. **Stripe Dashboard** - Payment monitoring

---

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (needs 18+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Environment Variables Not Working
- Make sure they're set in hosting platform
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

### Stripe Webhook Not Working
- Verify webhook URL is correct
- Check webhook secret matches
- Look at Stripe dashboard → Webhooks → Recent events

### Images Not Loading
- Check `NEXT_PUBLIC_APP_URL` is set correctly
- Verify image upload API is working
- Check CORS settings if using external image hosting

---

## 🚀 Post-Deployment

### 1. Set Up Custom Domain (Optional)
- In Vercel: Settings → Domains → Add domain
- Update `NEXT_PUBLIC_APP_URL` to your custom domain
- Update Stripe webhook URL

### 2. Enable Monitoring
- Set up error tracking (Sentry recommended)
- Configure uptime monitoring
- Set up payment alerts in Stripe

### 3. Optimize Performance
- Enable Vercel Analytics
- Set up CDN caching
- Optimize images

### 4. Legal & Compliance
- Add Terms of Service
- Add Privacy Policy
- Add Refund Policy
- Configure GDPR compliance if needed

---

## 💰 Cost Estimates

### Hosting
- **Vercel**: Free tier (100GB bandwidth) or $20/month (Pro)
- **Netlify**: Free tier or $19/month (Pro)
- **Railway**: ~$5-20/month depending on usage

### API Costs
- **Pollinations.ai**: Free with API key (or ~$0.001 per image without)
- **Stripe**: 2.9% + $0.30 per transaction
- **Printful**: You pay per product when sold
- **ImgBB**: Free tier available

### Total Monthly Cost
- **Minimum**: ~$0-5/month (free tiers)
- **Recommended**: ~$20-50/month (with Pro hosting)

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Stripe Docs**: https://stripe.com/docs
- **Printful Docs**: https://www.printful.com/docs

---

## ✅ Final Checklist

Before going live:
- [ ] All environment variables configured
- [ ] Stripe webhook configured and tested
- [ ] Test payment completed successfully
- [ ] Order fulfillment tested
- [ ] Error handling verified
- [ ] Custom domain configured (if using)
- [ ] Analytics set up
- [ ] Legal pages added (Terms, Privacy)
- [ ] Monitoring configured

**You're ready to launch! 🎉**

