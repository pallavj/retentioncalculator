import { render } from '@react-email/render'
import ReportEmail from '@/emails/ReportEmail'
import LeadAlertEmail from '@/emails/LeadAlertEmail'

const ALERT_EMAIL = process.env.ALERT_EMAIL ?? 'pallavjhawar@gmail.com'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3001'
const FROM = process.env.EMAIL_FROM ?? 'DTC Retention Calculator <hello@yourdomain.com>'

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

interface ReportPayload {
  to: string
  leadId: string
  brandName: string
  brandUrl: string
  industry: string
  aov: number
  existingBase: number
  monthlyNewCustomers: number
  monthlyDormantCustomers: number
  opp1Low: number; opp1High: number
  opp2Low: number; opp2High: number
  opp3Low: number; opp3High: number
  totalLow: number; totalHigh: number
}

export async function sendReportEmail(payload: ReportPayload) {
  const reportUrl = `${BASE_URL}/report/${payload.leadId}`
  const html = await render(ReportEmail({ ...payload, reportUrl }))
  await sendEmail(
    payload.to,
    `Your retention report for ${payload.brandName} is ready`,
    html,
  )
}

export async function sendLeadAlert(payload: {
  leadId: string
  brandName: string
  brandUrl: string
  email: string
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
