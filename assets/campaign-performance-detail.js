let detailStartDate = '2026-07-01';
let detailEndDate = campaignDailyLastDate;
let detailRevenueCostChart;
let detailRoiChart;
let detailModalChart;

function detailCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function detailShiftDate(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function detailRows() {
  return campaignOverviewDaily.filter(item => item.date >= detailStartDate && item.date <= detailEndDate);
}

function detailTotals(rows) {
  return rows.reduce((total, item) => ({
    cost: total.cost + item.cost,
    revenue: total.revenue + item.grossRevenue,
    orders: total.orders + item.orders,
  }), { cost: 0, revenue: 0, orders: 0 });
}

function detailChartRows(rows) {
  if (rows.length <= 45) return rows.map(item => ({ ...item, label: item.date.slice(5).replace('-', '/') }));
  const grouped = new Map();
  rows.forEach(item => {
    const key = item.date.slice(0, 7);
    if (!grouped.has(key)) grouped.set(key, { label: key, cost: 0, grossRevenue: 0, orders: 0 });
    const bucket = grouped.get(key);
    bucket.cost += item.cost;
    bucket.grossRevenue += item.grossRevenue;
    bucket.orders += item.orders;
  });
  return [...grouped.values()];
}

function renderCampaignDetail() {
  const rows = detailRows();
  const totals = detailTotals(rows);
  const cpa = totals.orders ? totals.cost / totals.orders : 0;
  const roi = totals.cost ? totals.revenue / totals.cost : 0;
  const includesAdjustment = detailStartDate <= '2026-07-27' && detailEndDate >= '2026-07-27';

  document.getElementById('detailRevenue').textContent = detailCurrency(totals.revenue);
  document.getElementById('detailCost').textContent = detailCurrency(totals.cost);
  document.getElementById('detailOrders').textContent = `${totals.orders.toLocaleString('en-US')}건`;
  document.getElementById('detailCpa').textContent = `Cost per order ${detailCurrency(cpa)}`;
  document.getElementById('detailRoi').textContent = `${roi.toFixed(2)}x`;
  document.getElementById('detailRangeNote').textContent =
    `${detailStartDate} ~ ${detailEndDate} · ${rows.length}일${includesAdjustment ? ' · 공식 Cost 총계 보정 +$0.88 포함' : ''}`;

  const chartRows = detailChartRows(rows);
  detailRevenueCostChart.data.labels = chartRows.map(item => item.label);
  detailRevenueCostChart.data.datasets[0].data = chartRows.map(item => item.grossRevenue);
  detailRevenueCostChart.data.datasets[1].data = chartRows.map(item => item.cost);
  detailRevenueCostChart.update();

  detailRoiChart.data.labels = chartRows.map(item => item.label);
  detailRoiChart.data.datasets[0].data = chartRows.map(item => item.cost ? item.grossRevenue / item.cost : 0);
  detailRoiChart.update();

  document.querySelector('#campaignDetailTable tbody').innerHTML = rows.map(item => {
    const itemCpa = item.orders ? item.cost / item.orders : 0;
    const itemRoi = item.cost ? item.grossRevenue / item.cost : 0;
    const costTrace = item.overviewAdjustment
      ? ` title="XLSX 원본 ${detailCurrency(item.sourceCost)} + 공식 총계 차이 ${detailCurrency(item.overviewAdjustment)}"`
      : '';
    const adjustmentMark = item.overviewAdjustment ? ' <strong aria-label="공식 총계 보정">*</strong>' : '';
    return `<tr><td>${item.date}</td><td${costTrace}>${detailCurrency(item.cost)}${adjustmentMark}</td><td>${detailCurrency(item.grossRevenue)}</td><td>${item.orders.toLocaleString('en-US')}건</td><td>${detailCurrency(itemCpa)}</td><td>${itemRoi.toFixed(2)}x</td></tr>`;
  }).join('');
}

function createCampaignDetailCharts() {
  const currencyOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label(context) {
            return ` ${context.dataset.label}: ${detailCurrency(Number(context.raw || 0))}`;
          },
        },
      },
    },
    scales: { y: { beginAtZero: true, ticks: { callback: value => detailCurrency(Number(value)) } } },
  };
  detailRevenueCostChart = new Chart(document.getElementById('detailRevenueCostChart'), {
    type: 'bar',
    data: { labels: [], datasets: [
      { label: 'Gross revenue', data: [], backgroundColor: '#2563eb' },
      { label: 'Cost', data: [], backgroundColor: '#f59e0b' },
    ] },
    options: currencyOptions,
  });
  detailRoiChart = new Chart(document.getElementById('detailRoiChart'), {
    type: 'line',
    data: { labels: [], datasets: [
      { label: 'Campaign ROI', data: [], borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,.12)', fill: true, tension: 0, pointRadius: 4 },
    ] },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label(context) {
              return ` Campaign ROI: ${Number(context.raw || 0).toFixed(2)}x`;
            },
          },
        },
      },
      scales: { y: { beginAtZero: true, ticks: { callback: value => `${Number(value).toFixed(2)}x` } } },
    },
  });
}

