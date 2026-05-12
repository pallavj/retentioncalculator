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
            <p className="text-4xl font-bold">{formatRange(results.totalLow, results.totalHigh)}</p>
            <p className="text-sm opacity-70 mt-1">without increasing your ad spend by a single rupee</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Brand snapshot */}
        <section className="rounded-xl p-6" style={{ background: 'var(--shopify-white)', border: '1px solid var(--shopify-border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--shopify-text)' }}>Your Store at a Glance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Monthly Traffic', value: lead.monthlyTraffic.toLocaleString('en-IN') + ' sessions' },
              { label: 'Conversion Rate', value: (lead.conversionRate * 100).toFixed(2) + '%' },
              { label: 'Average Order Value', value: formatCurrency(lead.aov) },
              { label: 'Monthly New Customers', value: results.monthlyNewCustomers.toLocaleString('en-IN') },
              { label: 'Monthly Repeat Revenue', value: formatCurrency(results.monthlyRepeatRevenue) },
              { label: 'Dormant Customers', value: results.monthlyDormantCustomers.toLocaleString('en-IN') },
            ].map((item) => (
              <div key={item.label} className="rounded-lg p-4"
                style={{ background: 'var(--shopify-surface)', border: '1px solid var(--shopify-border)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--shopify-subdued)' }}>{item.label}</p>
                <p className="text-lg font-bold" style={{ color: 'var(--shopify-text)' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The gap */}
        <section className="rounded-xl p-6" style={{ background: 'var(--shopify-white)', border: '1px solid var(--shopify-border)' }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--shopify-text)' }}>The Gap</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--shopify-subdued)' }}>
            {results.monthlyDormantCustomers.toLocaleString('en-IN')} of your {lead.existingBase.toLocaleString('en-IN')} customers are dormant.
            Only <strong>{(lead.repeatRate * 100).toFixed(0)}%</strong> repeat each month — the {industry} benchmark is typically{' '}
            <strong>25–35%</strong>.
          </p>

          {/* Visual gap bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--shopify-subdued)' }}>
              <span>Your repeat rate: {(lead.repeatRate * 100).toFixed(0)}%</span>
              <span>Benchmark: 25–35%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--shopify-border)' }}>
              <div className="h-full rounded-full" style={{ width: `${lead.repeatRate * 100}%`, background: 'var(--shopify-green)' }} />
            </div>
          </div>
        </section>

        {/* The 3 opportunities */}
        <h2 className="text-lg font-semibold" style={{ color: 'var(--shopify-text)' }}>The 3 Opportunities</h2>

        {[
          {
            num: '01',
            icon: '🔄',
            title: 'Retain new customers better',
            stat: `${results.monthlyNewCustomers} new customers/month`,
            range: formatRange(results.opp1Low, results.opp1High),
            body: `Based on our experience with DTC brands in the ${industry} category, new customers who receive the right communication sequence in the first 30 days are 5–10% more likely to place a second order. Most brands send a generic order confirmation and nothing else — that's the gap. A well-timed 3-touch sequence (post-purchase education → usage nudge → reorder prompt) consistently moves the needle.`,
            numbers: [
              { label: 'New customers/month', value: results.monthlyNewCustomers.toLocaleString('en-IN') },
              { label: 'Upside at 5%', value: formatCurrency(results.opp1Low) + '/mo' },
              { label: 'Upside at 10%', value: formatCurrency(results.opp1High) + '/mo' },
            ],
          },
          {
            num: '02',
            icon: '💤',
            title: 'Revive dormant customers',
            stat: `${results.monthlyDormantCustomers.toLocaleString('en-IN')} dormant customers`,
            range: formatRange(results.opp2Low, results.opp2High),
            body: `Based on our experience, 0.5–1% of dormant customers respond to a well-timed win-back sequence — the right offer, sent when they're most likely to re-engage. These customers already trust you. They don't need to be convinced from scratch. A simple win-back flow with a reason to return (new collection, loyalty offer, "we miss you" moment) reactivates them consistently.`,
            numbers: [
              { label: 'Dormant customers', value: results.monthlyDormantCustomers.toLocaleString('en-IN') },
              { label: 'Upside at 0.5%', value: formatCurrency(results.opp2Low) + '/mo' },
              { label: 'Upside at 1%', value: formatCurrency(results.opp2High) + '/mo' },
            ],
          },
          {
            num: '03',
            icon: '🛒',
            title: 'Convert more abandoners',
            stat: `${results.monthlyNewCustomers} new customer opportunities/month`,
            range: formatRange(results.opp3Low, results.opp3High),
            body: `Based on our experience, giving abandoners better reasons to complete their first purchase — through timely reminders and the right social proof — recovers 5–10% of lost conversions. These aren't cold leads. They visited your store, browsed your products, and showed real intent. The right abandoned cart sequence with urgency and trust signals closes a meaningful percentage of them.`,
            numbers: [
              { label: 'Potential new customers', value: results.monthlyNewCustomers.toLocaleString('en-IN') },
              { label: 'Upside at 5%', value: formatCurrency(results.opp3Low) + '/mo' },
              { label: 'Upside at 10%', value: formatCurrency(results.opp3High) + '/mo' },
            ],
          },
        ].map((opp) => (
          <div key={opp.num} className="rounded-xl overflow-hidden"
            style={{ background: 'var(--shopify-white)', border: '1px solid var(--shopify-border)' }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-black opacity-20" style={{ color: 'var(--shopify-green)' }}>{opp.num}</span>
                <span className="text-xl">{opp.icon}</span>
                <h3 className="font-semibold" style={{ color: 'var(--shopify-text)' }}>{opp.title}</h3>
              </div>
              <p className="text-sm mb-3" style={{ color: 'var(--shopify-subdued)' }}>{opp.stat}</p>
              <p className="text-2xl font-bold mb-4" style={{ color: 'var(--shopify-green)' }}>{opp.range} / month</p>
              <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--shopify-green-light)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--shopify-green)' }}>Based on our experience</p>
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
            <p className="opacity-80 text-sm">
              Reply to your report email and we'll set up a call.
            </p>
          )}
        </div>

        <p className="text-xs text-center pb-8" style={{ color: 'var(--shopify-subdued)' }}>
          Report generated for {lead.email} · {new Date(lead.createdAt).toLocaleDateString('en-IN')}
        </p>
      </div>
    </div>
  )
}
