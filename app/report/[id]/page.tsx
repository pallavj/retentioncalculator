import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { calculate, formatCurrency, formatRange } from '@/lib/calculations'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) notFound()

  const results = calculate({
    monthlyTraffic: lead.monthlyTraffic,
    conversionRate: lead.conversionRate,
    aov: lead.aov,
    existingBase: lead.existingBase,
    repeatRate: lead.repeatRate,
  })

  const brandName = lead.brandName ?? lead.brandUrl
  const industry = lead.industry ?? 'DTC Brand'
  const whatsapp = lead.email  // stored in email field

  // Sort opportunities by high value descending
  const opportunities = [
    {
      num: '01',
      icon: '🔄',
      title: 'Retain new customers better',
      stat: `${results.monthlyNewCustomers.toLocaleString('en-IN')} new customers this month`,
      range: formatRange(results.opp1Low, results.opp1High),
      body: `Most brands already send an order confirmation — and some send a follow-up or two. That's a good start. What we add on top is a structured sequence built around your product and purchase behaviour: the right message, to the right customer, at the right time. Brands doing the basics typically see 5% more repeat buyers. With the right sequencing layered on top, that number moves to 10%. Purely additive to whatever you're already doing.`,
      numbers: [
        { label: 'New customers/month', value: results.monthlyNewCustomers.toLocaleString('en-IN') },
        { label: 'Upside at 5%', value: formatCurrency(results.opp1Low) + '/mo' },
        { label: 'Upside at 10%', value: formatCurrency(results.opp1High) + '/mo' },
      ],
      high: results.opp1High,
    },
    {
      num: '02',
      icon: '💤',
      title: 'Revive your customer base',
      stat: `${lead.existingBase.toLocaleString('en-IN')} total customers in your base`,
      range: formatRange(results.opp2Low, results.opp2High),
      body: `You're likely already running some win-back activity — a discount email here, a reminder there. That's not wasted effort. What we layer on top is timing and targeting precision: knowing which customers are most likely to respond right now, and hitting them at that moment. Most brands recover 0.5% of their base with broad win-back blasts. With better targeting built on purchase history and behaviour, that number reliably doubles. Same audience, better results — on top of what you're already doing.`,
      numbers: [
        { label: 'Customer base', value: lead.existingBase.toLocaleString('en-IN') },
        { label: `Upside at ${((lead.conversionRate * 0.25) * 100).toFixed(2)}%`, value: formatCurrency(results.opp2Low) + '/mo' },
        { label: `Upside at ${((lead.conversionRate * 0.5) * 100).toFixed(2)}%`, value: formatCurrency(results.opp2High) + '/mo' },
      ],
      high: results.opp2High,
    },
    {
      num: '03',
      icon: '🛒',
      title: 'Convert the ones who almost bought',
      stat: `${results.monthlyAbandoners.toLocaleString('en-IN')} visitors left without buying this month`,
      range: formatRange(results.opp3Low, results.opp3High),
      body: `If you're running abandoned cart emails or retargeting ads, you're already recovering some of these. Good. What we add is a faster, cheaper, higher-converting layer on top — typically WhatsApp or SMS, which gets opened within minutes versus hours for email. We also go beyond cart abandoners: people who browsed but never added, or visited a product page multiple times. The combined effect on top of your existing recovery is what moves the needle — on traffic you've already paid for.`,
      numbers: [
        { label: 'Monthly abandoners', value: results.monthlyAbandoners.toLocaleString('en-IN') },
        { label: `Upside at ${((lead.conversionRate * 0.25) * 100).toFixed(2)}%`, value: formatCurrency(results.opp3Low) + '/mo' },
        { label: `Upside at ${((lead.conversionRate * 0.5) * 100).toFixed(2)}%`, value: formatCurrency(results.opp3High) + '/mo' },
      ],
      high: results.opp3High,
    },
  ].sort((a, b) => b.high - a.high)
    .map((opp, i) => ({ ...opp, num: String(i + 1).padStart(2, '0') }))

  const repeatPct = Math.round((results.monthlyRepeatRevenue / results.monthlyTotalRevenue) * 100)
  const newPct = 100 - repeatPct

  return (
    <div className="min-h-screen" style={{ background: 'var(--shopify-surface)' }}>
      {/* Report header */}
      <div className="text-white py-12 px-4" style={{ background: 'var(--shopify-green)' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-sm opacity-70 mb-2 uppercase tracking-wider">Retention Audit Report</p>
          <h1 className="text-3xl font-bold mb-2">{brandName}</h1>
          <p className="opacity-80">{industry} · {lead.brandUrl}</p>

          <div className="mt-8 p-6 rounded-xl bg-white/10 backdrop-blur">
            <p className="text-sm opacity-80 mb-1">You're leaving this much on the table every month:</p>
            <p className="text-4xl font-bold mb-3">{formatRange(results.totalLow, results.totalHigh)}</p>
            <div className="inline-block rounded-lg px-4 py-2 mb-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <p className="text-xl font-black">
                That's {Math.round((results.totalLow / results.monthlyTotalRevenue) * 100)}–{Math.round((results.totalHigh / results.monthlyTotalRevenue) * 100)}% of your current monthly revenue — left on the table
              </p>
            </div>
            <p className="text-sm opacity-70 mt-1">without increasing your ad spend by a single rupee</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Store snapshot */}
        <section className="rounded-xl p-6" style={{ background: 'var(--shopify-white)', border: '1px solid var(--shopify-border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--shopify-text)' }}>Your Store at a Glance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Monthly Traffic', value: lead.monthlyTraffic.toLocaleString('en-IN') + ' sessions' },
              { label: 'Conversion Rate', value: (lead.conversionRate * 100).toFixed(2) + '%' },
              { label: 'Average Order Value', value: formatCurrency(lead.aov) },
              { label: 'Monthly Total Revenue', value: formatCurrency(results.monthlyTotalRevenue) },
              { label: 'Monthly Repeat Revenue', value: formatCurrency(results.monthlyRepeatRevenue) },
              { label: 'Monthly New Revenue', value: formatCurrency(results.monthlyNewRevenue) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg p-4"
                style={{ background: 'var(--shopify-surface)', border: '1px solid var(--shopify-border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--shopify-subdued)' }}>{item.label}</p>
                <p className="text-lg font-bold" style={{ color: 'var(--shopify-text)' }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Revenue pie chart */}
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--shopify-border)' }}>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--shopify-text)' }}>Revenue split — new vs repeat</p>
            <div className="flex items-center gap-8">
              <div
                className="flex-shrink-0 w-24 h-24 rounded-full"
                style={{
                  background: `conic-gradient(var(--shopify-green) 0% ${repeatPct}%, #d1f0e8 ${repeatPct}% 100%)`,
                }}
              />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--shopify-green)' }} />
                  <span className="text-sm" style={{ color: 'var(--shopify-subdued)' }}>
                    Repeat — <strong style={{ color: 'var(--shopify-text)' }}>{formatCurrency(results.monthlyRepeatRevenue)}</strong> ({repeatPct}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: '#d1f0e8' }} />
                  <span className="text-sm" style={{ color: 'var(--shopify-subdued)' }}>
                    New — <strong style={{ color: 'var(--shopify-text)' }}>{formatCurrency(results.monthlyNewRevenue)}</strong> ({newPct}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The gap */}
        <section className="rounded-xl p-6" style={{ background: 'var(--shopify-white)', border: '1px solid var(--shopify-border)' }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--shopify-text)' }}>The Gap</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--shopify-subdued)' }}>
            Only <strong>{(lead.repeatRate * 100).toFixed(0)}%</strong> of your monthly orders come from repeat customers.
            The {industry} benchmark is typically <strong>25–35%</strong>.
          </p>
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--shopify-subdued)' }}>
              <span>Your repeat rate: {(lead.repeatRate * 100).toFixed(0)}%</span>
              <span>Benchmark: 25–35%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--shopify-border)' }}>
              <div className="h-full rounded-full" style={{ width: `${lead.repeatRate * 100}%`, background: 'var(--shopify-green)' }} />
            </div>
          </div>
        </section>

        {/* The 3 opportunities — sorted by value */}
        <h2 className="text-lg font-semibold" style={{ color: 'var(--shopify-text)' }}>
          The 3 Opportunities — sorted by size
        </h2>

        {opportunities.map((opp) => (
          <div key={opp.num} className="rounded-xl overflow-hidden"
            style={{ background: 'var(--shopify-white)', border: '1px solid var(--shopify-border)' }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-black opacity-20" style={{ color: 'var(--shopify-green)' }}>{opp.num}</span>
                <span className="text-xl">{opp.icon}</span>
                <h3 className="font-semibold" style={{ color: 'var(--shopify-text)' }}>{opp.title}</h3>
              </div>
              <p className="text-sm mb-3" style={{ color: 'var(--shopify-subdued)' }}>{opp.stat}</p>
              <p className="text-3xl font-black mb-4" style={{ color: 'var(--shopify-green)' }}>{opp.range} / month</p>
              <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--shopify-green-light)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--shopify-green)' }}>The logic</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--shopify-text)' }}>{opp.body}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {opp.numbers.map((n) => (
                  <div key={n.label} className="rounded-lg p-3 text-center"
                    style={{ background: 'var(--shopify-surface)', border: '1px solid var(--shopify-border)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--shopify-subdued)' }}>{n.label}</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--shopify-text)' }}>{n.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Final CTA */}
        <div className="rounded-xl p-8 text-center text-white" style={{ background: 'var(--shopify-green)' }}>
          <h2 className="text-2xl font-bold mb-3">Ready to close this gap?</h2>
          <p className="opacity-90 mb-6 max-w-md mx-auto">
            We help DTC brands fix retention with the right messaging, timing, and flows —
            without increasing ad spend. Let's talk about what's fixable for {brandName}.
          </p>
          {process.env.NEXT_PUBLIC_BOOKING_URL ? (
            <>
              <a
                href={process.env.NEXT_PUBLIC_BOOKING_URL}
                className="inline-block px-8 py-4 rounded-xl font-semibold text-base"
                style={{ background: 'white', color: 'var(--shopify-green)' }}
              >
                Book a Free 20-Min Strategy Call →
              </a>
              <p className="text-xs opacity-60 mt-3">No pitch. Just honest advice on what to fix first.</p>
            </>
          ) : (
            <p className="opacity-80 text-sm">Reply to this report on WhatsApp and we'll set up a call.</p>
          )}
        </div>

        <p className="text-xs text-center pb-8" style={{ color: 'var(--shopify-subdued)' }}>
          Report generated for {whatsapp} · {new Date(lead.createdAt).toLocaleDateString('en-IN')}
        </p>
      </div>
    </div>
  )
}
