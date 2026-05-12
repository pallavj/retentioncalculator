export interface TrafficData {
  monthlyVisits: number
  globalRank: number | null
  category: string | null
  bounceRate: number | null
  country: string | null
}

export async function getTrafficData(domainOrUrl: string): Promise<TrafficData | null> {
  const apiKey = process.env.HOOLY_API_KEY
  if (!apiKey || apiKey === 'your_hooly_api_key_here') return null

  try {
    const clean = domainOrUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]

    const res = await fetch(`https://website-traffic2.p.rapidapi.com/info?domain=${clean}`, {
      headers: {
        'x-rapidapi-host': 'website-traffic2.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 * 60 * 24 * 7 }, // cache 7 days
    })

    if (!res.ok) return null
    const json = await res.json()
    if (json.message || !json.data) return null

    const d = json.data

    // Average the last 3 months of visits
    const visitEntries = Object.values(d.visits ?? {}) as number[]
    const recent = visitEntries.slice(-3)
    const monthlyVisits =
      recent.length > 0 ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : 0

    return {
      monthlyVisits,
      globalRank: d.rank?.global?.rank ?? null,
      category: d.category ?? null,
      bounceRate: d.bounce ?? null,
      country: d.top_country_shares?.[0]?.country_name ?? null,
    }
  } catch {
    return null
  }
}
