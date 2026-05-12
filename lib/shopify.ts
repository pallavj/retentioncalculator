interface ShopifyProduct {
  title: string
  variants: { price: string }[]
}

export interface ScrapeResult {
  brandName: string | null
  aov: number | null
  topProducts: { title: string; price: number }[]
}

export async function scrapeShopifyStore(url: string): Promise<ScrapeResult> {
  try {
    const base = url.replace(/\/$/, '').split('/collections')[0].split('/products')[0]
    const origin = new URL(base.startsWith('http') ? base : `https://${base}`).origin

    // Shopify public API — works on all Shopify stores
    const res = await fetch(`${origin}/products.json?sort_by=best-selling&limit=8`, {
      next: { revalidate: 60 * 60 * 24 }, // cache 24hrs
    })

    if (!res.ok) throw new Error('Not a Shopify store or blocked')

    const data = await res.json()
    const products: ShopifyProduct[] = data.products ?? []

    if (products.length === 0) return { brandName: null, aov: null, topProducts: [] }

    const topProducts = products.slice(0, 5).map((p) => ({
      title: p.title,
      price: parseFloat(p.variants[0]?.price ?? '0'),
    }))

    const validPrices = topProducts.map((p) => p.price).filter((p) => p > 0)
    const aov = validPrices.length > 0
      ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)
      : null

    // Try to extract brand name from meta
    let brandName: string | null = null
    try {
      const homeRes = await fetch(origin, { next: { revalidate: 60 * 60 * 24 * 7 } })
      const html = await homeRes.text()
      const ogMatch = html.match(/<meta[^>]+property="og:site_name"[^>]+content="([^"]+)"/i)
      const titleMatch = html.match(/<title>([^<|–\-]+)/i)
      brandName = ogMatch?.[1] ?? titleMatch?.[1]?.trim() ?? null
    } catch {
      // brand name stays null
    }

    return { brandName, aov, topProducts }
  } catch {
    return { brandName: null, aov: null, topProducts: [] }
  }
}
