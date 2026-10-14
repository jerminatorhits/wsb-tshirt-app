'use client'

import { FormEvent, useState } from 'react'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('') // honeypot
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, orderNumber, message, company }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not send message.')
        setLoading(false)
        return
      }
      setSent(true)
      setLoading(false)
    } catch {
      setError('Could not send message. Please try again.')
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-5">
        <p className="text-sm font-medium text-neutral-900">Message sent.</p>
        <p className="mt-1 text-sm text-neutral-600">
          We usually reply within 1–2 business days.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {/* Honeypot — hidden from users */}
      <input
        type="text"
        name="company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden
      />
      <input
        type="text"
        name="name"
        autoComplete="name"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="rh-input"
      />
      <input
        type="email"
        name="email"
        autoComplete="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="rh-input"
      />
      <input
        type="text"
        name="orderNumber"
        autoComplete="off"
        placeholder="Order number (optional)"
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        className="rh-input"
      />
      <textarea
        name="message"
        placeholder="How can we help?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        rows={5}
        className="rh-input min-h-[120px] resize-y py-2.5"
      />
      {error && (
        <p className="text-sm font-medium text-red-900" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className="rh-btn-primary">
        {loading ? 'Sending…' : 'Send message'}
      </button>
      <p className="text-xs text-neutral-400">Usually replies within 1–2 business days.</p>
    </form>
  )
}
