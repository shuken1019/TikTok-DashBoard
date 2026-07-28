// Q3/Q4 forecast, derived live from monthlyData's target rows (2026.08~12) instead of
// being entered separately. Q3 = the first 3 target-only rows in date order, Q4 = the
// next 2 — matches performance-outlook-detail.html's math exactly (verified: revenue
// $141,000/$250,000, adSpend $141,333/$150,000, profit -$56,169/$1,001 for the
// current 2026.08~12 target plan).
function computeQuarterlyForecast(monthlyData, costItems) {
  const actualRows = monthlyData.filter(hasActualData);
  const targetRows = monthlyData.filter(m => !hasActualData(m));
  const totalRevenue = actualRows.reduce((s, m) => s + m.revenue, 0);
  const costItemsTotal = costItems.reduce((s, c) => s + c.value, 0);
  const nonAdRatio = totalRevenue ? costItemsTotal / totalRevenue : 0;

  function sumQuarter(rows) {
    const revenue = rows.reduce((s, m) => s + (Number(m.targetRevenue) || 0), 0);
    const adSpend = rows.reduce((s, m) => s + (Number(m.targetAdSpend) || 0), 0);
    const totalCost = adSpend + revenue * nonAdRatio;
    return { months: rows.map(m => m.month), revenue, adSpend, totalCost, profit: revenue - totalCost };
  }

  return { nonAdRatio, q3: sumQuarter(targetRows.slice(0, 3)), q4: sumQuarter(targetRows.slice(3, 5)) };
}
