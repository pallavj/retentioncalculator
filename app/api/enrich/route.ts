import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTrafficData } from '@/lib/hooly'
import { scrapeShopifyStore } from '@/lib/shopify'
import { detectIndustry } from '@/lib/industry-benchmarks'
import { prisma } from '@/lib/db'
import { calculate } from '@/lib/calculations'

const schema = z.object({ url: z.string().url() })

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const { url } = parsed.data

  const [traffic, shopify] = await Promise.all([
    getTrafficData(url),
    scrapeShopifyStore(url),
  ])

  const industry = detectIndustry(traffic?.category ?? undefined, shopify.brandName ?? undefined)

  const monthlyTraffic = traffic?.monthlyVisits ?? 10000
  const conversionRate = 0.02
  const aov = shopify.aov ?? 1500
  const existingBase = 1000
  const repeatRate = industry.repeatRate

  const results = calculate({ monthlyTraffic, conversionRate, aov, existingBase, repeatRate })

  const submission = await prisma.submission.create({
    data: {
      brandUrl: url,
      brandName: shopify.brandName,
      industry: industry.label,
      monthlyTraffic,
      conversionRate,
      aov,
      existingBase,
      repeatRate,
      opp1Low: results.opp1Low,
      opp1High: results.opp1High,
      opp2Low: results.opp2Low,
      opp2High: results.opp2High,
      opp3Low: results.opp3Low,
      opp3High: results.opp3High,
      totalLow: results.totalLow,
      totalHigh: results.totalHigh,
    },
  })

  return NextResponse.json({
    id: submission.id,
    brandUrl: url,
    brandName: shopify.brandName,
    industry: industry.label,
    industryRepeatRate: industry.repeatRate,
    topProducts: shopify.topProducts,
    prefill: {
      monthlyTraffic,
      conversionRate,
      aov,
      existingBase,
      repeatRate,
    },
    results,
    trafficSource: traffic ? 'hooly' : 'estimated',
    aovSource: shopify.aov ? 'scraped' : 'estimated',
  })
}
