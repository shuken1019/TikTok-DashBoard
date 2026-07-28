// `monthlyData[].month` is a real "YYYY-MM" value (see assets/monthly-data.js), so date-range
// filtering can compare it directly instead of relying on array position. Callers derive their
// own min/max bounds from the loaded (and typically hasActualData-filtered) monthlyData array.
function filterByMonthRange(items, startMonth, endMonth) {
  return items.filter(item => item.month >= startMonth && item.month <= endMonth);
}
