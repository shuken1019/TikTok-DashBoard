export const AD_RECOVERY_CURRENT = Object.freeze({
  through: '2026-08-17',
  revenue: 72904.18,
  adSpend: 135103.52,
  balance: -62199.34,
  roi: 0.54,
});

export const AD_RECOVERY_PLAN = Object.freeze([
  { month: '2026-09', revenue: 38400, adCap: 32000, initialBudget: 24000, reserve: 8000, roi: 1.2 },
  { month: '2026-10', revenue: 45000, adCap: 30000, initialBudget: 23000, reserve: 7000, roi: 1.5 },
  { month: '2026-11', revenue: 50400, adCap: 28000, initialBudget: 22000, reserve: 6000, roi: 1.8 },
  { month: '2026-12', revenue: 54600, adCap: 26000, initialBudget: 20000, reserve: 6000, roi: 2.1 },
  { month: '2027-01', revenue: 60000, adCap: 24000, initialBudget: 19000, reserve: 5000, roi: 2.5 },
  { month: '2027-02', revenue: 61600, adCap: 22000, initialBudget: 18000, reserve: 4000, roi: 2.8 },
  { month: '2027-03', revenue: 66000, adCap: 22000, initialBudget: 18000, reserve: 4000, roi: 3.0 },
]);

export function buildAdRecoveryScenario(attainment) {
  let cumulative = AD_RECOVERY_CURRENT.balance;
  let recovery = null;
  const rows = AD_RECOVERY_PLAN.map((item) => {
    const prior = cumulative;
    const realizedRevenue = item.revenue * attainment;
    const monthlyRecovery = realizedRevenue - item.adCap;
    cumulative += monthlyRecovery;
    if (!recovery && prior < 0 && cumulative >= 0 && monthlyRecovery > 0) {
      const [year, month] = item.month.split('-').map(Number);
      const days = new Date(year, month, 0).getDate();
      const day = Math.min(days, Math.max(1, Math.ceil((-prior / monthlyRecovery) * days)));
      recovery = { month: item.month, day, label: `${year}년 ${month}월 ${day}일경` };
    }
    return { ...item, attainment, realizedRevenue, monthlyRecovery, cumulative };
  });
  return { attainment, rows, recovery };
}
