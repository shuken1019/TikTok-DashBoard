// Unified monthly record: actual revenue/adSpend/totalCost for months already reported,
// targetRevenue/targetAdSpend for the 2026.08~2027.12 budget/ROI plan. A month only carries
// one side filled in today (revenue=0 for target-only rows, targetRevenue=0 for actual
// rows) but both sets of fields live on every row so a month can hold real actuals
// AND its original target side-by-side once it's reported (for target-vs-actual compare).
//
// Actual revenue for 2025.11~2026.05 is the settlement export's "Total Revenue" value.
// Each value was cross-checked against both Reports and the Order details row sum in the
// user's monthly finance XLSX files. June Total Revenue is $3,828.00, July
// (2026.07.01~07.29) Total Revenue is $14,137.42, and August MTD
// (2026.08.01~08.07, UTC-7) Total Revenue is $13,052.48. August advertising is
// $35,235.56 through 08-18, but total cost/profit stay null because revenue and ad
// spend have different cutoff dates. adSpend is the REAL daily ad cost from
// "Campaign overview data 20250725 - 20260725.pdf", with July replaced by
// "Campaign overview data 20260701 - 20260727.xlsx", cross-validated at cent precision.
// totalCost = adSpend + non-ad costs (product/seeding/commission/logistics/other from
// defaultCostItems, $13,559 total), prorated across months by the current revenue share.
// Every actual month is a real, deep loss — ad spend alone has exceeded revenue every
// month since Feb.
//
// Target revenue/adSpend (2026.08~2027.12) is the user's
// TikTok_Shop_예산_ROI_플랜_2026-08_2027-12.xlsx plan;
// totalCost/profit for those rows is modeled elsewhere (performance-outlook-detail.html)
// by applying the current non-ad cost ratio to targetRevenue.
//
// Edit in Admin as actuals change or the target plan updates.
const defaultMonthlyData = [
  { month: '2025-11', revenue: 128.50, adSpend: 1745.70, totalCost: 1782.41, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2025-12', revenue: 265.55, adSpend: 1547.71, totalCost: 1623.57, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-01', revenue: 960.67, adSpend: 2991.97, totalCost: 3266.40, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-02', revenue: 1328.74, adSpend: 8017.64, totalCost: 8397.22, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-03', revenue: 8214.87, adSpend: 18839.92, totalCost: 21186.65, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-04', revenue: 11414.39, adSpend: 19333.64, totalCost: 22594.37, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-05', revenue: 7186.05, adSpend: 6637.13, totalCost: 8689.95, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-06', revenue: 3828.00, adSpend: 6739.15, totalCost: 7832.69, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-07', revenue: 14137.42, adSpend: 34164.02, totalCost: 38202.62, targetRevenue: 0, targetAdSpend: 0 },
  { month: '2026-08', revenue: 13052.48, adSpend: 35235.56, totalCost: null, actualThrough: '2026-08-07', adSpendThrough: '2026-08-18', costStatus: 'period-mismatch', targetRevenue: 20000, targetAdSpend: 33333 },
  { month: '2026-09', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 25000, targetAdSpend: 40000 },
  { month: '2026-10', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 30000, targetAdSpend: 40000 },
  { month: '2026-11', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 50000, targetAdSpend: 58800 },
  { month: '2026-12', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 50000, targetAdSpend: 47600 },
  { month: '2027-01', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 55000, targetAdSpend: 47800 },
  { month: '2027-02', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 60000, targetAdSpend: 48000 },
  { month: '2027-03', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 70000, targetAdSpend: 51850 },
  { month: '2027-04', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 90000, targetAdSpend: 60000 },
  { month: '2027-05', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 100000, targetAdSpend: 62500 },
  { month: '2027-06', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 115000, targetAdSpend: 67650 },
  { month: '2027-07', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 125000, targetAdSpend: 69450 },
  { month: '2027-08', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 150000, targetAdSpend: 78950 },
  { month: '2027-09', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 160000, targetAdSpend: 80000 },
  { month: '2027-10', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 175000, targetAdSpend: 83350 },
  { month: '2027-11', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 190000, targetAdSpend: 86350 },
  { month: '2027-12', revenue: 0, adSpend: 0, totalCost: 0, targetRevenue: 200000, targetAdSpend: 86950 }
];
