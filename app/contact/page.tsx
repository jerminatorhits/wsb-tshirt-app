export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@wsbshirtlab.com'
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 text-zinc-200">
      <h1 className="text-3xl font-bold text-zinc-100">Contact</h1>
      <p className="mt-4 text-sm text-zinc-300">
        Need help with an order? Reach out and include your order number when possible.
      </p>
      <div className="mt-6 space-y-3 text-sm text-zinc-300">
        <p>
          <strong>Email:</strong> {supportEmail}
        </p>
        <p>
          <strong>Response time:</strong> Usually within 1-2 business days.
        </p>
        <p>
          <strong>For faster help:</strong> Include your payment intent or order ID, shipping email, and a brief description of the issue.
        </p>
      </div>
    </main>
  )
}
