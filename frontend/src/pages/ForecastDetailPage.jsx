import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import PageHeader from '../components/PageHeader';
import { getData } from '../api';
import { formatCurrency } from '../format';

Chart.register(...registerables);

function ForecastDetailPage() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [forecastData, setForecastData] = useState({ q3: { revenue: 0, adSpend: 0, profit: 0 }, q4: { revenue: 0, adSpend: 0, profit: 0 } });
  const [loading, setLoading] = useState(true);
  const chartInstances = useRef({});

  useEffect(() => {
    Promise.all([getData('monthly'), getData('forecast')]).then(([monthly, forecast]) => {
      setMonthlyData(monthly);
      setForecastData(forecast);
      setLoading(false);
    });
  }, []);

  const lastActualMonth = useMemo(() => (monthlyData.length ? monthlyData[monthlyData.length - 1] : null), [monthlyData]);

  const quarters = useMemo(() => {
    return ['q3', 'q4'].map((key) => {
      const q = forecastData[key];
      const marginPct = q.revenue ? (q.profit / q.revenue) * 100 : 0;
      const roas = q.adSpend ? q.revenue / q.adSpend : 0;
      return { key, label: key === 'q3' ? '3분기' : '4분기', ...q, marginPct, roas };
    });
  }, [forecastData]);

  // Q3 목표 대비, 실적으로 확보된 마지막 달(7월) 매출을 3개월로 환산한 페이스
  const q3Pace = useMemo(() => {
    if (!lastActualMonth || !forecastData.q3.revenue) return null;
    const runRateQuarter = lastActualMonth.revenue * 3;
    return Math.round((runRateQuarter / forecastData.q3.revenue) * 1000) / 10;
  }, [lastActualMonth, forecastData]);

  useEffect(() => {
    if (loading) return;

    const renderChart = (canvasId, config) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      if (chartInstances.current[canvasId]) chartInstances.current[canvasId].destroy();
      chartInstances.current[canvasId] = new Chart(canvas, config);
    };

    renderChart('forecastDetailChart', {
      type: 'bar',
      data: {
        labels: ['3분기', '4분기'],
        datasets: [
          { label: '매출', data: [forecastData.q3.revenue, forecastData.q4.revenue], backgroundColor: '#2563eb' },
          { label: '광고비', data: [forecastData.q3.adSpend, forecastData.q4.adSpend], backgroundColor: '#f59e0b' },
          { label: '순이익', data: [forecastData.q3.profit, forecastData.q4.profit], backgroundColor: '#14b8a6' },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => '$' + v / 1000 + 'k' } } },
      },
    });

    renderChart('marginByQuarterChart', {
      type: 'bar',
      data: {
        labels: ['3분기', '4분기'],
        datasets: [{
          label: '목표 마진율 (%)',
          data: [
            forecastData.q3.revenue ? (forecastData.q3.profit / forecastData.q3.revenue) * 100 : 0,
            forecastData.q4.revenue ? (forecastData.q4.profit / forecastData.q4.revenue) * 100 : 0,
          ],
          backgroundColor: '#8b5cf6',
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => v + '%' } } },
      },
    });

    return () => {
      Object.values(chartInstances.current).forEach((instance) => instance?.destroy());
      chartInstances.current = {};
    };
  }, [forecastData, loading]);

  if (loading) return null;

  return (
    <>
      <PageHeader title="3/4분기 Forecast 상세" subtitle="MIZON 목표 매출·광고비와 현재 비용 배부율을 적용한 모델 손익을 확인합니다." />

      <section className="grid cards-4" style={{ marginTop: 0 }}>
        <article className="card kpi">
          <span className="label">3분기 목표 매출</span>
          <span className="value">{formatCurrency(forecastData.q3.revenue)}</span>
        </article>
        <article className="card kpi">
          <span className="label">4분기 목표 매출</span>
          <span className="value">{formatCurrency(forecastData.q4.revenue)}</span>
        </article>
        <article className="card kpi">
          <span className="label">3분기 목표 순이익</span>
          <span className="value">{formatCurrency(forecastData.q3.profit)}</span>
        </article>
        <article className="card kpi">
          <span className="label">4분기 목표 순이익</span>
          <span className="value">{formatCurrency(forecastData.q4.profit)}</span>
        </article>
      </section>

      <section className="grid cards-2" style={{ marginTop: 20 }}>
        <article className="card chart-card">
          <div className="chart-title"><div><h2>분기별 매출·광고비·순이익</h2><small>목표치</small></div></div>
          <canvas id="forecastDetailChart" />
        </article>
        <article className="card chart-card">
          <div className="chart-title"><div><h2>분기별 목표 마진율</h2><small>순이익 ÷ 매출</small></div></div>
          <canvas id="marginByQuarterChart" />
        </article>
      </section>

      {lastActualMonth && (
        <section className="card" style={{ marginTop: 20 }}>
          <div className="chart-title"><div><h2>목표 대비 페이스</h2><small>가장 최근 실적월({lastActualMonth.month}) 기준 환산</small></div></div>
          <p className="page-note">
            가장 최근 실적월인 <strong>{lastActualMonth.month}</strong> 매출 {formatCurrency(lastActualMonth.revenue)}을 3개월로 환산하면
            {' '}{formatCurrency(lastActualMonth.revenue * 3)}로, 3분기 목표 {formatCurrency(forecastData.q3.revenue)} 대비{' '}
            <strong>{q3Pace ?? '-'}%</strong> 페이스입니다. (단순 런레이트 환산이며 계절성·프로모션 효과는 반영되지 않았습니다.)
          </p>
        </section>
      )}

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>분기별 상세</h2><small>목표 매출·광고비·순이익·마진율·ROAS</small></div></div>
        <table className="table">
          <thead>
            <tr><th>분기</th><th>목표 매출</th><th>목표 광고비</th><th>목표 순이익</th><th>목표 마진율</th><th>ROAS</th></tr>
          </thead>
          <tbody>
            {quarters.map((q) => (
              <tr key={q.key}>
                <td>{q.label}</td>
                <td>{formatCurrency(q.revenue)}</td>
                <td>{formatCurrency(q.adSpend)}</td>
                <td>{formatCurrency(q.profit)}</td>
                <td>{q.marginPct.toFixed(1)}%</td>
                <td>{q.roas.toFixed(2)}x</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="page-note" style={{ fontSize: 12 }}>
          ※ 매출·광고비는 제공된 MIZON 분석리포트의 2026.08~12 목표 플랜이며, 순이익은 현재 비광고비 배부율을 적용한 모델값입니다.
          12월 매출 $150,000·광고비 $90,000은 리포트에서 원본 이상치를 대체한 검토값이므로 최종 목표 확정 전 재확인이 필요합니다.
        </p>
      </section>
    </>
  );
}

export default ForecastDetailPage;
