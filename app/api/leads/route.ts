import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { calculate } from '@/lib/calculations'
import { sendLeadAlert } from '@/lib/mailer'

const schema = z.object({
  submissionId: z.string(),
  whatsapp: z.string().min(7).max(20),
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

  const { submissionId, whatsapp, ...inputs } = parsed.data

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } })
  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  const results = calculate(inputs)

  const lead = await prisma.lead.create({
    data: {
      email: whatsapp,   // stored in the email field for DB compatibility
      brandUrl: submission.brandUrl,
      brandName: submission.brandName,
      industry: submission.industry,
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

  await prisma.submission.update({
    where: { id: submissionId },
    data: { emailCaptured: true, leadId: lead.id },
  })

  // Send lead alert to our team only — report is sent to the user via WhatsApp separately
  try {
    await sendLeadAlert({
      leadId: lead.id,
      brandName: submission.brandName ?? submission.brandUrl,
      brandUrl: submission.brandUrl,
      whatsapp,
      industry: submission.industry ?? 'DTC Brand',
      monthlyTraffic: inputs.monthlyTraffic,
      aov: inputs.aov,
      existingBase: inputs.existingBase,
      repeatRate: inputs.repeatRate,
      totalLow: results.totalLow,
      totalHigh: results.totalHigh,
    })
    console.log('[leads] lead alert sent OK for:', whatsapp)
  } catch (e) {
    console.error('[leads] lead alert error:', e)
  }

  return NextResponse.json({ leadId: lead.id })
}