function openDetailChartModal(kind) {
  const modal = document.getElementById('chartModal');
  const rows = detailChartRows(detailRows());
  const isRoi = kind === 'roi';
  document.getElementById('chartModalTitle').textContent = isRoi ? 'Campaign ROI 추이' : 'Gross revenue vs Cost';
  document.getElementById('chartModalSubtitle').textContent =
    `${detailStartDate} ~ ${detailEndDate} · ${rows.length <= 45 ? '일별' : '월별'} Campaign Overview`;

  if (detailModalChart) detailModalChart.destroy();
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
  };
  detailModalChart = new Chart(document.getElementById('chartModalCanvas'), isRoi ? {
    type: 'line',
    data: {
      labels: rows.map(item => item.label),
      datasets: [{
        label: 'Campaign ROI',
        data: rows.map(item => item.cost ? item.grossRevenue / item.cost : 0),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,.12)',
        fill: true,
        tension: 0,
        pointRadius: 5,
        pointHoverRadius: 8,
      }],
    },
    options: {
      ...commonOptions,
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: context => ` Campaign ROI: ${Number(context.raw || 0).toFixed(2)}x` } },
      },
      scales: { y: { beginAtZero: true, ticks: { callback: value => `${Number(value).toFixed(2)}x` } } },
    },
  } : {
    type: 'bar',
    data: {
      labels: rows.map(item => item.label),
      datasets: [
        { label: 'Gross revenue', data: rows.map(item => item.grossRevenue), backgroundColor: '#2563eb' },
        { label: 'Cost', data: rows.map(item => item.cost), backgroundColor: '#f59e0b' },
      ],
    },
    options: {
      ...commonOptions,
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: context => ` ${context.dataset.label}: ${detailCurrency(Number(context.raw || 0))}` } },
      },
      scales: { y: { beginAtZero: true, ticks: { callback: value => detailCurrency(Number(value)) } } },
    },
  });
  modal.showModal();
}

function initDetailChartModal() {
  const modal = document.getElementById('chartModal');
  document.getElementById('overview').addEventListener('click', () => openDetailChartModal('overview'));
  document.getElementById('roi').addEventListener('click', () => openDetailChartModal('roi'));
  document.querySelectorAll('.expandable-chart').forEach(card => {
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDetailChartModal(card.id);
      }
    });
  });
  document.getElementById('chartModalClose').addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => {
    if (event.target === modal) modal.close();
  });
  modal.addEventListener('close', () => {
    if (detailModalChart) {
      detailModalChart.destroy();
      detailModalChart = null;
    }
  });
  const requestedChart = new URLSearchParams(location.search).get('expand');
  if (requestedChart === 'overview' || requestedChart === 'roi') {
    requestAnimationFrame(() => openDetailChartModal(requestedChart));
  }
}

function initCampaignDetailFilters() {
  const params = new URLSearchParams(location.search);
  const requestedStart = params.get('start');
  const requestedEnd = params.get('end');
  if (requestedStart && requestedStart >= campaignDailyFirstDate && requestedStart <= campaignDailyLastDate) detailStartDate = requestedStart;
  if (requestedEnd && requestedEnd >= campaignDailyFirstDate && requestedEnd <= campaignDailyLastDate) detailEndDate = requestedEnd;
  if (detailStartDate > detailEndDate) detailStartDate = detailEndDate;

  const startInput = document.getElementById('detailStartDate');
  const endInput = document.getElementById('detailEndDate');
  [startInput, endInput].forEach(input => {
    input.min = campaignDailyFirstDate;
    input.max = campaignDailyLastDate;
  });
  startInput.value = detailStartDate;
  endInput.value = detailEndDate;

  startInput.addEventListener('change', () => {
    detailStartDate = startInput.value;
    if (detailStartDate > detailEndDate) {
      detailEndDate = detailStartDate;
      endInput.value = detailEndDate;
    }
    renderCampaignDetail();
  });
  endInput.addEventListener('change', () => {
    detailEndDate = endInput.value;
    if (detailEndDate < detailStartDate) {
      detailStartDate = detailEndDate;
      startInput.value = detailStartDate;
    }
    renderCampaignDetail();
  });
  document.getElementById('detailLast7Days').addEventListener('click', () => {
    detailEndDate = campaignDailyLastDate;
    detailStartDate = detailShiftDate(detailEndDate, -6);
    startInput.value = detailStartDate;
    endInput.value = detailEndDate;
    renderCampaignDetail();
  });
  document.getElementById('detailAllDates').addEventListener('click', () => {
    detailStartDate = campaignDailyFirstDate;
    detailEndDate = campaignDailyLastDate;
    startInput.value = detailStartDate;
    endInput.value = detailEndDate;
    renderCampaignDetail();
  });
}

createCampaignDetailCharts();
initCampaignDetailFilters();
initDetailChartModal();
renderCampaignDetail();
