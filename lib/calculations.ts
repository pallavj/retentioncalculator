export interface CalcInputs {
  monthlyTraffic: number
  conversionRate: number   // e.g. 0.02
  aov: number
  existingBase: number
  repeatRate: number       // e.g. 0.18
}

export interface CalcResults {
  monthlyOrders: number
  monthlyNewCustomers: number
  monthlyNewRevenue: number
  monthlyRepeatCustomers: number
  monthlyDormantCustomers: number
  monthlyRepeatRevenue: number

  opp1Low: number   // retain new customers better (5%)
  opp1High: number  // retain new customers better (10%)
  opp2Low: number   // revive dormant (0.5%)
  opp2High: number  // revive dormant (1%)
  opp3Low: number   // convert abandoners (5%)
  opp3High: number  // convert abandoners (10%)
  totalLow: number
  totalHigh: number
}

export function calculate(inputs: CalcInputs): CalcResults {
  const { monthlyTraffic, conversionRate, aov, existingBase, repeatRate } = inputs

  const monthlyOrders = Math.round(monthlyTraffic * conversionRate)
  const monthlyNewCustomers = monthlyOrders
  const monthlyNewRevenue = monthlyNewCustomers * aov
  const monthlyRepeatCustomers = Math.round(existingBase * repeatRate)
  const monthlyDormantCustomers = existingBase - monthlyRepeatCustomers
  const monthlyRepeatRevenue = monthlyRepeatCustomers * aov

  // Opp 1: increase repeat rate of new customers by 5–10%
  const opp1Low = Math.round(monthlyNewCustomers * 0.05) * aov
  const opp1High = Math.round(monthlyNewCustomers * 0.10) * aov

  // Opp 2: revive 0.5–1% of dormant customers
  const opp2Low = Math.round(monthlyDormantCustomers * 0.005) * aov
  const opp2High = Math.round(monthlyDormantCustomers * 0.01) * aov

  // Opp 3: convert 5–10% more abandoners (new customer acquisition)
  const opp3Low = Math.round(monthlyNewCustomers * 0.05) * aov
  const opp3High = Math.round(monthlyNewCustomers * 0.10) * aov

  return {
    monthlyOrders,
    monthlyNewCustomers,
    monthlyNewRevenue,
    monthlyRepeatCustomers,
    monthlyDormantCustomers,
    monthlyRepeatRevenue,
    opp1Low,
    opp1High,
    opp2Low,
    opp2High,
    opp3Low,
    opp3High,
    totalLow: opp1Low + opp2Low + opp3Low,
    totalHigh: opp1High + opp2High + opp3High,
  }
}

export function formatCurrency(value: number): string {
  if (value >= 10_00_000) {
    return `₹${(value / 10_00_000).toFixed(1)}L`
  }
  if (value >= 1_000) {
    return `₹${value.toLocaleString('en-IN')}`
  }
  return `₹${value}`
}

export function formatRange(low: number, high: number): string {
  return `${formatCurrency(low)} – ${formatCurrency(high)}`
}
