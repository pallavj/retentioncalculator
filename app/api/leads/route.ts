import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { calculate } from '@/lib/calculations'
import { sendReportEmail, sendLeadAlert } from '@/lib/mailer'

const schema = z.object({
  submissionId: z.string(),
  email: z.string().email(),
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

  const { submissionId, email, ...inputs } = parsed.data

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } })
  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  const results = calculate(inputs)

  const lead = await prisma.lead.create({
    data: {
      email,
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

  const emailPayload = {
    to: email,
    leadId: lead.id,
    brandName: submission.brandName ?? submission.brandUrl,
    brandUrl: submission.brandUrl,
    industry: submission.industry ?? 'DTC Brand',
    aov: inputs.aov,
    existingBase: inputs.existingBase,
    monthlyNewCustomers: results.monthlyNewCustomers,
    monthlyDormantCustomers: results.monthlyDormantCustomers,
    opp1Low: results.opp1Low,
    opp1High: results.opp1High,
    opp2Low: results.opp2Low,
    opp2High: results.opp2High,
    opp3Low: results.opp3Low,
    opp3High: results.opp3High,
    totalLow: results.totalLow,
    totalHigh: results.totalHigh,
  }

  // Send emails — await so errors appear in Vercel logs
  try {
    await Promise.all([
      sendReportEmail(emailPayload),
      sendLeadAlert({
        leadId: lead.id,
        brandName: submission.brandName ?? submission.brandUrl,
        brandUrl: submission.brandUrl,
        email,
        industry: submission.industry ?? 'DTC Brand',
        monthlyTraffic: inputs.monthlyTraffic,
        aov: inputs.aov,
        existingBase: inputs.existingBase,
        repeatRate: inputs.repeatRate,
        totalLow: results.totalLow,
        totalHigh: results.totalHigh,
      }),
    ])
    console.log('[leads] emails sent OK to:', email)
  } catch (e) {
    console.error('[leads] email error:', e)
  }

  return NextResponse.json({ leadId: lead.id })
}
