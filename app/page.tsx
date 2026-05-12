'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    let normalized = url.trim()
    if (!normalized.startsWith('http')) normalized = `https://${normalized}`

    try { new URL(normalized) } catch {
      setError('Please enter a valid store URL.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      router.push(`/calculate/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyse URL. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-4 py-16"
      style={{ background: 'var(--shopify-surface)' }}>

      {/* Guarantee badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
        style={{ background: 'var(--shopify-green)', color: '#fff' }}>
        <span className="text-base">💯</span>
        <span className="text-sm font-semibold tracking-wide">We Guarantee It</span>
      </div>

      {/* Punchy headline */}
      <div className="text-center mb-4 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-5"
          style={{ color: 'var(--shopify-text)' }}>
          You are leaving money
          <br />
          <span style={{ color: 'var(--shopify-green)' }}>on the table.</span>
        </h1>
        <p className="text-lg mb-2" style={{ color: 'var(--shopify-text)', fontWeight: 500 }}>
          Every DTC brand does. Without exception.
        </p>
        <p className="text-base" style={{ color: 'var(--shopify-subdued)' }}>
          The question is how much — and where it's coming from.
          Enter your store URL, add a few numbers, and we'll show you exactly.
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-8 mt-4">
        {[
          { n: '1', label: 'Enter your store URL' },
          { n: '2', label: 'Add your numbers' },
          { n: '3', label: 'See what you\'re missing' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'var(--shopify-green)' }}>
                {s.n}
              </div>
              <span className="text-sm hidden sm:block" style={{ color: 'var(--shopify-subdued)' }}>{s.label}</span>
            </div>
            {i < 2 && <span className="text-xs" style={{ color: 'var(--shopify-border)' }}>→</span>}
          </div>
        ))}
      </div>

      {/* URL Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="rounded-2xl p-5 mb-3"
          style={{ background: 'var(--shopify-white)', border: '1.5px solid var(--shopify-border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--shopify-subdued)' }}>
            Step 1 — Your Shopify store URL
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                style={{ color: 'var(--shopify-subdued)' }}>
                https://
              </span>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="yourstore.com"
                className="w-full pl-16 pr-4 py-4 rounded-xl border text-base outline-none transition-all font-medium"
                style={{
                  background: 'var(--shopify-surface)',
                  border: '1.5px solid var(--shopify-border)',
                  color: 'var(--shopify-text)',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--shopify-green)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--shopify-border)'}
                disabled={loading}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-4 rounded-xl font-bold text-white text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
              style={{ background: 'var(--shopify-green)', minWidth: 160 }}
            >
              {loading ? <><Spinner /> Analysing...</> : 'Show Me →'}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-sm" style={{ color: '#D72C0D' }}>{error}</p>
          )}

          {loading && (
            <div className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: 'var(--shopify-border)' }}>
              <LoadingStep text="Fetching traffic data..." delay={0} />
              <LoadingStep text="Scraping bestsellers for AOV..." delay={800} />
              <LoadingStep text="Detecting industry benchmarks..." delay={1600} />
              <LoadingStep text="Calculating your opportunity..." delay={2400} />
            </div>
          )}
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--shopify-subdued)' }}>
          Works with any Shopify store · No login required · Takes ~10 seconds
        </p>
      </form>

      {/* Stats */}
      <div className="mt-14 grid grid-cols-3 gap-6 text-center max-w-lg">
        {[
          { stat: '₹2.3L+', label: 'Avg. monthly opportunity found' },
          { stat: '4,700+', label: 'Avg. dormant customers uncovered' },
          { stat: '100%', label: 'Of brands we\'ve audited had a gap' },
        ].map((item) => (
          <div key={item.stat} className="rounded-xl p-4"
            style={{ background: 'var(--shopify-white)', border: '1px solid var(--shopify-border)' }}>
            <div className="text-2xl font-black mb-1" style={{ color: 'var(--shopify-green)' }}>{item.stat}</div>
            <div className="text-xs leading-snug" style={{ color: 'var(--shopify-subdued)' }}>{item.label}</div>
          </div>
        ))}
      </div>

    </main>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function LoadingStep({ text, delay }: { text: string; delay: number }) {
  const [visible, setVisible] = useState(false)
  useState(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  })
  if (!visible) return null
  return (
    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--shopify-subdued)' }}>
      <span style={{ color: 'var(--shopify-green)' }}>✓</span> {text}
    </div>
  )
}
