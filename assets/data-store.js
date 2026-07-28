const DATA_KEYS = {
  monthly: 'tiktokShopMonthly',
  forecast: 'tiktokShopForecast',
  costItems: 'tiktokShopCostItems',
  productSales: 'tiktokShopProductSales',
  productCosts: 'tiktokShopProductCosts',
  inventory: 'tiktokShopInventory',
  affiliatePlan: 'tiktokShopAffiliatePlan',
  affiliatePlanProducts: 'tiktokShopAffiliatePlanProducts'
};

function hasActualData(m) {
  return (Number(m.revenue) || 0) > 0 || (Number(m.totalCost) || 0) > 0;
}

function loadData(key, defaultData) {
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      return migrateLegacyData(key, JSON.parse(raw), defaultData);
    } catch (e) {
      /* fall through to defaults on corrupt data */
    }
  }
  return JSON.parse(JSON.stringify(defaultData));
}

const LEGACY_MONTH_LABEL_MAP = {
  '11월': '2025-11', '12월': '2025-12', '1월': '2026-01', '2월': '2026-02', '3월': '2026-03',
  '4월': '2026-04', '5월': '2026-05', '6월': '2026-06', '7월': '2026-07'
};

// Historical target-plan defaults, kept only as a fallback for migrating browsers that
// still have the old separate 'tiktokShopMonthlyTargets' key (pre-merge admin schema).
const LEGACY_DEFAULT_MONTHLY_TARGETS = [
  { month: '2026-08', revenue: 27000, adSpend: 40000 },
  { month: '2026-09', revenue: 47000, adSpend: 48000 },
  { month: '2026-10', revenue: 67000, adSpend: 53333 },
  { month: '2026-11', revenue: 100000, adSpend: 60000 },
  { month: '2026-12', revenue: 150000, adSpend: 90000 }
];

function normalizeMonthKey(month) {
  if (LEGACY_MONTH_LABEL_MAP[month]) return LEGACY_MONTH_LABEL_MAP[month];
  return String(month || '').replace('.', '-');
}

function migrateLegacyData(key, data, defaultData) {
  if (key === DATA_KEYS.monthly && Array.isArray(data) && data.length && !Object.prototype.hasOwnProperty.call(data[0], 'targetRevenue')) {
    const actualRows = data.map(item => ({
      month: normalizeMonthKey(item.month),
      revenue: Number(item.revenue) || 0,
      adSpend: Number(item.adSpend) || 0,
      totalCost: Number(item.totalCost) || 0,
      targetRevenue: 0,
      targetAdSpend: 0
    }));

    let legacyTargets = LEGACY_DEFAULT_MONTHLY_TARGETS;
    try {
      const rawTargets = localStorage.getItem('tiktokShopMonthlyTargets');
      if (rawTargets) legacyTargets = JSON.parse(rawTargets);
    } catch (e) { /* keep fallback defaults */ }

    const actualMonths = new Set(actualRows.map(r => r.month));
    const targetRows = legacyTargets
      .map(t => ({
        month: normalizeMonthKey(t.month), revenue: 0, adSpend: 0, totalCost: 0,
        targetRevenue: Number(t.revenue) || 0, targetAdSpend: Number(t.adSpend) || 0
      }))
      .filter(t => !actualMonths.has(t.month));

    const migrated = actualRows.concat(targetRows).sort((a, b) => monthSortValue(a.month) - monthSortValue(b.month));
    localStorage.removeItem('tiktokShopMonthlyTargets');
    saveData(key, migrated);
    return migrated;
  }

  if (
    key === DATA_KEYS.forecast
    && data?.q3?.revenue === 140001
    && data?.q4?.revenue === 233333
    && [-61713, -51330].includes(data?.q3?.profit)
    && [6030, 23337].includes(data?.q4?.profit)
  ) {
    const migrated = JSON.parse(JSON.stringify(defaultData));
    saveData(key, migrated);
    return migrated;
  }

  if (
    key === DATA_KEYS.productCosts
    && Array.isArray(data)
    && data.length
    && !Object.prototype.hasOwnProperty.call(data[0], 'retailPrice')
  ) {
    const migrated = JSON.parse(JSON.stringify(defaultData));
    saveData(key, migrated);
    return migrated;
  }

  return data;
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function resetData(key) {
  localStorage.removeItem(key);
}

function onDataChange(keys, callback) {
  const keyList = Array.isArray(keys) ? keys : [keys];
  window.addEventListener('storage', event => {
    if (keyList.includes(event.key)) callback(event.key);
  });
}

// The 'storage' event only fires in OTHER tabs, and a page restored from the
// browser's back/forward cache re-shows its old DOM without re-running load
// logic. So editing data in Admin, then navigating back to a page that was
// already open, can leave it showing stale values until this fires.
function onPageRestore(callback) {
  window.addEventListener('pageshow', event => {
    if (event.persisted) callback();
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
