'use client'

import { FormEvent, useState } from 'react'

export default function DropNotifyForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not save your email.')
        setLoading(false)
        return
      }
      setSent(true)
      setLoading(false)
    } catch {
      setError('Could not save your email. Please try again.')
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-neutral-600">
        You&apos;re on the list. We&apos;ll email when a new drop goes live.
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? 'flex flex-col gap-2 sm:flex-row sm:items-center' : 'space-y-2'}
      noValidate
    >
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
        type="email"
        name="email"
        autoComplete="email"
        placeholder="Email for drop alerts"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={compact ? 'rh-input min-w-0 flex-1' : 'rh-input'}
      />
      <button
        type="submit"
        disabled={loading}
        className={
          compact
            ? 'shrink-0 rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-40'
            : 'rh-btn-primary'
        }
      >
        {loading ? '…' : 'Notify me'}
      </button>
      {error && (
        <p className="text-sm font-medium text-red-900 sm:col-span-2" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
