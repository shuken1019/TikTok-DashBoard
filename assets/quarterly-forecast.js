// 2026 calendar Q3/Q4 forecast derived live from the monthly target plan.
function computeQuarterlyForecast(monthlyData, costItems) {
  // Partial revenue without matching advertising/total-cost data must not change
  // the cost allocation ratio used by the forecast model.
  const actualRows = monthlyData.filter(m => hasActualData(m) && hasCompleteCostData(m));
  // A month can contain partial actuals and its original target at the same time.
  // Select forecast rows by target fields, not by the absence of actual data.
  const targetRows = monthlyData.filter(m => (Number(m.targetRevenue) || 0) > 0 || (Number(m.targetAdSpend) || 0) > 0);
  const totalRevenue = actualRows.reduce((s, m) => s + m.revenue, 0);
  const costItemsTotal = costItems.reduce((s, c) => s + c.value, 0);
  const nonAdRatio = totalRevenue ? costItemsTotal / totalRevenue : 0;

  function sumQuarter(rows) {
    const revenue = rows.reduce((s, m) => s + (Number(m.targetRevenue) || 0), 0);
    const adSpend = rows.reduce((s, m) => s + (Number(m.targetAdSpend) || 0), 0);
    const totalCost = adSpend + revenue * nonAdRatio;
    return { months: rows.map(m => m.month), revenue, adSpend, totalCost, profit: revenue - totalCost };
  }

  const q3Rows = targetRows.filter(m => String(m.month).startsWith('2026-') && [7, 8, 9].includes(Number(String(m.month).slice(5, 7))));
  const q4Rows = targetRows.filter(m => String(m.month).startsWith('2026-') && [10, 11, 12].includes(Number(String(m.month).slice(5, 7))));
  return { nonAdRatio, q3: sumQuarter(q3Rows), q4: sumQuarter(q4Rows) };
}
