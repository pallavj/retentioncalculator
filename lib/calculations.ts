export interface CalcInputs {
  monthlyTraffic: number
  conversionRate: number   // e.g. 0.02
  aov: number
  existingBase: number
  repeatRate: number       // e.g. 0.22
}

export interface CalcResults {
  monthlyTotalRevenue: number
  monthlyRepeatRevenue: number
  monthlyNewRevenue: number
  monthlyNewCustomers: number
  monthlyRepeatCustomers: number
  monthlyAbandoners: number

  opp1Low: number   // retain new customers better (5% → 10%)
  opp1High: number
  opp2Low: number   // revive customer base (CR/4 → CR/2)
  opp2High: number
  opp3Low: number   // convert abandoners (CR/4 → CR/2)
  opp3High: number
  totalLow: number
  totalHigh: number
}

export function calculate(inputs: CalcInputs): CalcResults {
  const { monthlyTraffic, conversionRate, aov, existingBase, repeatRate } = inputs

  // Orders & customers
  const monthlyTotalOrders = Math.round(monthlyTraffic * conversionRate)
  const monthlyRepeatCustomers = Math.round(monthlyTotalOrders * repeatRate)
  const monthlyNewCustomers = monthlyTotalOrders - monthlyRepeatCustomers
  const monthlyAbandoners = Math.round(monthlyTraffic * (1 - conversionRate))

  // Revenue — sessions × CR × AOV = total; split by repeat rate
  const monthlyTotalRevenue = monthlyTotalOrders * aov
  const monthlyRepeatRevenue = Math.round(monthlyTotalRevenue * repeatRate)
  const monthlyNewRevenue = monthlyTotalRevenue - monthlyRepeatRevenue

  // Opp 1: retain new customers — 5–10% of new customers come back
  const opp1Low = Math.round(monthlyNewCustomers * 0.05) * aov
  const opp1High = Math.round(monthlyNewCustomers * 0.10) * aov

  // Opp 2: revive customer base — at CR/4 to CR/2 re-engagement rate
  const opp2Low = Math.round(existingBase * (conversionRate * 0.25)) * aov
  const opp2High = Math.round(existingBase * (conversionRate * 0.5)) * aov

  // Opp 3: convert abandoners — at CR/4 to CR/2 recovery rate
  const opp3Low = Math.round(monthlyAbandoners * (conversionRate * 0.25)) * aov
  const opp3High = Math.round(monthlyAbandoners * (conversionRate * 0.5)) * aov

  return {
    monthlyTotalRevenue,
    monthlyRepeatRevenue,
    monthlyNewRevenue,
    monthlyNewCustomers,
    monthlyRepeatCustomers,
    monthlyAbandoners,
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
