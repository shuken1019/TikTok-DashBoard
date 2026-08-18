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

function hasMetricData(item, field) {
  const value = item ? item[field] : null;
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

function hasCompleteCostData(item) {
  return hasMetricData(item, 'adSpend') && hasMetricData(item, 'totalCost') && item.costStatus !== 'missing';
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
  { month: '2026-08', revenue: 20000, adSpend: 33333 },
  { month: '2026-09', revenue: 25000, adSpend: 40000 },
  { month: '2026-10', revenue: 30000, adSpend: 40000 },
  { month: '2026-11', revenue: 50000, adSpend: 58800 },
  { month: '2026-12', revenue: 50000, adSpend: 47600 },
  { month: '2027-01', revenue: 55000, adSpend: 47800 },
  { month: '2027-02', revenue: 60000, adSpend: 48000 },
  { month: '2027-03', revenue: 70000, adSpend: 51850 },
  { month: '2027-04', revenue: 90000, adSpend: 60000 },
  { month: '2027-05', revenue: 100000, adSpend: 62500 },
  { month: '2027-06', revenue: 115000, adSpend: 67650 },
  { month: '2027-07', revenue: 125000, adSpend: 69450 },
  { month: '2027-08', revenue: 150000, adSpend: 78950 },
  { month: '2027-09', revenue: 160000, adSpend: 80000 },
  { month: '2027-10', revenue: 175000, adSpend: 83350 },
  { month: '2027-11', revenue: 190000, adSpend: 86350 },
  { month: '2027-12', revenue: 200000, adSpend: 86950 }
];

const PREVIOUS_EMBEDDED_MONTHLY_TARGETS = {
  '2026-08': [27000, 40000], '2026-09': [47000, 48000],
  '2026-10': [67000, 53333], '2026-11': [100000, 60000],
  '2026-12': [150000, 90000]
};

function normalizeMonthKey(month) {
  if (LEGACY_MONTH_LABEL_MAP[month]) return LEGACY_MONTH_LABEL_MAP[month];
  return String(month || '').replace('.', '-');
}

function migrateLegacyData(key, data, defaultData) {
  // Replace only the known previous embedded monthly defaults. This preserves genuine
  // Admin edits while ensuring browsers that cached the old Shop Analytics GMV values
  // receive the newly verified settlement Total Revenue values and recalculated costs.
  if (key === DATA_KEYS.monthly && Array.isArray(data)) {
    const cachedAugust = data.find(item => normalizeMonthKey(item.month) === '2026-08');
    const isPriorAugustDefault = cachedAugust
      && Math.abs((Number(cachedAugust.revenue) || 0) - 13052.48) < 0.01
      && (
        !hasMetricData(cachedAugust, 'adSpend')
        || (
          Math.abs((Number(cachedAugust.adSpend) || 0) - 35235.56) < 0.01
          && (!cachedAugust.actualThrough || cachedAugust.actualThrough === '2026-08-07')
        )
      );
    if (isPriorAugustDefault) {
      const freshAugust = defaultData.find(item => normalizeMonthKey(item.month) === '2026-08');
      if (freshAugust) {
        const migrated = data.map(item => normalizeMonthKey(item.month) === '2026-08'
          ? { ...item, ...JSON.parse(JSON.stringify(freshAugust)) }
          : item);
        saveData(key, migrated);
        return migrated;
      }
    }

    const cachedTargets = data.filter(item => !hasActualData(item) && ((Number(item.targetRevenue) || 0) > 0 || (Number(item.targetAdSpend) || 0) > 0));
    const isPreviousTargetPlan = cachedTargets.length === 5 && cachedTargets.every(item => {
      const expected = PREVIOUS_EMBEDDED_MONTHLY_TARGETS[normalizeMonthKey(item.month)];
      return expected
        && Math.abs((Number(item.targetRevenue) || 0) - expected[0]) < 0.01
        && Math.abs((Number(item.targetAdSpend) || 0) - expected[1]) < 0.01;
    });
    if (isPreviousTargetPlan) {
      const actual = data.filter(hasActualData);
      const freshTargets = defaultData.filter(item => !hasActualData(item));
      const migrated = actual.concat(freshTargets).sort((a, b) => monthSortValue(a.month) - monthSortValue(b.month));
      saveData(key, migrated);
      return migrated;
    }

    const knownRevenueRevisions = [
      {
        '2025-11': 128.5, '2025-12': 265.55, '2026-01': 960.67,
        '2026-02': 1328.74, '2026-03': 8214.87, '2026-04': 11414.39,
        '2026-05': 7186.05, '2026-06': 3828.00, '2026-07': 14137.42
      },
      {
        '2025-11': 197.15, '2025-12': 390.1, '2026-01': 845.38,
        '2026-02': 2088.21, '2026-03': 5975.89, '2026-04': 10463.52,
        '2026-05': 1972.69, '2026-06': 2446.03, '2026-07': 9861.16
      },
      {
        '2025-11': 128.5, '2025-12': 265.55, '2026-01': 960.67,
        '2026-02': 1328.74, '2026-03': 8214.87, '2026-04': 11414.39,
        '2026-05': 7186.05, '2026-06': 2446.03, '2026-07': 9861.16
      },
      {
        '2025-11': 128.5, '2025-12': 265.55, '2026-01': 960.67,
        '2026-02': 1328.74, '2026-03': 8214.87, '2026-04': 11414.39,
        '2026-05': 7186.05, '2026-06': 2446.03, '2026-07': 14137.42
      }
    ];
    const actualRows = data.filter(item => hasActualData(item));
    const isKnownOldDefault = actualRows.length >= 9 && knownRevenueRevisions.some(revision =>
      actualRows.every(item => {
        const month = normalizeMonthKey(item.month);
        return Object.prototype.hasOwnProperty.call(revision, month)
          && Math.abs((Number(item.revenue) || 0) - revision[month]) < 0.01;
      })
    );
    if (isKnownOldDefault) {
      const verifiedByMonth = Object.fromEntries(
        defaultData.filter(item => hasActualData(item)).map(item => [normalizeMonthKey(item.month), item])
      );
      const migratedRows = data.map(item => {
        const replacement = verifiedByMonth[normalizeMonthKey(item.month)];
        return replacement ? { ...item, ...replacement } : item;
      });
      const existingMonths = new Set(migratedRows.map(item => normalizeMonthKey(item.month)));
      const missingVerifiedRows = defaultData.filter(item => hasActualData(item) && !existingMonths.has(normalizeMonthKey(item.month)));
      const migrated = migratedRows
        .concat(missingVerifiedRows.map(item => JSON.parse(JSON.stringify(item))))
        .sort((a, b) => monthSortValue(a.month) - monthSortValue(b.month));
      saveData(key, migrated);
      return migrated;
    }
  }

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
    && (
      (data?.q3?.revenue === 140001 && data?.q4?.revenue === 233333
        && [-61713, -51330].includes(data?.q3?.profit)
        && [6030, 23337].includes(data?.q4?.profit))
      || (data?.q3?.revenue === 141000 && data?.q4?.revenue === 250000
        && [[-56169, 1001], [-46064, 18917], [-41820, 26441], [-40612, 28583]].some(([q3, q4]) => data?.q3?.profit === q3 && data?.q4?.profit === q4))
    )
  ) {
    const migrated = JSON.parse(JSON.stringify(defaultData));
    saveData(key, migrated);
    return migrated;
  }

  if (key === DATA_KEYS.affiliatePlan && Array.isArray(data)) {
    const oldPlan = {
      '2026-08': [27000, 40000], '2026-09': [47000, 48000],
      '2026-10': [67000, 53333], '2026-11': [100000, 60000],
      '2026-12': [150000, 90000]
    };
    const isOldPlan = data.length === 5 && data.every(item => {
      const expected = oldPlan[normalizeMonthKey(item.month)];
      return expected
        && Math.abs((Number(item.revenueGoal) || 0) - expected[0]) < 0.01
        && Math.abs((Number(item.adBudget) || 0) - expected[1]) < 0.01;
    });
    if (isOldPlan) {
      const migrated = JSON.parse(JSON.stringify(defaultData));
      saveData(key, migrated);
      return migrated;
    }
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

  if (key === DATA_KEYS.productCosts && Array.isArray(data)) {
    const oldBundle = data.find(item => String(item.name || '').startsWith('Collagen Booster Set'));
    const isPreviousDefault = oldBundle
      && Math.abs((Number(oldBundle.salePrice) || 0) - 38.99) < 0.001
      && !Object.prototype.hasOwnProperty.call(oldBundle, 'maxDiscount');
    if (isPreviousDefault) {
      const migrated = JSON.parse(JSON.stringify(defaultData));
      saveData(key, migrated);
      return migrated;
    }
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
