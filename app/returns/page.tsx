export default function ReturnsPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 text-neutral-700">
      <h1 className="text-2xl font-semibold text-neutral-900">Returns</h1>
      <p className="mt-3 text-sm text-neutral-500">
        Because each item is custom-made, returns are limited to damaged, defective, or incorrect items.
      </p>
      <div className="mt-6 space-y-4 text-sm">
        <p>
          <strong className="font-medium text-neutral-900">Report window:</strong> Contact us within 14 days of
          delivery.
        </p>
        <p>
          <strong className="font-medium text-neutral-900">Required:</strong> Order number, a short description, and
          photos of the issue.
        </p>
        <p>
          <strong className="font-medium text-neutral-900">Wrong size:</strong> We do not accept returns for size
          selection or buyer&apos;s remorse on custom items.
        </p>
      </div>
    </main>
  )
}
