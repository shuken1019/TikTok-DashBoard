import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { getData } from '../api';
import { formatCurrency, formatMoney } from '../format';
import { MONTH_CALENDAR, filterByMonthRange } from '../monthCalendar';

Chart.register(...registerables);

const COST_COLORS = ['#2563eb', '#f59e0b', '#0f9f95', '#7c3aed', '#475569'];
const hasCompleteCostData = (item) => item?.costStatus !== 'missing' && item?.adSpend !== null && item?.adSpend !== undefined && item?.totalCost !== null && item?.totalCost !== undefined;

const costBreakdownLabels = {
  id: 'costBreakdownLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];
    const total = dataset.data.reduce((sum, value) => sum + Number(value || 0), 0);
    const arcs = chart.getDatasetMeta(0).data;
    if (!arcs.length || !total) return;

    const { x, y } = arcs[0];
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#64748b';
    ctx.font = '700 12px sans-serif';
    ctx.fillText('총 비광고비', x, y - 13);
    ctx.fillStyle = '#172033';
    ctx.font = '900 22px sans-serif';
    ctx.fillText(formatCurrency(total), x, y + 12);

    arcs.forEach((arc, index) => {
      const value = Number(dataset.data[index] || 0);
      const percent = value / total * 100;
      const angle = (arc.startAngle + arc.endAngle) / 2;
      const radius = (arc.innerRadius + arc.outerRadius) / 2;
      const labelX = arc.x + Math.cos(angle) * radius;
      const labelY = arc.y + Math.sin(angle) * radius;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(15, 23, 42, .35)';
      ctx.shadowBlur = 3;
      ctx.font = '800 11px sans-serif';
      ctx.fillText(formatCurrency(value), labelX, labelY - 7);
      ctx.font = '700 10px sans-serif';
      ctx.fillText(`${percent.toFixed(1)}%`, labelX, labelY + 8);
    });
    ctx.restore();
  },
};

