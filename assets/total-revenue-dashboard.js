// Date-grain campaign dashboard built only from the reviewed Campaign Overview export.
let forecastData = loadData(DATA_KEYS.forecast, defaultForecastData);
let startDate = '2026-07-01';
let endDate = campaignDailyLastDate;
let revenueAdChart, profitChart, summaryTrendChart, forecastChart;

const campaignDailyMap = new Map(campaignOverviewDaily.map(item => [item.date, item]));
const financialFirstDate = campaignDailyFirstDate;
const financialLastDate = campaignDailyLastDate;

function formatOfficialCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftIsoDate(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalIsoDate(date);
}

function daysBetweenInclusive(start, end) {
  return Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000) + 1;
}

function buildFinancialRows(rangeStart, rangeEnd) {
  const rows = [];
  for (let cursor = rangeStart; cursor <= rangeEnd; cursor = shiftIsoDate(cursor, 1)) {
    const campaign = campaignDailyMap.get(cursor);
    rows.push({
      date: cursor,
      cost: Number(campaign?.cost || 0),
      grossRevenue: Number(campaign?.grossRevenue || 0),
      orders: Number(campaign?.orders || 0),
    });
  }
  return rows;
}

function sumFinancialRows(rows) {
  return rows.reduce((total, item) => ({
    cost: total.cost + item.cost,
    grossRevenue: total.grossRevenue + item.grossRevenue,
    orders: total.orders + item.orders,
  }), { cost: 0, grossRevenue: 0, orders: 0 });
}

function groupRowsForChart(rows) {
  if (rows.length <= 45) {
    return rows.map(item => ({ ...item, label: item.date.slice(5).replace('-', '/') }));
  }
  const grouped = new Map();
  rows.forEach(item => {
    const key = item.date.slice(0, 7);
    if (!grouped.has(key)) {
      grouped.set(key, { label: key, cost: 0, grossRevenue: 0, orders: 0 });
    }
    const bucket = grouped.get(key);
    bucket.cost += item.cost;
    bucket.grossRevenue += item.grossRevenue;
    bucket.orders += item.orders;
  });
  return [...grouped.values()];
}

function percentChange(current, previous) {
  return previous ? ((current - previous) / Math.abs(previous)) * 100 : null;
}

