export interface HoolyTrafficData {
  monthlyVisits: number
  globalRank: number | null
  category: string | null
  bounceRate: number | null
  country: string | null
}

export async function getTrafficData(domain: string): Promise<HoolyTrafficData | null> {
  const apiKey = process.env.HOOLY_API_KEY
  if (!apiKey || apiKey === 'your_hooly_api_key_here') return null

  try {
    const clean = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]
    const res = await fetch(`https://hooly.info/api/v1/traffic?domain=${clean}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 60 * 60 * 24 * 7 }, // cache 7 days
    })

    if (!res.ok) return null
    const data = await res.json()

    return {
      monthlyVisits: data.monthly_visits ?? data.visits ?? 0,
      globalRank: data.global_rank ?? null,
      category: data.category ?? null,
      bounceRate: data.bounce_rate ?? null,
      country: data.country ?? null,
    }
  } catch {
    return null
  }
}
