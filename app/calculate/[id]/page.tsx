'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { calculate, CalcResults, CalcInputs, formatCurrency, formatRange } from '@/lib/calculations'

interface Prefill {
  monthlyTraffic: number
  conversionRate: number
  aov: number
  existingBase: number
  repeatRate: number
}

interface EnrichData {
  id: string
  brandUrl: string
  brandName: string | null
  industry: string
  industryRepeatRate: number
  topProducts: { title: string; price: number }[]
  prefill: Prefill
  results: CalcResults
  trafficSource: string
  aovSource: string
}

type Step = 'inputs' | 'whatsapp' | 'results'

function brandNameFromUrl(url: string): string {
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
    const domain = host.replace(/^www\./, '').split('.')[0]
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  } catch {
    return 'Your Store'
  }
}

export default function CalculatorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<EnrichData | null>(null)
  const [inputs, setInputs] = useState<Prefill | null>(null)
  const [results, setResults] = useState<CalcResults | null>(null)
  const [step, setStep] = useState<Step>('inputs')
  const [leadId, setLeadId] = useState<string | null>(null)
  const [capturedWhatsApp, setCapturedWhatsApp] = useState<string>('')

  useEffect(() => {
    fetch(`/api/submission/${id}`)
      .then((r) => r.json())
      .then((d: EnrichData) => {
        setData(d)
        setInputs(d.prefill)
        setResults(d.results)
      })
      .catch(() => router.push('/'))
  }, [id, router])

  function updateField<K extends keyof Prefill>(key: K, raw: string) {
    if (!inputs) return
    let val = parseFloat(raw)
    if (isNaN(val)) return
    if (key === 'conversionRate') val = val / 100
    if (key === 'repeatRate') val = val / 100
    const next = { ...inputs, [key]: val }
    setInputs(next)
    setResults(calculate(next))
  }

  if (!data || !inputs || !results) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--shopify-surface)' }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--shopify-green)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--shopify-subdued)' }}>Analysing your store...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--shopify-surface)' }}>
      {step === 'inputs' && (
        <InputsStep
          data={data}
          inputs={inputs}
          results={results}
          onUpdate={updateField}
          onNext={() => setStep('whatsapp')}
        />
      )}
      {step === 'whatsapp' && (
        <WhatsAppStep
          submissionId={id}
          inputs={inputs}
          brandName={data.brandName ?? brandNameFromUrl(data.brandUrl)}
          totalLow={results.totalLow}
          totalHigh={results.totalHigh}
          onBack={() => setStep('inputs')}
          onSuccess={(lId, wa) => {
            setLeadId(lId)
            setCapturedWhatsApp(wa)
            setStep('results')
          }}
        />
      )}
      {step === 'results' && leadId && (
        <ResultsStep
          data={data}
          inputs={inputs}
          results={results}
          leadId={leadId}
          onBack={() => setStep('inputs')}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 1: INPUTS
// ─────────────────────────────────────────────
function InputsStep({
  data, inputs, results, onUpdate, onNext,
}: {
  data: EnrichData
  inputs: Prefill
  results: CalcResults
  onUpdate: (key: keyof Prefill, val: string) => void
  onNext: () => void
}) {
  const isReady = inputs.existingBase > 0 && inputs.repeatRate > 0

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--shopify-green)' }}>
          STEP 1 OF 2 · STORE METRICS
        </p>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--shopify-text)' }}>
          Tell us about {data.brandName ?? brandNameFromUrl(data.brandUrl)}
        </h1>
        <p className="text-sm" style={{ color: 'var(--shopify-subdued)' }}>
          Fill in your numbers below. We'll calculate exactly what you're leaving on the table.
        </p>
      </div>

      <div className="rounded-2xl p-6 space-y-6" style={{ background: 'var(--shopify-white)', border: '1px solid var(--shopify-border)' }}>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--shopify-subdued)' }}>
            Auto-detected from your store
          </p>
          <div className="space-y-4">
            <Field
              label="Monthly Traffic"
              value={inputs.monthlyTraffic}
              onChange={(v) => onUpdate('monthlyTraffic', v)}
              suffix="sessions"
              badge={data.trafficSource === 'hooly' ? '✓ detected' : 'estimated — edit for actuals'}
              badgeStyle={data.trafficSource === 'hooly' ? 'green' : 'gray'}
            />
            <Field
              label="Conversion Rate"
              value={+(inputs.conversionRate * 100).toFixed(2)}
              onChange={(v) => onUpdate('conversionRate', v)}
              suffix="%"
              hint="Industry average is 1.5–2.5%"
            />
            <Field
              label="Average Order Value"
              value={inputs.aov}
              onChange={(v) => onUpdate('aov', v)}
              prefix="₹"
              badge={data.aovSource === 'scraped' ? '✓ from bestsellers' : 'estimated — edit for actuals'}
              badgeStyle={data.aovSource === 'scraped' ? 'green' : 'gray'}
            />
          </div>
        </div>

        <div style={{ borderTop: '1px dashed var(--shopify-border)', paddingTop: 20 }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--shopify-text)' }}>
            You know these — enter your actual numbers
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--shopify-subdued)' }}>
            These are not something we can detect. Ballpark is fine — even rough numbers give you a directionally accurate picture.
          </p>
          <div className="space-y-4">
            <Field
              label="Existing Customer Base"
              value={inputs.existingBase}
              onChange={(v) => onUpdate('existingBase', v)}
              suffix="customers"
              hint="Total unique customers who've placed at least one order"
              highlight
              placeholder="e.g. 5000"
            />
            <Field
              label="Monthly Repeat Rate"
              value={+(inputs.repeatRate * 100).toFixed(1)}
              onChange={(v) => onUpdate('repeatRate', v)}
              suffix="%"
              hint="Of your monthly orders, what % come from returning customers (not first-time buyers)?"
              badge={`${data.industry} avg: ${(data.industryRepeatRate * 100).toFixed(0)}%`}
              badgeStyle="green"
              highlight
              placeholder="e.g. 18"
            />
          </div>
        </div>

        <button
          onClick={onNext}
          disabled={!isReady}
          className="w-full py-4 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-40"
          style={{ background: 'var(--shopify-green)' }}
        >
          Calculate My Opportunity →
        </button>
        <p className="text-xs text-center" style={{ color: 'var(--shopify-subdued)' }}>
          Takes 5 seconds · Free · No card required
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 2: WHATSAPP GATE
// ─────────────────────────────────────────────
function WhatsAppStep({
  submissionId, inputs, brandName, totalLow, totalHigh, onSuccess, onBack,
}: {
  submissionId: string
  inputs: Prefill
  brandName: string
  totalLow: number
  totalHigh: number
  onSuccess: (leadId: string, whatsapp: string) => void
  onBack: () => void
}) {
  const [whatsapp, setWhatsApp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, whatsapp, ...inputs }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      onSuccess(data.leadId, whatsapp)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--shopify-surface)' }}>
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm mb-8 transition-opacity hover:opacity-70"
          style={{ color: 'var(--shopify-subdued)' }}
        >
          ← Edit my numbers
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'var(--shopify-green-light)', color: 'var(--shopify-green)' }}>
            <span className="text-lg">🔍</span>
            <span className="text-sm font-semibold">We found something significant</span>
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--shopify-text)' }}>
            {brandName} has a real opportunity hiding in plain sight
          </h1>
          <p className="text-base" style={{ color: 'var(--shopify-subdued)' }}>
            Enter your WhatsApp number and we'll send your full report directly — broken down by where the money is hiding and exactly how to fix it.
          </p>
        </div>

        {/* Blurred preview */}
        <div className="rounded-2xl p-5 mb-6 relative overflow-hidden" style={{ background: 'var(--shopify-white)', border: '1px solid var(--shopify-border)' }}>
          <div className="blur-sm select-none pointer-events-none">
            <p className="text-xs mb-1" style={{ color: 'var(--shopify-subdued)' }}>Monthly opportunity</p>
            <p className="text-4xl font-black" style={{ color: 'var(--shopify-green)' }}>₹X,XX,XXX – ₹X,XX,XXX</p>
            <p className="text-xs mt-1" style={{ color: 'var(--shopify-subdued)' }}>per month, every month</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(246,246,247,0.7)', backdropFilter: 'blur(2px)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--shopify-text)' }}>🔒 Unlock your results below</p>
          </div>
        </div>

        {/* WhatsApp form */}
        <form onSubmit={submit} className="rounded-2xl p-6" style={{ background: 'var(--shopify-white)', border: '1px solid var(--shopify-border)' }}>
          <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--shopify-text)' }}>
            Your WhatsApp number
          </label>
          <p className="text-xs mb-3" style={{ color: 'var(--shopify-subdued)' }}>
            We'll send your full report on WhatsApp. Include country code — e.g. +91 98765 43210
          </p>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsApp(e.target.value)}
            placeholder="+91 98765 43210"
            required
            autoFocus
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-3 transition-all"
            style={{ borderColor: 'var(--shopify-border)', color: 'var(--shopify-text)' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--shopify-green)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--shopify-border)'}
          />
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading || !whatsapp.trim()}
            className="w-full py-4 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-60"
            style={{ background: 'var(--shopify-green)' }}
          >
            {loading ? 'Calculating...' : 'Send My Report on WhatsApp →'}
          </button>
          <p className="text-xs text-center mt-3" style={{ color: 'var(--shopify-subdued)' }}>
            No spam, ever. Just your numbers.
          </p>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 3: RESULTS