function signedPercent(value) {
  if (value === null || !Number.isFinite(value)) return '비교 불가';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function selectedRows() {
  return buildFinancialRows(startDate, endDate);
}

function buildAutoInsight() {
  const rows = selectedRows();
  const totals = sumFinancialRows(rows);
  const revenueGap = totals.grossRevenue - totals.cost;
  const costMultiple = totals.grossRevenue ? totals.cost / totals.grossRevenue : 0;
  const campaignRoi = totals.cost ? totals.grossRevenue / totals.cost : 0;
  const selectedDays = rows.length;
  const previousEnd = shiftIsoDate(startDate, -1);
  const previousStart = shiftIsoDate(previousEnd, -(selectedDays - 1));
  const previous = previousEnd >= financialFirstDate
    ? sumFinancialRows(buildFinancialRows(previousStart < financialFirstDate ? financialFirstDate : previousStart, previousEnd))
    : null;
  const revenueGrowth = previous ? percentChange(totals.grossRevenue, previous.grossRevenue) : null;
  const adGrowth = previous ? percentChange(totals.cost, previous.cost) : null;

  const headline = campaignRoi < 1
    ? '광고비 대비 캠페인 귀속 매출이 낮습니다.'
    : '캠페인 귀속 매출이 광고비보다 높습니다.';
  const change = previous
    ? `직전 동일 기간 대비 Gross revenue ${signedPercent(revenueGrowth)} · Cost ${signedPercent(adGrowth)}`
    : '이전 동일 길이의 비교 기간이 없어 증감률을 표시하지 않습니다.';
  let action = '선택 기간을 바꾸면 같은 날짜 기준으로 우선 조치를 다시 계산합니다.';
  if (totals.cost && campaignRoi < 1) {
    action = `광고비 $1당 캠페인 귀속 매출 $${campaignRoi.toFixed(2)}입니다. ROI 1.0x 미만 캠페인의 예산 조정이 우선입니다.`;
  }
  return { headline, revenueGap, costMultiple, campaignRoi, change, action, status: campaignRoi >= 1 ? 'good' : campaignRoi >= 0.8 ? 'warn' : 'bad' };
}

function renderAutoInsight() {
  const insight = buildAutoInsight();
  document.getElementById('autoInsightHeadline').textContent = insight.headline;
  document.getElementById('autoInsightProfit').textContent = formatOfficialCurrency(insight.revenueGap);
  document.getElementById('autoInsightProfit').className = insight.revenueGap >= 0 ? 'positive' : 'negative';
  document.getElementById('autoInsightCostRatio').textContent = `${insight.costMultiple.toFixed(2)}x`;
  document.getElementById('autoInsightRoi').textContent = `${insight.campaignRoi.toFixed(2)}x`;
  document.getElementById('autoInsightChange').textContent = insight.change;
  document.getElementById('autoInsightAction').textContent = insight.action;
  document.getElementById('autoInsightStatus').className = `badge ${insight.status}`;
}

function renderKPIs() {
  const totals = sumFinancialRows(selectedRows());
  const selectedDays = daysBetweenInclusive(startDate, endDate);
  const cpa = totals.orders ? totals.cost / totals.orders : 0;
  const roi = totals.cost ? totals.grossRevenue / totals.cost : 0;
  document.getElementById('kpiRevenue').textContent = formatOfficialCurrency(totals.grossRevenue);
  document.getElementById('kpiAdSpend').textContent = formatOfficialCurrency(totals.cost);
  document.getElementById('kpiTotalCost').textContent = `${totals.orders.toLocaleString('en-US')}건`;
  document.getElementById('kpiBreakEven').textContent = `${roi.toFixed(2)}x`;
  document.getElementById('kpiRevenueDesc').textContent = `${startDate} ~ ${endDate} Campaign Gross revenue`;
  document.getElementById('kpiAdSpendDesc').textContent = `${startDate} ~ ${endDate} Campaign Cost`;
  document.getElementById('kpiTotalCostDesc').textContent = `Cost per order ${formatOfficialCurrency(cpa)}`;
  document.getElementById('q3Revenue').textContent = formatCurrency(forecastData.q3.revenue);
  document.getElementById('q4Revenue').textContent = formatCurrency(forecastData.q4.revenue);
  document.getElementById('q3Profit').textContent = formatCurrency(forecastData.q3.profit);
  document.getElementById('q4Profit').textContent = formatCurrency(forecastData.q4.profit);
  const reconciliationNote = startDate <= '2026-07-27' && endDate >= '2026-07-27'
    ? ' · Cost 일별 합계에 공식 총계 보정 +$0.88 포함'
    : '';
  document.getElementById('financialRangeLabel').textContent = `${startDate} ~ ${endDate} · ${selectedDays}일 · Campaign Overview 기준${reconciliationNote}`;
  renderAutoInsight();
}

function chartOptions() {
  return {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top' },
      tooltip: { callbacks: { label: context => ` ${context.dataset.label}: ${formatOfficialCurrency(Number(context.raw || 0))}` } },
    },
    scales: { y: { beginAtZero: true, ticks: { callback: value => formatOfficialCurrency(Number(value)) } } },
  };
}

function createCharts() {
  revenueAdChart = new Chart(document.getElementById('revenueAdChart'), { type: 'bar', data: { labels: [], datasets: [
    { label: 'Gross revenue', data: [], backgroundColor: '#2563eb' },
    { label: 'Cost', data: [], backgroundColor: '#f59e0b' },
  ] }, options: chartOptions() });
  profitChart = new Chart(document.getElementById('profitChart'), { type: 'line', data: { labels: [], datasets: [
    { label: 'Campaign ROI', data: [], borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.12)', fill: true, tension: 0, pointRadius: 4 },
  ] }, options: {
    ...chartOptions(),
    plugins: {
      legend: { position: 'top' },
      tooltip: { callbacks: { label: context => ` Campaign ROI: ${Number(context.raw || 0).toFixed(2)}x` } },
    },
    scales: { y: { beginAtZero: true, ticks: { callback: value => `${Number(value).toFixed(2)}x` } } },
  } });
  summaryTrendChart = new Chart(document.getElementById('summaryTrendChart'), { data: { labels: [], datasets: [
    { type: 'bar', label: 'Gross revenue', data: [], backgroundColor: '#2563eb' },
    { type: 'bar', label: 'Cost', data: [], backgroundColor: '#f59e0b' },
  ] }, options: chartOptions() });
  forecastChart = new Chart(document.getElementById('forecastChart'), { type: 'bar', data: {
    labels: ['3분기', '4분기'],
    datasets: [
      { label: '매출', data: [], backgroundColor: '#2563eb' },
      { label: '광고비', data: [], backgroundColor: '#f59e0b' },
      { label: '순이익', data: [], backgroundColor: '#14b8a6' },
    ],
  }, options: chartOptions() });
}

