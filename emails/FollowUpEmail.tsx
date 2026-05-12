import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr,
} from '@react-email/components'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  brandName: string
  monthlyDormantCustomers: number
  aov: number
  totalLow: number
  reportUrl: string
  bookingUrl?: string
}

export default function FollowUpEmail({
  brandName = 'Your Brand',
  monthlyDormantCustomers = 900,
  aov = 1500,
  totalLow = 0,
  reportUrl = '#',
  bookingUrl = '#',
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Quick question about {brandName}'s {monthlyDormantCustomers.toLocaleString('en-IN')} dormant customers</Preview>
      <Body style={{ backgroundColor: '#F6F6F7', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

          <Heading style={{ color: '#202223', fontSize: 22 }}>
            Quick question about {brandName}'s dormant customers
          </Heading>

          <Text style={{ color: '#202223', lineHeight: 1.6 }}>
            You ran a retention audit for {brandName} a couple of days ago.
          </Text>

          <Text style={{ color: '#202223', lineHeight: 1.6 }}>
            The number that stood out to us: <strong>{monthlyDormantCustomers.toLocaleString('en-IN')} customers</strong> who already trust your brand — and haven't come back.
          </Text>

          <Text style={{ color: '#202223', lineHeight: 1.6 }}>
            Each of them spent {formatCurrency(aov)} once. A fraction of them coming back adds {formatCurrency(totalLow)}+ every month — without a single new ad.
          </Text>

          <Text style={{ color: '#202223', lineHeight: 1.6 }}>
            Based on our experience with DTC brands in your category, the right win-back sequence — sent at the right time, with the right offer — reactivates 0.5–1% of that dormant base every month. That compounds.
          </Text>

          <Text style={{ color: '#202223', lineHeight: 1.6 }}>
            Would a 20-minute call make sense? No pitch — just walk through what's fixable and what it would take.
          </Text>

          <Button
            href={bookingUrl}
            style={{ background: '#008060', color: '#fff', padding: '14px 28px', borderRadius: 6, fontSize: 15, fontWeight: 600, display: 'inline-block', marginTop: 8 }}
          >
            Book a Free 20-Min Call
          </Button>

          <Text style={{ color: '#6D7175', fontSize: 13, marginTop: 16 }}>
            Or view your full report again: <a href={reportUrl} style={{ color: '#008060' }}>here</a>
          </Text>

          <Hr style={{ borderColor: '#E4E5E7', marginTop: 32 }} />
          <Text style={{ color: '#6D7175', fontSize: 12 }}>
            Sent because you used the DTC Retention Calculator.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
