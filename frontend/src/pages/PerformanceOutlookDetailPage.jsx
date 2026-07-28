import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import PageHeader from '../components/PageHeader';
import { getData } from '../api';
import { formatCurrency } from '../format';

Chart.register(...registerables);

const FORECAST_DASH = [6, 4];
const ACTUAL_MONTH_LABELS = ['2025.11', '2025.12', '2026.01', '2026.02', '2026.03', '2026.04', '2026.05', '2026.06', '2026.07'];

// User's own bottom-up monthly target plan (GMV Max campaign tracker), Aug~Dec.
// revenue/adSpend are the plan's own numbers; totalCost/profit are derived live below
// using the same non-ad-cost ratio as the rest of the app, so they stay in sync if
// costItems or actual revenue changes.
const MONTHLY_TARGETS = [
  { month: '2026.08', revenue: 27000, adSpend: 40000 },
  { month: '2026.09', revenue: 47000, adSpend: 48000 },
  { month: '2026.10', revenue: 67000, adSpend: 53333 },
  { month: '2026.11', revenue: 100000, adSpend: 60000 },
  { month: '2026.12', revenue: 150000, adSpend: 90000 },
];

function PerformanceOutlookDetailPage() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [costItems, setCostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    Promise.all([getData('monthly'), getData('costItems')]).then(([monthly, cost]) => {
      setMonthlyData(monthly);
      setCostItems(cost);
      setLoading(false);
    });
  }, []);

  // 실적 라인: 실제 9개월(11월~7월) + "목표 플랜" 기준 8~12월(사용자가 직접 잡은 월별 매출·광고비 목표).
  // 목표의 매출/광고비는 그대로 쓰고, 총비용/순이익은 실제 비용 항목 비율(비광고비 ÷ 전체 실적 매출)을
  // 적용해 계산한다 -- 그래야 광고비만 늘리면 무조건 흑자로 보이는 착시를 피할 수 있다.
  const outlook = useMemo(() => {
    if (!monthlyData.length) return null;
    const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
    const costItemsTotal = costItems.reduce((s, c) => s + c.value, 0);
    const nonAdRatio = totalRevenue ? costItemsTotal / totalRevenue : 0;

    const targetRows = MONTHLY_TARGETS.map((t) => {
      const nonAd = t.revenue * nonAdRatio;
      const totalCost = t.adSpend + nonAd;
      return { label: t.month, revenue: t.revenue, totalCost, profit: t.revenue - totalCost, actual: false };
    });

    const rows = [
      ...monthlyData.map((m, index) => ({ label: ACTUAL_MONTH_LABELS[index] || m.month, revenue: m.revenue, totalCost: m.totalCost, profit: m.revenue - m.totalCost, actual: true })),
      ...targetRows,
    ];

    const cumulativeLoss = monthlyData.reduce((s, m) => s + (m.revenue - m.totalCost), 0);
    const profitMonths = monthlyData.filter((m) => m.revenue - m.totalCost >= 0).length;
    const breakevenRow = targetRows.find((r) => r.profit >= 0);
    const q3 = targetRows.slice(0, 3).reduce((s, r) => s + r.profit, 0);
    const q4 = targetRows.slice(3, 5).reduce((s, r) => s + r.profit, 0);

    return { rows, targetRows, cumulativeLoss, profitMonths, breakevenRow, nonAdRatio, q3Profit: q3, q4Profit: q4 };
  }, [monthlyData, costItems]);

  useEffect(() => {
    if (loading || !outlook) return;
    const canvas = chartRef.current;
    if (!canvas) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const n = outlook.rows.length;
    const forecastStartIndex = n - MONTHLY_TARGETS.length;
    const dashSegment = (ctx) => (ctx.p1DataIndex >= forecastStartIndex ? FORECAST_DASH : undefined);

    chartInstance.current = new Chart(canvas, {
      type: 'line',
      data: {
        labels: outlook.rows.map((r) => r.label),
        datasets: [
          {
            label: '매출',
            data: outlook.rows.map((r) => r.revenue),
            borderColor: '#2563eb',
            backgroundColor: '#2563eb',
            segment: { borderDash: dashSegment },
            tension: 0,
            pointRadius: 3,
          },
          {
            label: '총비용',
            data: outlook.rows.map((r) => r.totalCost),
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b',
            segment: { borderDash: dashSegment },
            tension: 0,
            pointRadius: 3,
          },
          {
            label: '순이익',
            data: outlook.rows.map((r) => r.profit),
            borderColor: '#b91c1c',
            backgroundColor: 'transparent',
            segment: {
              borderDash: dashSegment,
              borderColor: (ctx) => (ctx.p1.parsed.y < 0 ? '#b91c1c' : '#047857'),
            },
            fill: false,
            tension: 0,
            borderWidth: 5,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBorderWidth: 2,
            pointBorderColor: '#ffffff',
            pointBackgroundColor: outlook.rows.map((r) => (r.profit < 0 ? '#b91c1c' : '#047857')),
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: { callback: (v) => '$' + Math.round(v / 1000) + 'k' },
            grid: {
              color: (ctx) => (ctx.tick.value === 0 ? '#475569' : 'rgba(148,163,184,0.28)'),
              lineWidth: (ctx) => (ctx.tick.value === 0 ? 3 : 1),
            },
          },
        },
      },
    });

    return () => {
      chartInstance.current?.destroy();
      chartInstance.current = null;
    };
  }, [outlook, loading]);

  if (loading || !outlook) return null;

  return (
    <>
      <PageHeader
        title="2025.11~2026.12 매출·광고비·손익 전망"
        subtitle="2025.11~2026.07 실제 실적과 2026.08~12 목표 플랜을 연결해 적자·흑자와 Forecast를 한눈에 확인합니다."
      />

      <section className="grid cards-4" style={{ marginTop: 0 }}>
        <article className="card kpi">
          <span className="label">누적 손익 (11월~7월 실적)</span>
          <span className="value" style={{ color: outlook.cumulativeLoss < 0 ? '#dc2626' : '#16a34a' }}>{formatCurrency(outlook.cumulativeLoss)}</span>
          <span className="desc">9개월 중 흑자 {outlook.profitMonths}개월</span>
        </article>
        <article className="card kpi">
          <span className="label">3분기 모델 손익 (2026.08~10)</span>
          <span className="value" style={{ color: outlook.q3Profit < 0 ? '#dc2626' : '#16a34a' }}>{formatCurrency(outlook.q3Profit)}</span>
        </article>
        <article className="card kpi">
          <span className="label">4분기 모델 손익 (2026.11~12)</span>
          <span className="value" style={{ color: outlook.q4Profit < 0 ? '#dc2626' : '#16a34a' }}>{formatCurrency(outlook.q4Profit)}</span>
        </article>
        <article className="card kpi">
          <span className="label">흑자 전환 시점</span>
          <span className="value">{outlook.breakevenRow ? outlook.breakevenRow.label : '12월까지도 없음'}</span>
          <span className="desc">목표 플랜(2026.08~12) 기준</span>
        </article>
      </section>

      <section className="card chart-card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>매출 vs 총비용 vs 순이익 (실적 + Forecast)</h2><small>실선 = 2025.11~2026.07 실제 · 점선 = 2026.08~12 목표 플랜</small></div></div>
        <div className="outlook-chart-guide" aria-label="그래프 색상과 선 설명">
          <div className="outlook-guide-colors">
            <span><i className="blue" /><strong>매출</strong></span>
            <span><i className="orange" /><strong>총비용</strong></span>
            <span><i className="red" /><strong>순손실 · 적자</strong><small>순이익이 0원 미만</small></span>
            <span><i className="green" /><strong>순이익 · 흑자</strong><small>순이익이 0원 이상</small></span>
          </div>
          <div className="outlook-guide-lines">
            <span><i className="solid" />실제 실적</span>
            <span><i className="dashed" />목표 플랜</span>
          </div>
        </div>
        <div className="outlook-profit-status">
          <strong className="loss">● 현재 실적: 9개월 연속 적자</strong>
          <strong className="profit">
            ● 목표 플랜: {outlook.breakevenRow ? `${outlook.breakevenRow.label}부터 월 흑자` : '12월까지 월 흑자 없음'}
          </strong>
        </div>
        <canvas ref={chartRef} />
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>이 목표대로 되면?</h2><small>8~12월 월별 목표 매출·광고 예산 기준 해석</small></div></div>
        <p className="page-note">
          지금까지 <strong>9개월 연속 적자</strong>이며 누적 손실은 {formatCurrency(outlook.cumulativeLoss)}입니다. 2026.08~12 목표 플랜(매출을 8월 $27,000에서
          12월 $150,000까지 끌어올리는 계획)을 그대로 달성한다고 가정하면, {outlook.breakevenRow
            ? <><strong>{outlook.breakevenRow.label}</strong>에 처음으로 월 단위 흑자로 전환됩니다.</>
            : ' 12월까지도 흑자 전환이 어렵습니다.'}
          {' '}모델 순이익은 목표 광고비와 현재 비광고비 배부율을 적용한 계산값입니다. 매출 목표 자체보다 매출 대비 광고 예산 비중과 실제 원가·수수료를 함께 관리해야 합니다.
        </p>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>월별 상세</h2><small>매출·총비용·순이익·상태</small></div></div>
        <table className="table">
          <thead>
            <tr><th>구분</th><th>매출</th><th>총비용</th><th>순이익(적자)</th><th>상태</th></tr>
          </thead>
          <tbody>
            {outlook.rows.map((r, i) => (
              <tr key={`${r.label}-${i}`} style={!r.actual ? { opacity: 0.85 } : undefined}>
                <td>{r.label}{!r.actual && ' (목표)'}</td>
                <td>{formatCurrency(r.revenue)}</td>
                <td>{formatCurrency(r.totalCost)}</td>
                <td>{formatCurrency(r.profit)}</td>
                <td><span className={`badge ${r.profit < 0 ? 'bad' : 'good'}`}>{r.profit < 0 ? '적자' : '흑자'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="page-note" style={{ fontSize: 12 }}>
          ※ 2026.08~12 매출·광고 예산은 제공된 MIZON 분석리포트의 목표 플랜을 사용했습니다. 총비용은 광고 예산 +
          비광고비 비율({(outlook.nonAdRatio * 100).toFixed(1)}%, 실제 비용 항목 데이터 기준)을 적용해 계산했으며, Admin의 forecast 리소스도
          이 값(3분기 모델 손익 {formatCurrency(outlook.q3Profit)} / 4분기 모델 손익 {formatCurrency(outlook.q4Profit)})으로 갱신되어 있습니다.
          12월 매출 $150,000·광고비 $90,000은 리포트에서 원본 이상치를 대체한 검토값이므로 최종 목표 확정 전 재확인이 필요합니다.
        </p>
      </section>
    </>
  );
}

export default PerformanceOutlookDetailPage;
