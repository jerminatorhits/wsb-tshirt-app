import ContactForm from '@/components/ContactForm'

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 text-neutral-700">
      <h1 className="text-2xl font-semibold text-neutral-900">Contact</h1>
      <p className="mt-3 text-sm">
        Need help with an order? Include your order number when you can. Your message goes to us
        privately — no public email on the site.
      </p>
      <div className="mt-6">
        <ContactForm />
      </div>
    </main>
  )
}
