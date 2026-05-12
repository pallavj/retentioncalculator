import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calculate } from '@/lib/calculations'
import { prisma } from '@/lib/db'

const schema = z.object({
  id: z.string(),
  monthlyTraffic: z.number().positive(),
  conversionRate: z.number().min(0.001).max(0.5),
  aov: z.number().positive(),
  existingBase: z.number().int().positive(),
  repeatRate: z.number().min(0.001).max(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid inputs' }, { status: 400 })
  }

  const { id, ...inputs } = parsed.data
  const results = calculate(inputs)

  await prisma.submission.update({
    where: { id },
    data: {
      ...inputs,
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

  return NextResponse.json({ results })
}
