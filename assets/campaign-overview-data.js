// Monthly aggregates through 2026-06 reconcile to the merged daily export
// "Campaign overview data 20250703 - 20260703.xlsx".
// 2026-07 is replaced by "Campaign overview data 20260701 - 20260727.xlsx";
// Cost uses the official Overview card total ($34,164.02), $0.88 above the row sum.
// Source columns: By Day, Cost, SKU orders (Current shop), Cost per order,
// Gross revenue (Current shop), ROI (Current shop), Currency.
// ROI shown in the dashboard is recomputed as grossRevenue / cost over the selected period.
const campaignOverviewMonthly = [
  { month: '2025-07', cost: 0.00, orders: 0, grossRevenue: 0.00 },
  { month: '2025-08', cost: 0.00, orders: 0, grossRevenue: 0.00 },
  { month: '2025-09', cost: 20.20, orders: 1, grossRevenue: 44.00 },
  { month: '2025-10', cost: 443.89, orders: 6, grossRevenue: 139.00 },
  { month: '2025-11', cost: 1745.70, orders: 7, grossRevenue: 183.30 },
  { month: '2025-12', cost: 1547.71, orders: 15, grossRevenue: 433.87 },
  { month: '2026-01', cost: 2991.97, orders: 60, grossRevenue: 1251.56 },
  { month: '2026-02', cost: 8017.64, orders: 145, grossRevenue: 3082.06 },
  { month: '2026-03', cost: 18839.92, orders: 430, grossRevenue: 9462.20 },
  { month: '2026-04', cost: 19333.64, orders: 672, grossRevenue: 14380.68 },
  { month: '2026-05', cost: 6637.13, orders: 165, grossRevenue: 3531.48 },
  { month: '2026-06', cost: 6739.15, orders: 155, grossRevenue: 3540.47 },
  { month: '2026-07', cost: 34164.02, orders: 1068, grossRevenue: 19210.96 }
].map(item => ({
  ...item,
  cpa: item.orders ? item.cost / item.orders : 0,
  roi: item.cost ? item.grossRevenue / item.cost : 0
}));

const campaignOverviewFirstMonth = campaignOverviewMonthly[0].month;
const campaignOverviewLastMonth = campaignOverviewMonthly[campaignOverviewMonthly.length - 1].month;
const campaignOverviewDataAsOf = '2026-07-27';
