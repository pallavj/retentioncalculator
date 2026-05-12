import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DTC Retention Calculator — See what you\'re leaving on the table',
  description: 'Enter your store URL and instantly see how much revenue you\'re missing from dormant customers, new customer retention, and unconverted visitors.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
