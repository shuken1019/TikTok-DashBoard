// MIZON analysis report target plan: Q3 = Aug+Sep+Oct targets
// (revenue $27,000/$47,000/$67,000, ad budget $40,000/$48,000/$53,333), Q4 = Nov+Dec
// targets (revenue $100,000/$150,000, ad budget $60,000/$90,000). Profit is a provisional
// model: revenue - ad budget - non-ad costs, allocated at the current configured non-ad
// cost ratio (39.60%). December's $150,000/$90,000 is the report's review estimate that
// replaces an anomalous source value, so it must be reconfirmed before executive use.
const defaultForecastData = {
  q3: { revenue: 141000, adSpend: 141333, profit: -56169 },
  q4: { revenue: 250000, adSpend: 150000, profit: 1001 }
};
