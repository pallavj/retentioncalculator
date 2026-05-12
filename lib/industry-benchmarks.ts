export interface IndustryBenchmark {
  label: string
  repeatRate: number  // industry avg monthly repeat rate
  keywords: string[]
}

export const BENCHMARKS: IndustryBenchmark[] = [
  {
    label: 'Skincare & Beauty',
    repeatRate: 0.28,
    keywords: ['skincare', 'beauty', 'cosmetic', 'makeup', 'serum', 'moisturizer', 'cleanser', 'sunscreen'],
  },
  {
    label: 'Health & Supplements',
    repeatRate: 0.32,
    keywords: ['supplement', 'vitamin', 'protein', 'health', 'wellness', 'nutrition', 'ayurved', 'herb'],
  },
  {
    label: 'Food & Beverage',
    repeatRate: 0.38,
    keywords: ['food', 'beverage', 'snack', 'coffee', 'tea', 'chocolate', 'organic', 'grocery'],
  },
  {
    label: 'Pet Care',
    repeatRate: 0.33,
    keywords: ['pet', 'dog', 'cat', 'animal', 'paw', 'fur', 'vet'],
  },
  {
    label: 'Apparel & Fashion',
    repeatRate: 0.22,
    keywords: ['fashion', 'apparel', 'clothing', 'wear', 'shirt', 'dress', 'jeans', 'outfit', 'kurta'],
  },
  {
    label: 'Home & Living',
    repeatRate: 0.18,
    keywords: ['home', 'decor', 'furniture', 'candle', 'kitchen', 'living', 'interior', 'bedding'],
  },
  {
    label: 'Baby & Kids',
    repeatRate: 0.25,
    keywords: ['baby', 'kids', 'child', 'toy', 'infant', 'toddler', 'parenting'],
  },
  {
    label: 'Sports & Fitness',
    repeatRate: 0.24,
    keywords: ['sport', 'fitness', 'gym', 'yoga', 'cycle', 'run', 'active', 'workout'],
  },
]

const DEFAULT_BENCHMARK: IndustryBenchmark = {
  label: 'DTC Brand',
  repeatRate: 0.22,
  keywords: [],
}

export function detectIndustry(
  categoryFromHooly?: string,
  brandName?: string
): IndustryBenchmark {
  const text = `${categoryFromHooly ?? ''} ${brandName ?? ''}`.toLowerCase()

  for (const benchmark of BENCHMARKS) {
    if (benchmark.keywords.some((kw) => text.includes(kw))) {
      return benchmark
    }
  }

  return DEFAULT_BENCHMARK
}