// ─────────────────────────────────────────────
function ResultsStep({
  data, inputs, results, onBack,
}: {
  data: EnrichData
  inputs: Prefill
  results: CalcResults
  leadId: string
  onBack: () => void
}) {
  const brandName = data.brandName ?? 'Your Store'

  // Sort opportunity cards highest → lowest by opp high value
  const opportunities = [
    {
      id: 'opp1',
      icon: '🔄',
      title: 'Retain new customers better',
      punchline: `${results.monthlyNewCustomers.toLocaleString('en-IN')} people bought from you this month for the first time. Most won't come back.`,
      low: results.opp1Low,
      high: results.opp1High,
      calcLine: `${results.monthlyNewCustomers.toLocaleString('en-IN')} new customers × 5–10% better retention × ${formatCurrency(inputs.aov)} AOV`,
      howBody: `Most brands already send an order confirmation — and some send a follow-up or two. That's a good start. What we add on top is a structured, data-driven sequence built specifically around your product and purchase behaviour: the right message, to the right customer, at the right time. Brands doing the basics typically see 5% more repeat buyers. With the right sequencing layered on top, that number moves to 10%. This is purely additive to whatever you're already doing.`,
    },
    {
      id: 'opp2',
      icon: '💤',
      title: 'Revive your customer base',
      punchline: `${inputs.existingBase.toLocaleString('en-IN')} customers in your base have gone quiet. Here's what they're worth.`,
      low: results.opp2Low,
      high: results.opp2High,
      calcLine: `${inputs.existingBase.toLocaleString('en-IN')} customers × ${((inputs.conversionRate * 0.25) * 100).toFixed(2)}–${((inputs.conversionRate * 0.5) * 100).toFixed(2)}% re-engagement × ${formatCurrency(inputs.aov)} AOV`,
      howBody: `You're likely already running some win-back activity — a discount email here, a reminder there. That's not wasted effort. What we layer on top is timing and targeting precision: knowing which customers in your base are most likely to respond right now, and hitting them with the right message at that moment. Most brands recover 0.5% of their base with broad win-back blasts. With better targeting built on purchase history and behaviour, that number reliably doubles. Same audience, better results — on top of what you're already doing.`,
    },
    {
      id: 'opp3',
      icon: '🛒',
      title: 'Convert the ones who almost bought',
      punchline: `Every month, ${results.monthlyAbandoners.toLocaleString('en-IN')} visitors left without buying. Some of them were close.`,
      low: results.opp3Low,
      high: results.opp3High,
      calcLine: `${results.monthlyAbandoners.toLocaleString('en-IN')} visitors × ${((inputs.conversionRate * 0.25) * 100).toFixed(2)}–${((inputs.conversionRate * 0.5) * 100).toFixed(2)}% recovery × ${formatCurrency(inputs.aov)} AOV`,
      howBody: `If you're running abandoned cart emails or retargeting ads, you're already recovering some of these. Good. What we add is a faster, cheaper, higher-converting layer on top — typically WhatsApp or SMS, which gets opened within minutes versus hours for email. We also go beyond just cart abandoners: people who browsed but never added to cart, or visited a product page multiple times. The combined effect on top of your existing recovery activity is what moves the needle from your current conversion rate to half of it again — on traffic you've already paid for.`,
    },
  ]
    .sort((a, b) => b.high - a.high)
    .map((opp, i) => ({ ...opp, num: String(i + 1).padStart(2, '0') }))

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
        style={{ color: 'var(--shopify-subdued)' }}
      >
        ← Edit my numbers
      </button>

      {/* Hero reveal */}
      {(() => {
        const pctLow = Math.round((results.totalLow / results.monthlyTotalRevenue) * 100)
        const pctHigh = Math.round((results.totalHigh / results.monthlyTotalRevenue) * 100)
        return (
          <div className="rounded-2xl p-8 text-center text-white animate-fade-in"
            style={{ background: 'var(--shopify-green)' }}>
            <p className="text-sm opacity-75 mb-2 uppercase tracking-wider">Monthly opportunity for {brandName}</p>
            <p className="text-5xl font-black mb-3">{formatRange(results.totalLow, results.totalHigh)}</p>
            <div className="inline-block rounded-xl px-5 py-2 mb-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <p className="text-2xl font-black">You're leaving {pctLow}–{pctHigh}% of your monthly revenue on the table</p>
            </div>
            <p className="opacity-70 text-sm">every single month — without touching your ad spend</p>
          </div>
        )
      })()}

      {/* What we find */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--shopify-white)', border: '1px solid var(--shopify-border)' }}>
        <div className="px-6 pt-5 pb-3">
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--shopify-text)' }}>What we find from your store</h2>
          <p className="text-xs" style={{ color: 'var(--shopify-subdued)' }}>
            Calculated from your numbers — scroll below to see where you've left money on the table ↓
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--shopify-border)' }}>
          {[
            {
              label: 'Monthly Total Revenue',
              value: formatCurrency(results.monthlyTotalRevenue),
              calc: `${inputs.monthlyTraffic.toLocaleString('en-IN')} sessions × ${(inputs.conversionRate * 100).toFixed(1)}% conversion × ${formatCurrency(inputs.aov)} AOV`,
            },
            {
              label: 'Monthly Repeat Revenue',
              value: formatCurrency(results.monthlyRepeatRevenue),
              calc: `${formatCurrency(results.monthlyTotalRevenue)} × ${(inputs.repeatRate * 100).toFixed(0)}% repeat rate`,
            },
            {
              label: 'Monthly New Revenue',
              value: formatCurrency(results.monthlyNewRevenue),
              calc: `${formatCurrency(results.monthlyTotalRevenue)} − ${formatCurrency(results.monthlyRepeatRevenue)} repeat revenue`,
            },
          ].map((row) => (
            <div key={row.label} className="px-6 py-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium" style={{ color: 'var(--shopify-text)' }}>{row.label}</span>
                <span className="text-xl font-black" style={{ color: 'var(--shopify-text)' }}>{row.value}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--shopify-subdued)' }}>{row.calc}</p>
            </div>
          ))}
        </div>

        {/* Pie chart */}
        <RevenuePieChart
          newRevenue={results.monthlyNewRevenue}
          repeatRevenue={results.monthlyRepeatRevenue}
        />
      </div>

      {/* Opportunity cards — sorted by value */}
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--shopify-text)' }}>The 3 places the money is hiding</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--shopify-subdued)' }}>Sorted by opportunity size. Each one is fixable.</p>
      </div>

      {opportunities.map((opp, index) => (
        <OpportunityCard
          key={opp.id}
          num={opp.num}
          icon={opp.icon}
          title={opp.title}
          punchline={opp.punchline}
          range={formatRange(opp.low, opp.high)}
          calcLine={opp.calcLine}
          howBody={opp.howBody}
          highlight={index === 0}
        />
      ))}

      {/* Total + CTA */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid var(--shopify-green)' }}>
        <div className="p-8 text-center" style={{ background: 'var(--shopify-green)' }}>
          <p className="text-sm opacity-75 mb-1 uppercase tracking-wider">Combined monthly opportunity</p>
          <p className="text-5xl font-black text-white mb-2">{formatRange(results.totalLow, results.totalHigh)}</p>
          <p className="text-white opacity-80 text-sm">per month, compounding — without spending more on ads</p>
        </div>
        <div className="p-8" style={{ background: 'var(--shopify-white)' }}>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--shopify-green-light)' }}>
              <span className="text-xl">💬</span>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--shopify-text)' }}>
              We'll walk you through how to recover this
            </h3>
            <p className="text-sm mb-5 max-w-sm mx-auto" style={{ color: 'var(--shopify-subdued)' }}>
              Your report is on its way to your WhatsApp. We'll reach out to discuss what's fixable first,
              what it takes, and what a realistic 90-day recovery looks like for {brandName}.
            </p>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              {[
                '✓ No obligation',
                '✓ No generic pitch',
                '✓ Just your numbers and what to do with them',
              ].map((item) => (
                <p key={item} className="text-sm font-medium" style={{ color: 'var(--shopify-green)' }}>{item}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// REVENUE PIE CHART
// ─────────────────────────────────────────────
function RevenuePieChart({ newRevenue, repeatRevenue }: { newRevenue: number; repeatRevenue: number }) {
  const total = newRevenue + repeatRevenue
  const repeatPct = Math.round((repeatRevenue / total) * 100)
  const newPct = 100 - repeatPct

  return (
    <div className="px-6 py-5" style={{ borderTop: '1px solid var(--shopify-border)' }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--shopify-subdued)' }}>
        Revenue split
      </p>
      <div className="flex items-center gap-8">
        <div
          className="flex-shrink-0 w-28 h-28 rounded-full"
          style={{
            background: `conic-gradient(var(--shopify-green) 0% ${repeatPct}%, #d1f0e8 ${repeatPct}% 100%)`,
          }}
        />
        <div className="space-y-4 flex-1">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: 'var(--shopify-green)' }} />
              <span className="text-xs" style={{ color: 'var(--shopify-subdued)' }}>Repeat Revenue ({repeatPct}%)</span>
            </div>
            <p className="text-2xl font-black ml-5" style={{ color: 'var(--shopify-text)' }}>{formatCurrency(repeatRevenue)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: '#d1f0e8' }} />
              <span className="text-xs" style={{ color: 'var(--shopify-subdued)' }}>New Revenue ({newPct}%)</span>
            </div>
            <p className="text-2xl font-black ml-5" style={{ color: 'var(--shopify-text)' }}>{formatCurrency(newRevenue)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────
function Field({
  label, value, onChange, prefix, suffix, badge, badgeStyle = 'green', hint, highlight, placeholder,
}: {
  label: string
  value: number
  onChange: (v: string) => void
  prefix?: string
  suffix?: string
  badge?: string
  badgeStyle?: 'green' | 'gray'
  hint?: string
  highlight?: boolean
  placeholder?: string
}) {
  const [localVal, setLocalVal] = useState(String(value))

  useEffect(() => { setLocalVal(String(value)) }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setLocalVal(raw)
    onChange(raw)
  }

  return (
    <div className="rounded-xl p-4"
      style={highlight ? { background: 'var(--shopify-green-light)', border: '1.5px solid var(--shopify-green)' } : {}}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold" style={{ color: highlight ? 'var(--shopify-green)' : 'var(--shopify-text)' }}>
          {label}
        </label>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={badgeStyle === 'green'
              ? { background: 'var(--shopify-green)', color: '#fff' }
              : { background: 'var(--shopify-border)', color: 'var(--shopify-subdued)' }}>
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center rounded-lg border overflow-hidden"
        style={{ borderColor: highlight ? 'rgba(0,128,96,0.3)' : 'var(--shopify-border)', background: 'var(--shopify-white)' }}>
        {prefix && <span className="px-3 text-sm font-medium" style={{ color: 'var(--shopify-subdued)' }}>{prefix}</span>}
        <input
          type="text"
          inputMode="numeric"
          value={localVal}
          onChange={handleChange}
          placeholder={placeholder}
          className="flex-1 px-3 py-3 text-sm outline-none bg-transparent font-medium"
          style={{ color: 'var(--shopify-text)' }}
        />
        {suffix && <span className="px-3 text-sm" style={{ color: 'var(--shopify-subdued)' }}>{suffix}</span>}
      </div>
      {hint && <p className="text-xs mt-2" style={{ color: highlight ? 'var(--shopify-green)' : 'var(--shopify-subdued)' }}>{hint}</p>}
    </div>
  )
}

function OpportunityCard({
  num, icon, title, punchline, range, calcLine, howBody, highlight,
}: {
  num: string
  icon: string
  title: string
  punchline: string
  range: string
  calcLine: string
  howBody: string
  highlight?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--shopify-white)',
        border: highlight ? '2px solid var(--shopify-green)' : '1px solid var(--shopify-border)',
      }}>
      <div className="p-6">
        <div className="flex gap-3 items-start mb-4">
          <span className="text-3xl font-black select-none" style={{ color: 'var(--shopify-border)', lineHeight: 1 }}>{num}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{icon}</span>
              <h3 className="text-base font-bold" style={{ color: 'var(--shopify-text)' }}>{title}</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--shopify-subdued)' }}>{punchline}</p>
          </div>
        </div>

        <div className="rounded-xl px-5 py-4 mb-4" style={{ background: 'var(--shopify-surface)' }}>
          <p className="text-4xl font-black mb-1" style={{ color: 'var(--shopify-green)' }}>{range}</p>
          <p className="text-xs" style={{ color: 'var(--shopify-subdued)' }}>per month</p>
          <p className="text-xs mt-2 font-mono" style={{ color: 'var(--shopify-subdued)' }}>{calcLine}</p>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
          style={{ color: 'var(--shopify-green)' }}
        >
          {open ? '↑ Hide' : '↓ How we calculate this'}
        </button>
      </div>

      {open && (
        <div className="px-6 pb-6">
          <div className="rounded-xl p-4" style={{ background: 'var(--shopify-green-light)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--shopify-green)' }}>
              The logic
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--shopify-text)' }}>{howBody}</p>
          </div>
        </div>
      )}
    </div>
  )
}
