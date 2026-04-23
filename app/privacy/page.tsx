export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 text-zinc-200">
      <h1 className="text-3xl font-bold text-zinc-100">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-sm text-zinc-300">
        <p>
          We collect only the information required to process and deliver your order, including contact details, shipping address, and payment status data.
        </p>
        <p>
          Card data is processed securely by Stripe and is not stored on our servers.
        </p>
        <p>
          Order fulfillment details are shared with Printful only for manufacturing and shipping your order.
        </p>
        <p>
          We do not sell personal data. We may retain order records for accounting, fraud prevention, and customer support.
        </p>
        <p>
          For data requests or questions, use the Contact page.
        </p>
      </div>
    </main>
  )
}
