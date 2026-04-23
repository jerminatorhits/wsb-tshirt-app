export default function ReturnsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 text-zinc-200">
      <h1 className="text-3xl font-bold text-zinc-100">Returns & Refunds</h1>
      <p className="mt-4 text-sm text-zinc-400">
        Because each shirt is custom-made, returns are limited to damaged, defective, or incorrect items.
      </p>
      <div className="mt-6 space-y-4 text-sm text-zinc-300">
        <p>
          <strong>Report window:</strong> Contact us within 14 days of delivery for any issue.
        </p>
        <p>
          <strong>Required details:</strong> Include your order number, a short description, and photos showing the issue.
        </p>
        <p>
          <strong>Resolution:</strong> Approved claims are typically resolved with a replacement or refund.
        </p>
        <p>
          <strong>Non-returnable:</strong> We do not accept returns for wrong size selection or buyer&apos;s remorse on custom items.
        </p>
      </div>
    </main>
  )
}
