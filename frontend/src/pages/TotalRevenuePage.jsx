import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import PageHeader from '../components/PageHeader';
import { getData } from '../api';
import { formatCurrency } from '../format';
import { campaignOverviewDaily, campaignDailyFirstDate, campaignDailyLastDate } from '../data/campaignDaily';

Chart.register(...registerables);

const chartOptions = {
  responsive: true,
  plugins: { legend: { position: 'top' } },
  scales: { y: { beginAtZero: true, ticks: { callback: (value) => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` } } },
};

function percentChange(current, previous) {
  return previous ? ((current - previous) / Math.abs(previous)) * 100 : null;
}

function signedPercent(value) {
  if (value === null || !Number.isFinite(value)) return '비교 불가';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

const campaignDailyMap = new Map(campaignOverviewDaily.map((item) => [item.date, item]));

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
    return rows.map((item) => ({ ...item, month: item.date.slice(5).replace('-', '/') }));
  }
  const grouped = new Map();
  rows.forEach((item) => {
    const key = item.date.slice(0, 7);
    if (!grouped.has(key)) {
      grouped.set(key, { month: key, cost: 0, grossRevenue: 0, orders: 0 });
    }
    const bucket = grouped.get(key);
    bucket.cost += item.cost;
    bucket.grossRevenue += item.grossRevenue;
    bucket.orders += item.orders;
  });
  return [...grouped.values()];
}

function TotalRevenuePage() {
  const [forecastData, setForecastData] = useState({ q3: { revenue: 0, adSpend: 0, profit: 0 }, q4: { revenue: 0, adSpend: 0, profit: 0 } });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState(campaignDailyLastDate);
  const chartInstances = useRef({});

  async function loadAll() {
    const forecast = await getData('forecast');
    setForecastData(forecast);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function handleStartDateChange(event) {
    const value = event.target.value;
    setStartDate(value);
    if (value > endDate) setEndDate(value);
  }

  function handleEndDateChange(event) {
    const value = event.target.value;
    setEndDate(value);
    if (value < startDate) setStartDate(value);
  }

  const selectedDailyData = useMemo(
    () => buildFinancialRows(startDate, endDate),
    [startDate, endDate]
  );
  const filteredMonthlyData = useMemo(() => groupRowsForChart(selectedDailyData), [selectedDailyData]);

  const totals = useMemo(() => sumFinancialRows(selectedDailyData), [selectedDailyData]);

  const autoInsight = useMemo(() => {
    const revenueGap = totals.grossRevenue - totals.cost;
    const costMultiple = totals.grossRevenue ? totals.cost / totals.grossRevenue : 0;
    const campaignRoi = totals.cost ? totals.grossRevenue / totals.cost : 0;
    const selectedDays = selectedDailyData.length;
    const previousEnd = shiftIsoDate(startDate, -1);
    const previousStart = shiftIsoDate(previousEnd, -(selectedDays - 1));
    const previousTotals = previousEnd >= campaignDailyFirstDate
      ? sumFinancialRows(buildFinancialRows(previousStart < campaignDailyFirstDate ? campaignDailyFirstDate : previousStart, previousEnd))
      : null;
    const revenueGrowth = previousTotals ? percentChange(totals.grossRevenue, previousTotals.grossRevenue) : null;
    const adGrowth = previousTotals ? percentChange(totals.cost, previousTotals.cost) : null;

    const headline = campaignRoi < 1
      ? '광고비 대비 캠페인 귀속 매출이 낮습니다.'
      : '캠페인 귀속 매출이 광고비보다 높습니다.';
    const change = previousTotals
      ? `직전 동일 기간 대비 Gross revenue ${signedPercent(revenueGrowth)} · Cost ${signedPercent(adGrowth)}`
      : '이전 동일 길이의 비교 기간이 없어 증감률을 표시하지 않습니다.';
    let action = '선택 기간을 바꾸면 같은 날짜 기준으로 우선 조치를 다시 계산합니다.';
    if (totals.cost && campaignRoi < 1) {
      action = `광고비 $1당 $${campaignRoi.toFixed(2)}의 캠페인 귀속 매출입니다. ROI 1.0x 미만 캠페인의 예산 조정이 우선입니다.`;
    } else if (totals.cost) {
      action = `Campaign ROI ${campaignRoi.toFixed(2)}x를 유지하면서 이익 기여가 높은 캠페인에 예산을 집중하세요.`;
    }

    return {
      headline,
      revenueGap,
      costMultiple,
      campaignRoi,
      change,
      action,
      status: campaignRoi >= 1 ? 'good' : campaignRoi >= 0.8 ? 'warn' : 'bad',
    };
  }, [selectedDailyData, totals, startDate]);

  useEffect(() => {
    if (loading) return;

    const renderChart = (canvasId, config) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      if (chartInstances.current[canvasId]) {
        chartInstances.current[canvasId].destroy();
      }
      chartInstances.current[canvasId] = new Chart(canvas, config);
    };

    renderChart('revenueAdChart', {
      type: 'bar',
      data: {
        labels: filteredMonthlyData.map((item) => item.month),
        datasets: [
          { label: 'Gross revenue', data: filteredMonthlyData.map((item) => item.grossRevenue), backgroundColor: '#2563eb' },
          { label: 'Cost', data: filteredMonthlyData.map((item) => item.cost), backgroundColor: '#f59e0b' },
        ],
      },
      options: chartOptions,
    });

    renderChart('profitChart', {
      type: 'line',
      data: {
        labels: filteredMonthlyData.map((item) => item.month),
        datasets: [
          {
            label: 'Campaign ROI',
            data: filteredMonthlyData.map((item) => item.cost ? item.grossRevenue / item.cost : 0),
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124,58,237,0.12)',
            fill: true,
            tension: 0,
            pointRadius: 5,
          },
        ],
      },
      options: {
        ...chartOptions,
        plugins: {
          legend: { position: 'top' },
          tooltip: { callbacks: { label: (context) => ` Campaign ROI: ${Number(context.raw || 0).toFixed(2)}x` } },
        },
        scales: { y: { beginAtZero: true, ticks: { callback: (value) => `${Number(value).toFixed(2)}x` } } },
      },
    });

    renderChart('summaryTrendChart', {
      data: {
        labels: filteredMonthlyData.map((item) => item.month),
        datasets: [
          { type: 'bar', label: 'Gross revenue', data: filteredMonthlyData.map((item) => item.grossRevenue), backgroundColor: '#2563eb' },
          { type: 'bar', label: 'Cost', data: filteredMonthlyData.map((item) => item.cost), backgroundColor: '#f59e0b' },
        ],
      },
      options: chartOptions,
    });

    renderChart('forecastChart', {
      type: 'bar',
      data: {
        labels: ['3분기', '4분기'],
        datasets: [
          { label: '매출', data: [forecastData.q3.revenue, forecastData.q4.revenue], backgroundColor: '#2563eb' },
          { label: '마케팅 예산', data: [forecastData.q3.adSpend, forecastData.q4.adSpend], backgroundColor: '#f59e0b' },
          { label: '순이익', data: [forecastData.q3.profit, forecastData.q4.profit], backgroundColor: '#14b8a6' },
        ],
      },
      options: chartOptions,
    });

    return () => {
      Object.values(chartInstances.current).forEach((instance) => instance?.destroy());
      chartInstances.current = {};
    };
  }, [filteredMonthlyData, forecastData, loading]);

  if (loading) return null;

  return (
    <>
      <PageHeader title="TikTok Shop US Campaign 대시보드" subtitle="Campaign Overview의 공식 Cost·Gross revenue·주문·ROI를 날짜별로 확인합니다." />

      <section className="card">
        <div className="control-row" style={{ marginTop: 0 }}>
          <label>
            시작일
            <input type="date" value={startDate} min={campaignDailyFirstDate} max={campaignDailyLastDate} onChange={handleStartDateChange} />
          </label>
          <label>
            종료일
            <input type="date" value={endDate} min={campaignDailyFirstDate} max={campaignDailyLastDate} onChange={handleEndDateChange} />
          </label>
          <div className="quick-range">
            <button type="button" onClick={() => { setEndDate(campaignDailyLastDate); setStartDate(shiftIsoDate(campaignDailyLastDate, -6)); }}>최근 7일</button>
            <button type="button" onClick={() => { setStartDate(campaignDailyFirstDate); setEndDate(campaignDailyLastDate); }}>전체 기간</button>
          </div>
          <span className="page-note" style={{ marginTop: 0 }}>
            {startDate} ~ {endDate} · {selectedDailyData.length}일 · Campaign Overview 기준
            {startDate <= '2026-07-27' && endDate >= '2026-07-27' ? ' · Cost 일별 합계에 공식 총계 보정 +$0.88 포함' : ''}
          </span>
        </div>
      </section>

      <section className="grid cards-4" style={{ marginTop: 20 }}>
        <article className="card kpi">
          <span className="label">Campaign Gross revenue</span>
          <span className="value">{formatOfficialCurrency(totals.grossRevenue)}</span>
          <span className="desc">{startDate} ~ {endDate} Campaign 귀속 매출</span>
        </article>
        <article className="card kpi">
          <span className="label">Campaign Cost</span>
          <span className="value">{formatOfficialCurrency(totals.cost)}</span>
          <span className="desc">{startDate} ~ {endDate} 공식 Campaign 비용</span>
        </article>
        <article className="card kpi">
          <span className="label">SKU 주문</span>
          <span className="value">{totals.orders.toLocaleString('en-US')}건</span>
          <span className="desc">Cost per order {formatOfficialCurrency(totals.orders ? totals.cost / totals.orders : 0)}</span>
        </article>
        <article className="card kpi">
          <span className="label">Campaign ROI</span>
          <span className="value">{(totals.cost ? totals.grossRevenue / totals.cost : 0).toFixed(2)}x</span>
          <span className="desc">Gross revenue ÷ Cost</span>
        </article>
      </section>

      <section className="card finance-entry-section" style={{ marginTop: 20 }}>
        <div className="chart-title">
          <div>
            <span className="eyebrow">FINANCIAL DETAIL</span>
            <h2>재무·손익 상세 분석</h2>
            <small>실적, Forecast, 적자·흑자, 손익분기점을 각각 클릭해 확인하세요.</small>
          </div>
          <span className="finance-period-badge">2025.11 → 2027.12</span>
        </div>
        <div className="finance-entry-grid">
          <Link to="/performance-outlook" className="finance-entry-card primary">
            <span>01 · 실적 + 계획</span>
            <strong>2025.11~2027.12 매출·광고비·Forecast</strong>
            <small>월별 매출·총비용·순이익과 적자→흑자 전환 전망</small>
            <b>통합 전망 보기 →</b>
          </Link>
          <Link to="/profit-loss" className="finance-entry-card">
            <span>02 · 손익</span>
            <strong>월별 순이익 / 적자·흑자</strong>
            <small>기간 선택, 마진율, 비용 구조와 월별 손익 상태</small>
            <b>손익 상세 보기 →</b>
          </Link>
          <Link to="/breakeven" className="finance-entry-card">
            <span>03 · 시뮬레이션</span>
            <strong>손익분기점 분석</strong>
            <small>판매가·원가·부대비용·광고비 기준 필요 판매량 계산</small>
            <b>손익분기점 보기 →</b>
          </Link>
          <Link to="/forecast" className="finance-entry-card">
            <span>04 · 계획</span>
            <strong>3/4분기 Forecast 상세</strong>
            <small>목표 매출·광고비·모델 순이익과 목표 대비 페이스</small>
            <b>Forecast 보기 →</b>
          </Link>
        </div>
      </section>

      <section className="grid cards-3" style={{ marginTop: 20 }}>
        <Link to="/revenue-ads" className="card linked chart-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="chart-title"><div><h2>Campaign Gross revenue vs Cost</h2><small>{startDate} ~ {endDate} · {selectedDailyData.length <= 45 ? '일별' : '월별'} Campaign Overview 자동 집계</small></div></div>
          <canvas id="revenueAdChart" />
        </Link>
        <Link to="/revenue-ads" className="card linked chart-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="chart-title"><div><h2>Campaign ROI 추이</h2><small>{startDate} ~ {endDate} · {selectedDailyData.length <= 45 ? '일별' : '월별'} Gross revenue ÷ Cost</small></div></div>
          <canvas id="profitChart" />
        </Link>
        <Link to="/forecast" className="card linked chart-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="chart-title"><div><h2>3/4분기 Forecast</h2><small>목표 매출·마케팅 예산·모델 순이익 · 클릭하면 상세 페이지</small></div></div>
          <canvas id="forecastChart" />
        </Link>
      </section>

      <section className="grid cards-2" style={{ marginTop: 20 }}>
        <article className="card chart-card">
          <div className="chart-title"><div><h2>Campaign 실적 요약</h2><small>공식 Gross revenue와 Cost만 비교합니다.</small></div></div>
          <canvas id="summaryTrendChart" />
        </article>
        <article className="card ai-insight-card">
          <div className="chart-title">
            <div>
              <span className="eyebrow">AUTO INSIGHT</span>
              <h2>AI 자동 경영 분석</h2>
              <small>기간과 데이터가 바뀌면 즉시 다시 계산됩니다.</small>
            </div>
            <span className={`badge ${autoInsight.status}`}>규칙 기반 · 실시간</span>
          </div>
          <p className="ai-insight-headline">{autoInsight.headline}</p>
          <div className="ai-insight-metrics">
            <div>
              <span>광고 매출 격차</span>
              <strong className={autoInsight.revenueGap >= 0 ? 'positive' : 'negative'}>{formatOfficialCurrency(autoInsight.revenueGap)}</strong>
            </div>
            <div>
              <span>Cost ÷ Gross revenue</span>
              <strong>{autoInsight.costMultiple.toFixed(2)}x</strong>
            </div>
            <div>
              <span className="metric-term">Campaign ROI <span className="term-help" tabIndex="0" role="button" aria-label="Campaign ROI 설명" data-tooltip="광고비 $1당 얼마의 캠페인 매출이 발생했는지 보여줘요.">?</span></span>
              <strong>{autoInsight.campaignRoi.toFixed(2)}x</strong>
            </div>
          </div>
          <div className="ai-insight-list">
            <div className="ai-insight-item">
              <span>최근 변화</span>
              <p>{autoInsight.change}</p>
            </div>
            <div className="ai-insight-item">
              <span>우선 조치</span>
              <p>{autoInsight.action}</p>
            </div>
          </div>
          <div className="ai-insight-footer">
            <span>광고 매출 격차는 순이익이 아닙니다 · 원가·수수료·물류비 제외</span>
            <strong>광고 효율 상세 보기 →</strong>
          </div>
        </article>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><h2>Forecast 요약</h2><small>3Q / 4Q 기대성과</small></div>
        <div className="grid cards-4" style={{ marginTop: 16 }}>
          <article className="card">
            <span className="label">3분기 매출</span>
            <p className="value">{formatCurrency(forecastData.q3.revenue)}</p>
          </article>
          <article className="card">
            <span className="label">4분기 매출</span>
            <p className="value">{formatCurrency(forecastData.q4.revenue)}</p>
          </article>
          <article className="card">
            <span className="label">3분기 순이익</span>
            <p className="value">{formatCurrency(forecastData.q3.profit)}</p>
          </article>
          <article className="card">
            <span className="label">4분기 순이익</span>
            <p className="value">{formatCurrency(forecastData.q4.profit)}</p>
          </article>
        </div>
      </section>

      <section className="grid cards-4" style={{ marginTop: 20 }}>
        <Link to="/products" className="card linked" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="chart-title"><h2>상품별 매출</h2></div>
          <p className="page-note">상품 선택, 날짜별 매출, 마진 구조까지 상세 페이지에서 확인하세요.</p>
        </Link>
        <Link to="/inventory" className="card linked" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="chart-title"><h2>재고관리</h2></div>
          <p className="page-note">재고 리스크와 안전 재고 현황을 확인하세요.</p>
        </Link>
        <Link to="/affiliate" className="card linked" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="chart-title"><h2>어필리에이터 관리</h2></div>
          <p className="page-note">파트너 수수료와 캠페인 성과를 확인하세요.</p>
        </Link>
        <Link to="/ads" className="card linked" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="chart-title"><h2>광고관리</h2></div>
          <p className="page-note">비용 구조와 광고 집행 현황을 확인하세요.</p>
        </Link>
      </section>
    </>
  );
}

export default TotalRevenuePage;
