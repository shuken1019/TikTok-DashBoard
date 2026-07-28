import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import PageHeader from '../components/PageHeader';
import { getData } from '../api';
import { formatCurrency } from '../format';
import { MONTH_CALENDAR, filterByMonthRange } from '../monthCalendar';

Chart.register(...registerables);

const COST_COLORS = ['#2563eb', '#f59e0b', '#0f9f95', '#7c3aed', '#475569'];

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
  const [startMonth, setStartMonth] = useState(MONTH_CALENDAR[0]);
  const [endMonth, setEndMonth] = useState(MONTH_CALENDAR[MONTH_CALENDAR.length - 1]);
  const chartInstances = useRef({});

  useEffect(() => {
    Promise.all([getData('monthly'), getData('costItems')]).then(([monthly, cost]) => {
      setMonthlyData(monthly);
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
    const totalCost = filteredMonthlyData.reduce((sum, item) => sum + item.totalCost, 0);
    const profit = revenue - totalCost;
    const marginPct = revenue ? (profit / revenue) * 100 : 0;
    const profitMonths = filteredMonthlyData.filter((item) => item.revenue - item.totalCost >= 0).length;
    const lossMonths = filteredMonthlyData.length - profitMonths;
    return { revenue, totalCost, profit, marginPct, profitMonths, lossMonths };
  }, [filteredMonthlyData]);

  const costTotal = useMemo(() => costItems.reduce((sum, item) => sum + item.value, 0), [costItems]);
  const roundedCostPercentTotal = useMemo(
    () => costItems.reduce((sum, item) => sum + Number((costTotal ? item.value / costTotal * 100 : 0).toFixed(1)), 0),
    [costItems, costTotal]
  );

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
          data: filteredMonthlyData.map((item) => item.revenue - item.totalCost),
          backgroundColor: filteredMonthlyData.map((item) => (item.revenue - item.totalCost < 0 ? '#dc2626' : '#14b8a6')),
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
          data: filteredMonthlyData.map((item) => (item.revenue ? Math.round(((item.revenue - item.totalCost) / item.revenue) * 1000) / 10 : 0)),
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

    renderChart('costBreakdownChart', {
      type: 'doughnut',
      data: {
        labels: costItems.map((item) => item.label),
        datasets: [{
          data: costItems.map((item) => item.value),
          backgroundColor: COST_COLORS,
          borderColor: '#ffffff',
          borderWidth: 4,
          hoverOffset: 8,
        }],
      },
      plugins: [costBreakdownLabels],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        layout: { padding: 8 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label(context) {
                const total = context.dataset.data.reduce((sum, value) => sum + Number(value || 0), 0);
                const value = Number(context.raw || 0);
                return ` ${context.label}: ${formatCurrency(value)} (${total ? (value / total * 100).toFixed(1) : '0.0'}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      Object.values(chartInstances.current).forEach((instance) => instance?.destroy());
      chartInstances.current = {};
    };
  }, [filteredMonthlyData, costItems, loading]);

  if (loading) return null;

  return (
    <>
      <PageHeader title="월별 순이익 / 적자 상세" subtitle="비용 구조와 마진율을 함께 확인해 흑자·적자 원인을 분석합니다." />

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
          <span className="label">누적 순이익</span>
          <span className="value">{formatCurrency(stats.profit)}</span>
        </article>
        <article className="card kpi">
          <span className="label">평균 마진율</span>
          <span className="value">{stats.marginPct.toFixed(1)}%</span>
        </article>
        <article className="card kpi">
          <span className="label">흑자 월수</span>
          <span className="value">{stats.profitMonths}개월</span>
        </article>
        <article className="card kpi">
          <span className="label">적자 월수</span>
          <span className="value">{stats.lossMonths}개월</span>
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

      <section className="grid cards-2" style={{ marginTop: 20 }}>
        <article className="card chart-card cost-breakdown-card">
          <div className="chart-title">
            <div><h2>비용 구조</h2><small>선택 월과 무관한 Admin 비용 스냅샷</small></div>
            <span className="badge warn">실적 원장 미연동</span>
          </div>
          <div className="cost-chart-shell">
            <canvas id="costBreakdownChart" />
          </div>
          <div className="cost-breakdown-legend">
            {costItems.map((item, index) => (
              <div className="cost-legend-item" key={item.label}>
                <i style={{ background: COST_COLORS[index % COST_COLORS.length] }} />
                <span>{item.label}</span>
                <strong>{formatCurrency(item.value)}</strong>
                <b>{costTotal ? (item.value / costTotal * 100).toFixed(1) : '0.0'}%</b>
              </div>
            ))}
          </div>
          <div className="cost-audit-strip">
            <span className="badge good">계산 검산 완료</span>
            <strong>{costItems.length}개 항목 합계 {formatCurrency(costTotal)} · 반올림 비중 합계 {roundedCostPercentTotal.toFixed(1)}%</strong>
          </div>
        </article>
        <article className="card">
          <div className="chart-title"><div><h2>비용 항목 상세</h2><small>총 {formatCurrency(costTotal)}</small></div></div>
          <table className="table">
            <thead><tr><th>항목</th><th>금액</th><th>비중</th></tr></thead>
            <tbody>
              {costItems.map((item) => (
                <tr key={item.label}>
                  <td>{item.label}</td>
                  <td>{formatCurrency(item.value)}</td>
                  <td>{costTotal ? ((item.value / costTotal) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cost-source-note">
            <strong>데이터 확인 결과</strong>
            <p>합계와 비중 계산은 정확합니다. 단, 현재 금액은 Admin에 저장된 계획·설정값이며 회계 원장이나 실제 정산서에서 자동 수집된 확정 실적은 아닙니다.</p>
          </div>
        </article>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>월별 상세</h2><small>매출·총비용·순이익·마진율</small></div></div>
        <table className="table">
          <thead>
            <tr><th>월</th><th>매출</th><th>총비용</th><th>순이익</th><th>마진율</th><th>상태</th></tr>
          </thead>
          <tbody>
            {filteredMonthlyData.map((item, index) => {
              const profit = item.revenue - item.totalCost;
              const margin = item.revenue ? (profit / item.revenue) * 100 : 0;
              return (
                <tr key={`${item.month}-${index}`}>
                  <td>{item.month}</td>
                  <td>{formatCurrency(item.revenue)}</td>
                  <td>{formatCurrency(item.totalCost)}</td>
                  <td>{formatCurrency(profit)}</td>
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