function ProfitLossDetailPage() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [costItems, setCostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [financialModalOpen, setFinancialModalOpen] = useState(false);
  const [startMonth, setStartMonth] = useState(MONTH_CALENDAR[0]);
  const [endMonth, setEndMonth] = useState(MONTH_CALENDAR[MONTH_CALENDAR.length - 1]);
  const chartInstances = useRef({});

  useEffect(() => {
    Promise.all([getData('monthly'), getData('costItems')]).then(([monthly, cost]) => {
      setMonthlyData(monthly.filter((item) => Number(item.revenue || 0) !== 0 || Number(item.adSpend || 0) !== 0 || Number(item.totalCost || 0) !== 0));
      setCostItems(cost);
      setLoading(false);
    });
  }, []);

  function handleStartMonthChange(event) {
    const value = event.target.value;
    setStartMonth(value);
    if (value > endMonth) setEndMonth(value);
  }

  function handleEndMonthChange(event) {
    const value = event.target.value;
    setEndMonth(value);
    if (value < startMonth) setStartMonth(value);
  }

  const filteredMonthlyData = useMemo(
    () => filterByMonthRange(monthlyData, startMonth, endMonth),
    [monthlyData, startMonth, endMonth]
  );

  const stats = useMemo(() => {
    const revenue = filteredMonthlyData.reduce((sum, item) => sum + item.revenue, 0);
    const completeRows = filteredMonthlyData.filter(hasCompleteCostData);
    const incompleteRows = filteredMonthlyData.filter((item) => !hasCompleteCostData(item));
    const completeRevenue = completeRows.reduce((sum, item) => sum + item.revenue, 0);
    const totalCost = completeRows.reduce((sum, item) => sum + item.totalCost, 0);
    const adSpend = completeRows.reduce((sum, item) => sum + Number(item.adSpend), 0);
    const verifiedProfit = completeRevenue - totalCost;
    const marginPct = completeRevenue ? (verifiedProfit / completeRevenue) * 100 : 0;
    const profitMonths = completeRows.filter((item) => item.revenue - item.totalCost >= 0).length;
    const lossMonths = completeRows.length - profitMonths;
    return { revenue, adSpend, totalCost, profit: incompleteRows.length ? null : verifiedProfit, verifiedProfit, marginPct, profitMonths, lossMonths, incompleteRows, completeRows };
  }, [filteredMonthlyData]);

  const costTotal = useMemo(() => costItems.reduce((sum, item) => sum + item.value, 0), [costItems]);
  const roundedCostPercentTotal = useMemo(
    () => costItems.reduce((sum, item) => sum + Number((costTotal ? item.value / costTotal * 100 : 0).toFixed(1)), 0),
    [costItems, costTotal]
  );
  const financialSummary = useMemo(() => {
    const allRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
    const allocationRatio = allRevenue ? stats.revenue / allRevenue : 0;
    const seedingBase = Number(costItems.find((item) => String(item.label).includes('시딩'))?.value || 0);
    const allocatedItems = costItems.map((item) => ({ ...item, allocatedValue: Number(item.value || 0) * allocationRatio }));
    const seeding = seedingBase * allocationRatio;
    const marketing = stats.adSpend + seeding;
    const costSegments = [{ label: '광고비', value: stats.adSpend }, ...allocatedItems.map((item) => ({ label: item.label, value: item.allocatedValue }))];
    return {
      ...stats,
      seeding,
      marketing,
      costSegments,
      margin: stats.profit !== null && stats.revenue ? stats.profit / stats.revenue * 100 : null,
    };
  }, [monthlyData, costItems, stats]);

  useEffect(() => {
    if (loading) return;

    const renderChart = (canvasId, config) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      if (chartInstances.current[canvasId]) chartInstances.current[canvasId].destroy();
      chartInstances.current[canvasId] = new Chart(canvas, config);
    };

    renderChart('profitDetailChart', {
      type: 'bar',
      data: {
        labels: filteredMonthlyData.map((item) => item.month),
        datasets: [{
          label: '순이익',
          data: filteredMonthlyData.map((item) => (hasCompleteCostData(item) ? item.revenue - item.totalCost : null)),
          backgroundColor: filteredMonthlyData.map((item) => (!hasCompleteCostData(item) ? '#f59e0b' : item.revenue - item.totalCost < 0 ? '#dc2626' : '#14b8a6')),
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: (v) => '$' + v / 1000 + 'k' } } },
      },
    });

    renderChart('marginTrendChart', {
      type: 'line',
      data: {
        labels: filteredMonthlyData.map((item) => item.month),
        datasets: [{
          label: '마진율 (%)',
          data: filteredMonthlyData.map((item) => (hasCompleteCostData(item) && item.revenue ? Math.round(((item.revenue - item.totalCost) / item.revenue) * 1000) / 10 : null)),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          fill: true,
          tension: 0,
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: (v) => v + '%' } } },
      },
    });

    const ringOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (context) => ` ${context.label}: ${formatMoney(context.raw)}` } },
      },
    };

    renderChart('revenueRingChart', {
      type: 'doughnut',
      data: { labels: ['전체 매출'], datasets: [{ data: [Math.max(Math.abs(financialSummary.revenue), 0.01)], backgroundColor: ['#2563eb'], borderWidth: 0 }] },
      options: ringOptions,
    });

    renderChart('costOverviewChart', {
      type: 'doughnut',
      data: {
        labels: financialSummary.costSegments.map((item) => item.label),
        datasets: [{
          data: financialSummary.costSegments.map((item) => item.value),
          backgroundColor: ['#7c3aed', '#2563eb', '#f59e0b', '#0f9f95', '#8b5cf6', '#475569'],
          borderColor: '#fff',
          borderWidth: 3,
        }],
      },
      options: ringOptions,
    });

    renderChart('marketingRingChart', {
      type: 'doughnut',
      data: {
        labels: ['광고비', '시딩비'],
        datasets: [{ data: [financialSummary.adSpend, financialSummary.seeding], backgroundColor: ['#7c3aed', '#f59e0b'], borderColor: '#fff', borderWidth: 3 }],
      },
      options: ringOptions,
    });

    renderChart('operatingProfitRingChart', {
      type: 'doughnut',
      data: {
        labels: [financialSummary.profit === null ? '계산 보류' : financialSummary.profit < 0 ? '영업손실' : '영업이익'],
        datasets: [{ data: [financialSummary.profit === null ? 1 : Math.max(Math.abs(financialSummary.profit), 0.01)], backgroundColor: [financialSummary.profit === null ? '#f59e0b' : financialSummary.profit < 0 ? '#dc2626' : '#16a34a'], borderWidth: 0 }],
      },
      options: ringOptions,
    });

    return () => {
      Object.values(chartInstances.current).forEach((instance) => instance?.destroy());
      chartInstances.current = {};
    };
  }, [filteredMonthlyData, costItems, financialSummary, financialModalOpen, loading]);

  useEffect(() => {
    document.body.classList.toggle('modal-open', financialModalOpen);
    const handleEscape = (event) => {
      if (event.key === 'Escape') setFinancialModalOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [financialModalOpen]);

  if (loading) return null;

  return (
    <>
      <PageHeader title="월별 순이익 / 적자 상세" subtitle="비용 구조와 마진율을 함께 확인해 흑자·적자 원인을 분석합니다." />

      <section className="detail-edit-bar">
        <span>2026.08 Total Revenue는 8/1~8/17(UTC-7) $25,439.99, 광고비는 8/1~8/18 $35,235.56입니다. 종료일이 달라 총비용과 손익 계산을 보류합니다.</span>
        <Link to="/admin?tab=monthly" className="detail-edit-button">월별 데이터 수정</Link>
      </section>

      <section className="card">
        <div className="control-row" style={{ marginTop: 0 }}>
          <label>
            시작월
            <input type="month" value={startMonth} min={MONTH_CALENDAR[0]} max={MONTH_CALENDAR[MONTH_CALENDAR.length - 1]} onChange={handleStartMonthChange} />
          </label>
          <label>
            종료월
            <input type="month" value={endMonth} min={MONTH_CALENDAR[0]} max={MONTH_CALENDAR[MONTH_CALENDAR.length - 1]} onChange={handleEndMonthChange} />
          </label>
          <button type="button" onClick={() => { setStartMonth(MONTH_CALENDAR[0]); setEndMonth(MONTH_CALENDAR[MONTH_CALENDAR.length - 1]); }}>
            전체 기간
          </button>
        </div>
      </section>

      <section className="grid cards-4" style={{ marginTop: 20 }}>
        <article className="card kpi">
          <span className="label">① 선택 기간 Total Revenue</span>
          <span className="value">{formatMoney(stats.revenue)}</span>
        </article>
        <article className="card kpi">
          <span className="label">② 확인된 선택 기간 광고비</span>
          <span className="value">{formatMoney(stats.adSpend)}</span>
        </article>
        <article className="card kpi">
          <span className="label">③ 확인된 광고비 포함 총비용</span>
          <span className="value">{formatMoney(stats.totalCost)}</span>
        </article>
        <article className="card kpi">
          <span className="label">④ 추정 순수익</span>
          <span className="value" style={{ color: stats.profit === null ? '#b45309' : stats.profit < 0 ? '#dc2626' : '#16a34a' }}>{stats.profit === null ? '계산 보류' : formatMoney(stats.profit)}</span>
          <span className="desc">비용 확인 {stats.completeRows.length}개월: 흑자 {stats.profitMonths} · 적자 {stats.lossMonths} · 마진 {stats.marginPct.toFixed(1)}%{stats.incompleteRows.length ? ' · 8월 보류' : ''}</span>
        </article>
      </section>

      <section className="grid cards-2" style={{ marginTop: 20 }}>
        <article className="card chart-card">
          <div className="chart-title"><div><h2>월별 순이익 / 적자</h2><small>{startMonth} ~ {endMonth}</small></div></div>
          <canvas id="profitDetailChart" />
        </article>
        <article className="card chart-card">
          <div className="chart-title"><div><h2>월별 마진율 추이</h2><small>순이익 ÷ 매출</small></div></div>
          <canvas id="marginTrendChart" />
        </article>
      </section>

      <section
        className="card chart-card financial-overview-card"
        style={{ marginTop: 20 }}
        role="button"
        tabIndex={0}
        aria-label="비용 구조 상세 열기"
        onClick={() => setFinancialModalOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') setFinancialModalOpen(true);
        }}
      >
        <div className="chart-title">
          <div><h2>전체 매출과 비용 구조</h2><small>원 안은 Total Revenue · 조각은 광고비·시딩비 등 총비용 구성</small></div>
          <span className="detail-open-button">상세 보기 ↗</span>
        </div>
        <div className="cost-overview-layout">
          <div className="cost-overview-donut">
            <canvas id="costOverviewChart" />
            <div className="cost-overview-center"><small>선택 기간 총매출</small><strong>{formatMoney(financialSummary.revenue)}</strong><span>Total Revenue</span></div>
          </div>
          <div>
            <div className="cost-overview-legend">
              {financialSummary.costSegments.map((item, index) => (
                <span key={item.label}>
                  <i style={{ background: ['#7c3aed', '#2563eb', '#f59e0b', '#0f9f95', '#8b5cf6', '#475569'][index] }} />
                  <b>{item.label}</b>
                  <strong>{formatMoney(item.value)}</strong>
                  <em>{financialSummary.totalCost ? (item.value / financialSummary.totalCost * 100).toFixed(1) : '0.0'}%</em>
                </span>
              ))}
            </div>
            <div className="cost-overview-summary">
              <span>광고비 포함 총비용<strong>{formatMoney(financialSummary.totalCost)}</strong></span>
              <span>추정 영업이익<strong style={{ color: financialSummary.profit === null ? '#b45309' : financialSummary.profit < 0 ? '#dc2626' : '#16a34a' }}>{financialSummary.profit === null ? '계산 보류' : formatMoney(financialSummary.profit)}</strong></span>
            </div>
            <p className="page-note">비용이 총매출을 초과할 수 있으므로 원 조각의 비중은 <strong>총비용 대비 비중</strong>입니다. 원을 클릭하면 상세 계산을 볼 수 있습니다.</p>
          </div>
        </div>
      </section>

      {financialModalOpen && (
        <div className="dashboard-modal">
          <button className="dashboard-modal-backdrop" type="button" onClick={() => setFinancialModalOpen(false)} aria-label="닫기" />
          <section className="dashboard-modal-panel" role="dialog" aria-modal="true" aria-labelledby="financialModalTitle">
            <div className="dashboard-modal-header">
              <div><small>FINANCIAL DETAIL</small><h2 id="financialModalTitle">매출·비용·추정 영업이익 상세</h2></div>
              <button className="dashboard-modal-close" type="button" onClick={() => setFinancialModalOpen(false)} aria-label="닫기">×</button>
            </div>
            <div className="dashboard-modal-body">
              <div className="financial-rings">
                <article className="financial-ring-panel">
                  <h3>① 전체 매출</h3>
                  <div className="financial-ring-chart"><canvas id="revenueRingChart" /><div className="financial-ring-center"><small>Total Revenue</small><strong>{formatMoney(financialSummary.revenue)}</strong></div></div>
                  <p>정산서 Total Revenue 합계</p>
                </article>
                <article className="financial-ring-panel">
                  <h3>② 광고비 + 시딩비</h3>
                  <div className="financial-ring-chart"><canvas id="marketingRingChart" /><div className="financial-ring-center"><small>마케팅 투자</small><strong>{formatMoney(financialSummary.marketing)}</strong></div></div>
                  <div className="financial-ring-meta"><span><i style={{ background: '#7c3aed' }} />광고비 <b>{formatMoney(financialSummary.adSpend)}</b></span><span><i style={{ background: '#f59e0b' }} />시딩비 <b>{formatMoney(financialSummary.seeding)}</b></span></div>
                </article>
                <article className="financial-ring-panel">
                  <h3>③ 추정 영업이익</h3>
                  <div className="financial-ring-chart"><canvas id="operatingProfitRingChart" /><div className="financial-ring-center"><small>{financialSummary.profit === null ? '기간 불일치' : financialSummary.profit < 0 ? '영업손실' : '영업이익'}</small><strong style={{ color: financialSummary.profit === null ? '#b45309' : financialSummary.profit < 0 ? '#dc2626' : '#16a34a' }}>{financialSummary.profit === null ? '계산 보류' : formatMoney(financialSummary.profit)}</strong></div></div>
                  <p>{financialSummary.margin === null ? '8월 동일 기간 비용 필요' : `영업이익률 ${financialSummary.margin.toFixed(1)}%`}</p>
                </article>
              </div>
              <div className="financial-equation-strip">
                <span>전체 매출 <strong>{formatMoney(financialSummary.revenue)}</strong></span><b>−</b>
                <span>광고비 포함 총비용 <strong>{formatMoney(financialSummary.totalCost)}</strong></span><b>=</b>
                <span>추정 영업이익 <strong style={{ color: financialSummary.profit === null ? '#b45309' : financialSummary.profit < 0 ? '#dc2626' : '#16a34a' }}>{financialSummary.profit === null ? '계산 보류' : formatMoney(financialSummary.profit)}</strong></span>
              </div>
              <div className="chart-title modal-table-title"><div><h3>비용 항목 상세</h3><small>선택 기간 총 {formatMoney(financialSummary.totalCost)}</small></div><span className="badge warn">실적 원장 미연동</span></div>
              <table className="table">
                <thead><tr><th>항목</th><th>금액</th><th>총비용 대비 비중</th></tr></thead>
                <tbody>
                  {financialSummary.costSegments.map((item) => (
                    <tr key={item.label}><td>{item.label}</td><td>{formatMoney(item.value)}</td><td>{financialSummary.totalCost ? (item.value / financialSummary.totalCost * 100).toFixed(1) : '0.0'}%</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="cost-source-note"><strong>계산 기준</strong><p>시딩비 등 Admin 비용은 선택 기간의 매출 비중으로 배부합니다. 추정 영업이익은 광고비·제품 원가·시딩비·수수료·물류비·기타 비용을 모두 차감합니다.</p></div>
            </div>
          </section>
        </div>
      )}

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>월별 상세</h2><small>매출 → 광고비 → 광고비 차감 후 → 총비용 → 추정 순수익</small></div></div>
        <table className="table">
          <thead>
            <tr><th>월</th><th>Total Revenue</th><th>광고비</th><th>광고비 차감 후</th><th>광고비 포함 총비용</th><th>추정 순수익</th><th>마진율</th><th>상태</th></tr>
          </thead>
          <tbody>
            {filteredMonthlyData.map((item, index) => {
              if (!hasCompleteCostData(item)) return (
                <tr key={`${item.month}-${index}`}><td>{item.month}<small style={{ display: 'block' }}>매출 ~{item.actualThrough || '진행 중'} · 광고 ~{item.adSpendThrough || '미확인'}</small></td><td>{formatMoney(item.revenue)}</td><td>{item.adSpend == null ? '미수집' : formatMoney(item.adSpend)}</td><td>기간 불일치</td><td>계산 보류</td><td><strong>계산 보류</strong></td><td>—</td><td><span className="badge warn">종료일 확인</span></td></tr>
              );
              const profit = item.revenue - item.totalCost;
              const adSpend = Number(item.adSpend || 0);
              const afterAdProfit = item.revenue - adSpend;
              const margin = item.revenue ? (profit / item.revenue) * 100 : 0;
              return (
                <tr key={`${item.month}-${index}`}>
                  <td>{item.month}</td>
                  <td>{formatMoney(item.revenue)}</td>
                  <td>{formatMoney(adSpend)}</td>
                  <td>{formatMoney(afterAdProfit)}</td>
                  <td>{formatMoney(item.totalCost)}</td>
                  <td><strong style={{ color: profit < 0 ? '#dc2626' : '#16a34a' }}>{formatMoney(profit)}</strong></td>
                  <td>{margin.toFixed(1)}%</td>
                  <td><span className={`badge ${profit < 0 ? 'bad' : 'good'}`}>{profit < 0 ? '적자' : '흑자'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="page-note" style={{ fontSize: 12 }}>
          ※ 비용 항목은 현재 고정비/변동비 구분 없이 월 총액으로만 집계됩니다. SKU별 원가(FOB·생산·물류·수수료)가 연동되면 상품별 마진 기여도까지 분해할 수 있습니다.
        </p>
      </section>
    </>
  );
}

export default ProfitLossDetailPage;
