import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculate } from '@/lib/calculations'
import { detectIndustry, BENCHMARKS } from '@/lib/industry-benchmarks'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const submission = await prisma.submission.findUnique({ where: { id } })
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const industry = detectIndustry(submission.industry ?? undefined)
  const results = calculate({
    monthlyTraffic: submission.monthlyTraffic,
    conversionRate: submission.conversionRate,
    aov: submission.aov,
    existingBase: submission.existingBase,
    repeatRate: submission.repeatRate,
  })

  return NextResponse.json({
    id: submission.id,
    brandUrl: submission.brandUrl,
    brandName: submission.brandName,
    industry: submission.industry ?? 'DTC Brand',
    industryRepeatRate: industry.repeatRate,
    topProducts: [],
    prefill: {
      monthlyTraffic: submission.monthlyTraffic,
      conversionRate: submission.conversionRate,
      aov: submission.aov,
      existingBase: submission.existingBase,
      repeatRate: submission.repeatRate,
    },
    results,
    trafficSource: 'stored',
    aovSource: 'stored',
  })
}
