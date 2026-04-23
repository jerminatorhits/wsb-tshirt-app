export default function ShippingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 text-zinc-200">
      <h1 className="text-3xl font-bold text-zinc-100">Shipping Policy</h1>
      <p className="mt-4 text-sm text-zinc-400">
        Orders are made to order and fulfilled through Printful.
      </p>
      <div className="mt-6 space-y-4 text-sm text-zinc-300">
        <p>
          <strong>Processing time:</strong> Most orders are produced within 2-5 business days.
        </p>
        <p>
          <strong>Delivery time:</strong> US delivery usually takes 3-7 business days after production. International delivery times vary by destination.
        </p>
        <p>
          <strong>Tracking:</strong> Tracking details are sent by email once your order ships.
        </p>
        <p>
          <strong>Address accuracy:</strong> Please confirm your shipping information at checkout. We cannot guarantee delivery for incorrect or incomplete addresses.
        </p>
      </div>
    </main>
  )
}
