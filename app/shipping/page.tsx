export default function ShippingPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 text-neutral-700">
      <h1 className="text-2xl font-semibold text-neutral-900">Shipping</h1>
      <p className="mt-3 text-sm text-neutral-500">Orders are made to order and fulfilled through Printful.</p>
      <div className="mt-6 space-y-4 text-sm">
        <p>
          <strong className="font-medium text-neutral-900">Processing:</strong> Most orders are produced within 2–5
          business days.
        </p>
        <p>
          <strong className="font-medium text-neutral-900">Delivery:</strong> US delivery usually takes 3–7 business
          days after production.
        </p>
        <p>
          <strong className="font-medium text-neutral-900">Tracking:</strong> Sent by email once your order ships.
        </p>
      </div>
    </main>
  )
}
