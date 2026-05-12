export interface TrafficData {
  monthlyVisits: number
  globalRank: number | null
  category: string | null
  bounceRate: number | null
  country: string | null
}

export async function getTrafficData(domain: string): Promise<TrafficData | null> {
  const apiKey = process.env.HOOLY_API_KEY
  if (!apiKey || apiKey === 'your_hooly_api_key_here') return null

  try {
    const clean = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]

    const res = await fetch(`https://website-traffic2.p.rapidapi.com/info?domain=${clean}`, {
      headers: {
        'x-rapidapi-host': 'website-traffic2.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 * 60 * 24 * 7 }, // cache 7 days
    })

    if (!res.ok) return null
    const data = await res.json()
    if (data.message) return null // API error (e.g. not subscribed)

    // RapidAPI website-traffic2 response shape
    return {
      monthlyVisits:
        data.monthly_visits ??
        data.monthlyVisits ??
        data.visits_per_month ??
        data.total_visits ??
        0,
      globalRank: data.global_rank ?? data.globalRank ?? null,
      category: data.category ?? data.main_category ?? null,
      bounceRate: data.bounce_rate ?? data.bounceRate ?? null,
      country: data.country ?? data.top_country ?? null,
    }
  } catch {
    return null
  }
}
