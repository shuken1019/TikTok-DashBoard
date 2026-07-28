// Unified monthly record: actual revenue/adSpend/totalCost for months already reported,
// targetRevenue/targetAdSpend for the 2026.08~12 MIZON target plan. A month only carries
// one side filled in today (revenue=0 for target-only rows, targetRevenue=0 for actual
// rows) but both sets of fields live on every row so a month can hold real actuals
// AND its original target side-by-side once it's reported (for target-vs-actual compare).
//
// Actual revenue is the real monthly GMV from Shop Analytics_Key metrics_20260724.pdf (see
// assets/shop-analytics-data.js). adSpend is the REAL daily ad cost from
// "Campaign overview data 20250725 - 20260725.pdf", with July replaced by
// "Campaign overview data 20260701 - 20260727.xlsx", cross-validated at cent precision.
// totalCost = adSpend + non-ad costs (product/seeding/commission/logistics/other from
// defaultCostItems, $13,559 total), prorated across months by the latest daily GMV share.
// Every actual month is a real, deep loss — ad spend alone has exceeded revenue every
// month since Feb.
//
// Target revenue/adSpend (2026.08~12) is the user's GMV Max campaign tracker target plan;
// totalCost/profit for those rows is modeled elsewhere (performance-outlook-detail.html)
// by applying the current non-ad cost ratio to targetRevenue.
//
// Edit in Admin as actuals change or the target plan updates.
const defaultMonthlyData = [
  { month: '2025-11', revenue: 197.15, adSpend: 1745.70, totalCost: 1816.11, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2025-12', revenue: 390.1, adSpend: 1547.71, totalCost: 1687.02, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-01', revenue: 845.38, adSpend: 2991.97, totalCost: 3293.88, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-02', revenue: 2088.21, adSpend: 8017.64, totalCost: 8763.39, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-03', revenue: 5975.89, adSpend: 18839.92, totalCost: 20974.06, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-04', revenue: 10463.52, adSpend: 19333.64, totalCost: 23070.43, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-05', revenue: 1972.69, adSpend: 6637.13, totalCost: 7341.63, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-06', revenue: 2446.03, adSpend: 6739.15, totalCost: 7612.69, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-07', revenue: 9861.16, adSpend: 34164.02, totalCost: 39016.67, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-08', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 27000, targetAdSpend: 40000 },
  { month: '2026-09', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 47000, targetAdSpend: 48000 },
  { month: '2026-10', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 67000, targetAdSpend: 53333 },
  { month: '2026-11', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 100000, targetAdSpend: 60000 },
  { month: '2026-12', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 150000, targetAdSpend: 90000 }
];
