# Setting Up Apple Pay with Stripe

## Issue
Apple Pay is not showing because your domain `trending-tshirt-app.vercel.app` is not registered with Stripe.

## Steps to Register Domain

### 1. Enable Apple Pay in Stripe Dashboard

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Settings** → **Payment Methods**
3. Find **Apple Pay** in the list and click **Configure** or **Manage**

### 2. Add Your Domain

1. In the Apple Pay settings, click **Add new domain**
2. Enter your domain: `trending-tshirt-app.vercel.app`
   - **Important**: Use the exact domain from your Vercel deployment (without `https://` or trailing slashes)
3. Click **Save**

### 3. Download Verification File

1. After adding the domain, Stripe will provide a verification file
2. The file will be named something like: `.well-known/apple-developer-merchantid-domain-association`
3. **Download this file** - you'll need to upload it to your website

### 4. Upload Verification File to Your Website

The verification file needs to be accessible at:
```
https://trending-tshirt-app.vercel.app/.well-known/apple-developer-merchantid-domain-association
```

#### Option A: Using Vercel (Recommended)

1. Create the directory structure in your project:
   ```bash
   mkdir -p public/.well-known
   ```

2. Place the downloaded file in `public/.well-known/` directory
   - The file should be named exactly: `apple-developer-merchantid-domain-association`
   - **Important**: No file extension!

3. Commit and push to your repository:
   ```bash
   git add public/.well-known/apple-developer-merchantid-domain-association
   git commit -m "Add Stripe Apple Pay domain verification file"
   git push
   ```

4. Vercel will automatically deploy the file

#### Option B: Manual Upload via Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to the project settings
3. Use the file upload feature to add the verification file to the `.well-known` directory

### 5. Verify Domain in Stripe

1. After the file is deployed, go back to Stripe Dashboard
2. In the Apple Pay settings, find your domain
3. Click **Verify** next to your domain
4. Stripe will check if the file is accessible at the correct URL
5. Once verified, you should see a green checkmark ✅

### 6. Test Apple Pay

1. Refresh your website
2. Open the browser console and check for:
   - `ExpressCheckout: canMakePayment result` should show `applePay: true`
3. The Apple Pay button should now appear in the Express Checkout section

## Troubleshooting

### File Not Found (404)
- Make sure the file is in `public/.well-known/` directory
- Verify the file name is exactly: `apple-developer-merchantid-domain-association` (no extension)
- Check that the file is accessible at: `https://trending-tshirt-app.vercel.app/.well-known/apple-developer-merchantid-domain-association`

### Still Not Working After Verification
- Clear your browser cache
- Make sure you're using Safari (Apple Pay doesn't work in Chrome on macOS)
- Verify Apple Pay is enabled in your device settings (macOS/iOS)
- Check that you have at least one card added to Apple Wallet

### Multiple Domains
If you have multiple domains (e.g., custom domain + Vercel domain), you need to register each one separately in Stripe.

## Additional Notes

- **Test Mode**: Make sure you're using test mode keys for testing. Apple Pay works in test mode.
- **Production**: When you switch to production keys, you'll need to register your production domain as well.
- **Custom Domain**: If you add a custom domain later, register that domain separately in Stripe.

## Quick Checklist

- [ ] Apple Pay enabled in Stripe Dashboard → Settings → Payment Methods
- [ ] Domain added in Stripe Apple Pay settings
- [ ] Verification file downloaded from Stripe
- [ ] Verification file uploaded to `public/.well-known/` directory
- [ ] File accessible at correct URL
- [ ] Domain verified in Stripe Dashboard
- [ ] Testing in Safari browser
- [ ] Apple Pay enabled in device settings

