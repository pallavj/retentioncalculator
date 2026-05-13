import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Row, Column,
} from '@react-email/components'
import { formatCurrency, formatRange } from '@/lib/calculations'

interface Props {
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
  reportUrl: string
}

export default function LeadAlertEmail({
  brandName = 'Unknown Brand',
  brandUrl = '',
  email = '',
  industry = 'DTC',
  monthlyTraffic = 0,
  aov = 0,
  existingBase = 0,
  repeatRate = 0,
  totalLow = 0,
  totalHigh = 0,
  reportUrl = '#',
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New lead: {brandName} — {formatCurrency(totalLow)} opportunity</Preview>
      <Body style={{ backgroundColor: '#F6F6F7', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
          <Section style={{ background: '#008060', borderRadius: 8, padding: '16px 24px', marginBottom: 24 }}>
            <Text style={{ color: '#fff', margin: 0, fontWeight: 700, fontSize: 18 }}>
              🔔 New lead: {brandName}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 0', fontSize: 14 }}>
              Opportunity: {formatRange(totalLow, totalHigh)} / month
            </Text>
          </Section>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            {[
              ['Email', email],
              ['Brand URL', brandUrl],
              ['Industry', industry],
              ['Monthly Traffic', monthlyTraffic.toLocaleString('en-IN')],
              ['AOV', formatCurrency(aov)],
              ['Existing Customer Base', existingBase.toLocaleString('en-IN')],
              ['Current Repeat Rate', `${(repeatRate * 100).toFixed(0)}%`],
            ].map(([label, value]) => (
              <tr key={label} style={{ borderBottom: '1px solid #E4E5E7' }}>
                <td style={{ padding: '10px 0', color: '#6D7175', fontSize: 13, width: '45%' }}>{label}</td>
                <td style={{ padding: '10px 0', color: '#202223', fontWeight: 500, fontSize: 13 }}>{value}</td>
              </tr>
            ))}
          </table>

          <Text style={{ marginTop: 24 }}>
            <a href={reportUrl} style={{ color: '#008060', fontWeight: 600 }}>View their full report →</a>
          </Text>

          <Hr style={{ borderColor: '#E4E5E7' }} />
          <Text style={{ color: '#6D7175', fontSize: 12 }}>Sent from DTC Retention Calculator · retentioncalculator.vercel.app</Text>
        </Container>
      </Body>
    </Html>
  )
}
