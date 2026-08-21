export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@wsbshirtlab.com'
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 text-neutral-700">
      <h1 className="text-2xl font-semibold text-neutral-900">Contact</h1>
      <p className="mt-3 text-sm">Need help with an order? Include your order number when you can.</p>
      <div className="mt-6 space-y-3 text-sm">
        <p>
          <strong className="font-medium text-neutral-900">Email:</strong> {supportEmail}
        </p>
        <p>
          <strong className="font-medium text-neutral-900">Response time:</strong> Usually within 1–2 business days.
        </p>
      </div>
    </main>
  )
}
