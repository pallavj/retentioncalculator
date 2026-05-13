import { render } from '@react-email/render'
import LeadAlertEmail from '@/emails/LeadAlertEmail'

const ALERT_EMAIL = process.env.ALERT_EMAIL ?? 'pallavjhawar@gmail.com'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3001'
const FROM = process.env.EMAIL_FROM ?? 'DTC Retention Calculator <hello@amplifyai.guru>'

function isEmailEnabled() {
  const key = process.env.RESEND_API_KEY
  return !!key && key !== 'your_resend_api_key_here'
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!isEmailEnabled()) {
    console.log(`[mailer] Email skipped (no RESEND_API_KEY) — to: ${to} | subject: ${subject}`)
    return
  }
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({ from: FROM, to, subject, html })
}

export async function sendLeadAlert(payload: {
  leadId: string
  brandName: string
  brandUrl: string
  whatsapp: string
  industry: string
  monthlyTraffic: number
  aov: number
  existingBase: number
  repeatRate: number
  totalLow: number
  totalHigh: number
}) {
  const reportUrl = `${BASE_URL}/report/${payload.leadId}`
  const html = await render(LeadAlertEmail({ ...payload, reportUrl }))
  await sendEmail(
    ALERT_EMAIL,
    `New lead: ${payload.brandName} — ₹${Math.round(payload.totalLow).toLocaleString('en-IN')} opportunity`,
    html,
  )
}
