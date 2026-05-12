import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Row, Column,
} from '@react-email/components'
import { formatCurrency, formatRange } from '@/lib/calculations'

interface Props {
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
  reportUrl: string
}

export default function ReportEmail({
  brandName = 'Your Brand',
  brandUrl = '',
  industry = 'DTC Brand',
  aov = 1500,
  existingBase = 1000,
  monthlyNewCustomers = 100,
  monthlyDormantCustomers = 900,
  opp1Low = 0, opp1High = 0,
  opp2Low = 0, opp2High = 0,
  opp3Low = 0, opp3High = 0,
  totalLow = 0, totalHigh = 0,
  reportUrl = '#',
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{brandName} is leaving {formatCurrency(totalLow)}–{formatCurrency(totalHigh)} on the table every month</Preview>
      <Body style={{ backgroundColor: '#F6F6F7', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

          <Heading style={{ color: '#202223', fontSize: 24, marginBottom: 8 }}>
            Here's the money {brandName} is leaving on the table
          </Heading>
          <Text style={{ color: '#6D7175', marginTop: 0 }}>
            Based on {brandUrl} · {industry}
          </Text>

          <Section style={{ background: '#008060', borderRadius: 8, padding: '24px 32px', margin: '24px 0' }}>
            <Text style={{ color: '#fff', margin: 0, fontSize: 14 }}>Monthly opportunity</Text>
            <Heading style={{ color: '#fff', fontSize: 36, margin: '8px 0 0' }}>
              {formatRange(totalLow, totalHigh)}
            </Heading>
            <Text style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: 13 }}>per month, every month</Text>
          </Section>

          <Text style={{ color: '#202223', fontWeight: 600, fontSize: 16 }}>Here's where it's coming from:</Text>

          {[
            { label: '1. Retaining new customers better', low: opp1Low, high: opp1High, desc: `${monthlyNewCustomers} new customers/month — 5–10% more retention = real recurring revenue` },
            { label: '2. Reviving dormant customers', low: opp2Low, high: opp2High, desc: `${monthlyDormantCustomers.toLocaleString('en-IN')} dormant customers — even 0.5–1% responding adds up fast` },
            { label: '3. Converting more abandoners', low: opp3Low, high: opp3High, desc: `Recovering 5–10% of visitors who nearly bought but didn't` },
          ].map((opp) => (
            <Section key={opp.label} style={{ borderLeft: '3px solid #008060', paddingLeft: 16, marginBottom: 20 }}>
              <Text style={{ color: '#202223', fontWeight: 600, margin: '0 0 4px' }}>{opp.label}</Text>
              <Text style={{ color: '#008060', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
                {formatRange(opp.low, opp.high)} / month
              </Text>
              <Text style={{ color: '#6D7175', fontSize: 13, margin: 0 }}>{opp.desc}</Text>
            </Section>
          ))}

          <Hr style={{ borderColor: '#E4E5E7', margin: '24px 0' }} />

          <Button
            href={reportUrl}
            style={{ background: '#008060', color: '#fff', padding: '14px 28px', borderRadius: 6, fontSize: 15, fontWeight: 600, display: 'inline-block' }}
          >
            View Full Report →
          </Button>

          <Text style={{ color: '#6D7175', fontSize: 13, marginTop: 24 }}>
            Want to close this gap? We help DTC brands fix retention with the right messaging, timing, and flows — without increasing ad spend.
          </Text>

          <Hr style={{ borderColor: '#E4E5E7' }} />
          <Text style={{ color: '#6D7175', fontSize: 12 }}>
            You're receiving this because you used the DTC Retention Calculator. This report was generated for {brandUrl}.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
