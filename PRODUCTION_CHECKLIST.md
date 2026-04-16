# ✅ Production Deployment Checklist

Use this checklist to ensure everything is ready for production.

## 🔑 Environment Variables

Add these to your hosting platform (Vercel, Netlify, etc.):

### Required
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_live_` in production)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_live_` in production)
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (starts with `whsec_`)
- [ ] `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://yourdomain.com`)

### Recommended
- [ ] `POLLINATIONS_API_KEY` - For unlimited image generation
- [ ] `PRINTFUL_API_KEY` - For order fulfillment
- [ ] `IMGBB_API_KEY` - For image hosting (optional)

---

## 🚀 Deployment Steps

### 1. Code Preparation
- [ ] Code is committed to Git
- [ ] All changes pushed to repository
- [ ] No console errors or warnings
- [ ] `.env` file is in `.gitignore` (never commit API keys!)

### 2. Hosting Setup
- [ ] Account created on hosting platform (Vercel/Netlify/Railway)
- [ ] Repository connected
- [ ] Build settings configured correctly

### 3. Environment Variables
- [ ] All required variables added to hosting platform
- [ ] Variables set for Production, Preview, and Development environments
- [ ] Variable names match exactly (case-sensitive)

### 4. Stripe Configuration
- [ ] Stripe account switched to Live mode
- [ ] Production API keys obtained
- [ ] Webhook endpoint created
- [ ] Webhook secret added to environment variables
- [ ] Webhook events configured: `checkout.session.completed`

### 5. Deployment
- [ ] Initial deployment completed
- [ ] Build succeeded without errors
- [ ] Application is accessible at production URL

### 6. Post-Deployment Testing
- [ ] Image generation works
- [ ] Payment flow works (use test card: `4242 4242 4242 4242`)
- [ ] Order fulfillment works
- [ ] Webhook receives events (check Stripe dashboard)
- [ ] Error messages display correctly

### 7. Security & Compliance
- [ ] HTTPS enabled (automatic on most platforms)
- [ ] Terms of Service page added
- [ ] Privacy Policy page added
- [ ] Refund Policy page added (if applicable)

### 8. Monitoring
- [ ] Error tracking set up (Sentry recommended)
- [ ] Analytics configured (Google Analytics or Vercel Analytics)
- [ ] Uptime monitoring enabled
- [ ] Payment alerts configured in Stripe

---

## 🧪 Testing Checklist

### Functionality Tests
- [ ] User can enter custom text
- [ ] Design generates successfully
- [ ] T-shirt preview displays correctly
- [ ] Color selection works
- [ ] Size selection works
- [ ] Quantity selection works
- [ ] Price calculation is correct
- [ ] Checkout form works
- [ ] Payment processing works
- [ ] Order confirmation displays
- [ ] Order appears in Printful dashboard

### Error Handling Tests
- [ ] Rate limit errors display correctly
- [ ] API errors show user-friendly messages
- [ ] Payment failures handled gracefully
- [ ] Network errors handled properly

### Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works on mobile devices

---

## 📝 Quick Commands

### Build Locally (Test Before Deploying)
```bash
npm run build
npm start
```

### Check for Issues
```bash
npm run lint
npm run build
```

### Environment Variable Template
```bash
# Copy this and fill in your values
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
POLLINATIONS_API_KEY=...
PRINTFUL_API_KEY=...
IMGBB_API_KEY=...
```

---

## 🆘 Common Issues

### Build Fails
- Check Node.js version (needs 18+)
- Verify all dependencies installed
- Check build logs for specific errors

### Environment Variables Not Working
- Verify variables are set in hosting platform
- Check variable names match exactly
- Redeploy after adding variables

### Stripe Webhook Not Working
- Verify webhook URL is correct
- Check webhook secret matches
- Look at Stripe dashboard for webhook events

### Images Not Loading
- Check `NEXT_PUBLIC_APP_URL` is set correctly
- Verify image upload API is working
- Check CORS settings

---

## 📞 Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Review hosting platform documentation
- Check Stripe dashboard for webhook events
- Review application logs in hosting platform

---

**Once all items are checked, you're ready for production! 🎉**