function refreshAll() {
  forecastData = loadData(DATA_KEYS.forecast, defaultForecastData);
  renderKPIs();
  const chartRows = groupRowsForChart(selectedRows());
  const labels = chartRows.map(item => item.label);
  const granularity = chartRows.length === selectedRows().length ? '일별' : '월별';
  document.getElementById('revenueAdRange').textContent = `${startDate} ~ ${endDate} · ${granularity} Campaign Overview 자동 집계`;
  document.getElementById('profitRange').textContent = `${startDate} ~ ${endDate} · ${granularity} Gross revenue ÷ Cost`;
  document.getElementById('campaignOverviewCard').dataset.href = `campaign-performance-detail.html?start=${startDate}&end=${endDate}`;
  document.getElementById('campaignRoiCard').dataset.href = `campaign-performance-detail.html?start=${startDate}&end=${endDate}`;

  revenueAdChart.data.labels = labels;
  revenueAdChart.data.datasets[0].data = chartRows.map(item => item.grossRevenue);
  revenueAdChart.data.datasets[1].data = chartRows.map(item => item.cost);
  revenueAdChart.update();

  profitChart.data.labels = labels;
  profitChart.data.datasets[0].data = chartRows.map(item => item.cost ? item.grossRevenue / item.cost : 0);
  profitChart.update();

  summaryTrendChart.data.labels = labels;
  summaryTrendChart.data.datasets[0].data = chartRows.map(item => item.grossRevenue);
  summaryTrendChart.data.datasets[1].data = chartRows.map(item => item.cost);
  summaryTrendChart.update();

  forecastChart.data.datasets[0].data = [forecastData.q3.revenue, forecastData.q4.revenue];
  forecastChart.data.datasets[1].data = [forecastData.q3.adSpend, forecastData.q4.adSpend];
  forecastChart.data.datasets[2].data = [forecastData.q3.profit, forecastData.q4.profit];
  forecastChart.update();
}

function initDateRangeInputs() {
  const startInput = document.getElementById('startDateInput');
  const endInput = document.getElementById('endDateInput');
  startInput.min = financialFirstDate;
  startInput.max = financialLastDate;
  endInput.min = financialFirstDate;
  endInput.max = financialLastDate;
  startInput.value = startDate;
  endInput.value = endDate;

  startInput.addEventListener('change', () => {
    startDate = startInput.value;
    if (startDate > endDate) {
      endDate = startDate;
      endInput.value = endDate;
    }
    refreshAll();
  });
  endInput.addEventListener('change', () => {
    endDate = endInput.value;
    if (endDate < startDate) {
      startDate = endDate;
      startInput.value = startDate;
    }
    refreshAll();
  });
  document.getElementById('last7DaysBtn').addEventListener('click', () => {
    endDate = financialLastDate;
    startDate = shiftIsoDate(endDate, -6);
    startInput.value = startDate;
    endInput.value = endDate;
    refreshAll();
  });
  document.getElementById('resetDateRangeBtn').addEventListener('click', () => {
    startDate = financialFirstDate;
    endDate = financialLastDate;
    startInput.value = startDate;
    endInput.value = endDate;
    refreshAll();
  });
}

createCharts();
initDateRangeInputs();
refreshAll();
onDataChange([DATA_KEYS.forecast], refreshAll);
onPageRestore(refreshAll);
