// The `monthlyData` resource (Admin-editable) only stores a Korean label like
// '11월' with no year, so it can't be date-filtered directly. This maps the
// *default* chronological sequence (Nov 2025 - Jul 2026) to real calendar
// months by array position, purely for the date-range picker on pages that
// show this resource. If Admin rows are reordered/added beyond this length,
// the extra rows simply aren't date-filterable (always shown).
export const MONTH_CALENDAR = [
  '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07',
];

export function filterByMonthRange(items, startMonth, endMonth) {
  return items.filter((_, i) => {
    const cal = MONTH_CALENDAR[i];
    if (!cal) return true;
    return cal >= startMonth && cal <= endMonth;
  });
}
