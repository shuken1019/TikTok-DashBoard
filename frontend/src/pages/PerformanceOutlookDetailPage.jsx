import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { getData } from '../api';
import { formatCurrency, formatMoney } from '../format';

Chart.register(...registerables);

const FORECAST_DASH = [6, 4];
const ACTUAL_MONTH_LABELS = ['2025.11', '2025.12', '2026.01', '2026.02', '2026.03', '2026.04', '2026.05', '2026.06', '2026.07', '2026.08'];
const hasCompleteCostData = (item) => item?.costStatus !== 'missing' && item?.adSpend !== null && item?.adSpend !== undefined && item?.totalCost !== null && item?.totalCost !== undefined;

// Fallback copy of TikTok_Shop_예산_ROI_플랜_2026-08_2027-12.xlsx.
// revenue/adSpend are the plan's own numbers; totalCost/profit are derived live below
// using the same non-ad-cost ratio as the rest of the app, so they stay in sync if
// costItems or actual revenue changes.
const MONTHLY_TARGETS = [
  ['2026.08', 20000, 33333], ['2026.09', 25000, 40000], ['2026.10', 30000, 40000],
  ['2026.11', 50000, 58800], ['2026.12', 50000, 47600], ['2027.01', 55000, 47800],
  ['2027.02', 60000, 48000], ['2027.03', 70000, 51850], ['2027.04', 90000, 60000],
  ['2027.05', 100000, 62500], ['2027.06', 115000, 67650], ['2027.07', 125000, 69450],
  ['2027.08', 150000, 78950], ['2027.09', 160000, 80000], ['2027.10', 175000, 83350],
  ['2027.11', 190000, 86350], ['2027.12', 200000, 86950],
].map(([month, revenue, adSpend]) => ({ month, revenue, adSpend }));

function PerformanceOutlookDetailPage() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [costItems, setCostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleSeries, setVisibleSeries] = useState({
    revenue: true, ad: true, cost: true, profit: true,
  });
  const [outlookStartMonth, setOutlookStartMonth] = useState('2025-11');
  const [outlookEndMonth, setOutlookEndMonth] = useState('2027-12');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    Promise.all([getData('monthly'), getData('costItems')]).then(([monthly, cost]) => {
      setMonthlyData(monthly);
      setCostItems(cost);
      setLoading(false);
    });
  }, []);

  // 실적 라인: 실제 9개월(11월~7월) + 2026.08~2027.12 목표 플랜.
  // 목표의 매출/광고비는 그대로 쓰고, 총비용/순이익은 실제 비용 항목 비율(비광고비 ÷ 전체 실적 매출)을
  // 적용해 계산한다 -- 그래야 광고비만 늘리면 무조건 흑자로 보이는 착시를 피할 수 있다.
  const outlook = useMemo(() => {
    if (!monthlyData.length) return null;
    const actualRows = monthlyData.filter((item) => Number(item.revenue || 0) !== 0 || Number(item.adSpend || 0) !== 0 || Number(item.totalCost || 0) !== 0);
    const savedTargets = monthlyData
      .filter((item) => Number(item.targetRevenue || 0) !== 0 || Number(item.targetAdSpend || 0) !== 0)
      .map((item) => ({ month: String(item.month).replace('-', '.'), revenue: Number(item.targetRevenue) || 0, adSpend: Number(item.targetAdSpend) || 0 }));
    const targetSource = savedTargets.length ? savedTargets : MONTHLY_TARGETS;
    const completeActualRows = actualRows.filter(hasCompleteCostData);
    const totalRevenue = completeActualRows.reduce((s, m) => s + m.revenue, 0);
    const costItemsTotal = costItems.reduce((s, c) => s + c.value, 0);
    const nonAdRatio = totalRevenue ? costItemsTotal / totalRevenue : 0;

    const targetRows = targetSource.map((t) => {
      const nonAd = t.revenue * nonAdRatio;
      const totalCost = t.adSpend + nonAd;
      return { label: t.month, revenue: t.revenue, adSpend: t.adSpend, afterAdProfit: t.revenue - t.adSpend, totalCost, profit: t.revenue - totalCost, actual: false };
    });

    const rows = [
      ...actualRows.map((m, index) => {
        const costComplete = hasCompleteCostData(m);
        return { label: String(m.month).includes('-') ? String(m.month).replace('-', '.') : (ACTUAL_MONTH_LABELS[index] || m.month), revenue: m.revenue, adSpend: costComplete ? m.adSpend : null, afterAdProfit: costComplete ? m.revenue - m.adSpend : null, totalCost: costComplete ? m.totalCost : null, profit: costComplete ? m.revenue - m.totalCost : null, actual: true, costComplete, actualThrough: m.actualThrough };
      }),
      ...targetRows,
    ];

    const cumulativeLoss = completeActualRows.reduce((s, m) => s + (m.revenue - m.totalCost), 0);
    const profitMonths = completeActualRows.filter((m) => m.revenue - m.totalCost >= 0).length;
    const breakevenRow = targetRows.find((r) => r.profit >= 0);
    const q3 = targetRows.filter((r) => r.label.startsWith('2026.')).reduce((s, r) => s + r.profit, 0);
    const q4 = targetRows.filter((r) => r.label.startsWith('2027.')).reduce((s, r) => s + r.profit, 0);
    const targetRevenue = targetRows.reduce((s, r) => s + r.revenue, 0);
    const targetBudget = targetRows.reduce((s, r) => s + r.adSpend, 0);
    const actualRevenue = actualRows.reduce((s, m) => s + m.revenue, 0);
    const actualAdSpend = completeActualRows.reduce((s, m) => s + m.adSpend, 0);
    const actualTotalCost = completeActualRows.reduce((s, m) => s + m.totalCost, 0);

    return { rows, targetRows, cumulativeLoss, profitMonths, breakevenRow, nonAdRatio, q3Profit: q3, q4Profit: q4, targetRevenue, targetBudget, actualRevenue, actualAdSpend, actualTotalCost, completeActualMonthCount: completeActualRows.length, incompleteActualMonthCount: actualRows.length - completeActualRows.length };
  }, [monthlyData, costItems]);

  const visibleRows = useMemo(() => {
    if (!outlook) return [];
    return outlook.rows.filter((row) => {
      const month = String(row.label).replace('.', '-');
      return month >= outlookStartMonth && month <= outlookEndMonth;
    });
  }, [outlook, outlookStartMonth, outlookEndMonth]);

  const changeOutlookMonth = (side, value) => {
    if (side === 'start') {
      setOutlookStartMonth(value);
      if (value > outlookEndMonth) setOutlookEndMonth(value);
    } else {
      setOutlookEndMonth(value);
      if (value < outlookStartMonth) setOutlookStartMonth(value);
    }
  };

  const setOutlookPreset = (start, end) => {
    setOutlookStartMonth(start);
    setOutlookEndMonth(end);
  };

  useEffect(() => {
    if (loading || !outlook) return;
    const canvas = chartRef.current;
    if (!canvas) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const firstForecastIndex = visibleRows.findIndex((row) => !row.actual);
    const dashSegment = (ctx) => (firstForecastIndex !== -1 && ctx.p1DataIndex >= firstForecastIndex ? FORECAST_DASH : undefined);

    chartInstance.current = new Chart(canvas, {
      type: 'line',
      data: {
        labels: visibleRows.map((r) => r.label),
        datasets: [
          {
            label: '매출',
            hidden: !visibleSeries.revenue,
            data: visibleRows.map((r) => r.revenue),
            borderColor: '#2563eb',
            backgroundColor: '#2563eb',
            segment: { borderDash: dashSegment },
            spanGaps: true,
            tension: 0,
            pointRadius: 3,
          },
          {
            label: '광고비 / 마케팅 예산',
            hidden: !visibleSeries.ad,
            data: visibleRows.map((r) => r.adSpend),
            borderColor: '#7c3aed',
            backgroundColor: '#7c3aed',
            segment: { borderDash: dashSegment },
            spanGaps: true,
            tension: 0,
            pointRadius: 3,
          },
          {
            label: '총비용',
            hidden: !visibleSeries.cost,
            data: visibleRows.map((r) => r.totalCost),
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b',
            segment: { borderDash: dashSegment },
            spanGaps: true,
            tension: 0,
            pointRadius: 3,
          },
          {
            label: '추정 순수익',
            hidden: !visibleSeries.profit,
            data: visibleRows.map((r) => r.profit),
            borderColor: '#b91c1c',
            backgroundColor: 'transparent',
            segment: {
              borderDash: dashSegment,
              borderColor: (ctx) => (ctx.p1.parsed.y < 0 ? '#b91c1c' : '#047857'),
            },
            spanGaps: true,
            fill: false,
            tension: 0,
            borderWidth: 5,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBorderWidth: 2,
            pointBorderColor: '#ffffff',
            pointBackgroundColor: visibleRows.map((r) => (r.profit < 0 ? '#b91c1c' : '#047857')),
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
  }, [outlook, loading, visibleSeries, visibleRows]);

  if (loading || !outlook) return null;

  return (
    <>
      <PageHeader
        title="2025.11~2027.12 매출·광고비·손익 전망"
        subtitle="2025.11~2026.07 마감 실적, 2026.08은 8/17까지 Total Revenue 부분 실적, 이후 예산·ROI 플랜입니다."
      />

      <section className="detail-edit-bar">
        <span>2026.08 Total Revenue는 8/1~8/17 $25,439.99, 정산액은 $11,404.27입니다. 광고비는 8/1~8/18 $35,235.56이므로 총비용·손익 계산은 보류합니다.</span>
        <Link to="/admin?tab=monthly" className="detail-edit-button">월별 데이터 수정</Link>
      </section>

      <section className="grid cards-4" style={{ marginTop: 0 }}>
        <article className="card kpi">
          <span className="label">① 누적 Total Revenue</span>
          <span className="value">{formatMoney(outlook.actualRevenue)}</span>
          <span className="desc">2025.11~2026.08.17 정산 매출</span>
        </article>
        <article className="card kpi">
          <span className="label">② 확인된 누적 광고비</span>
          <span className="value">{formatMoney(outlook.actualAdSpend)}</span>
          <span className="desc">Campaign 실제 집행액</span>
        </article>
        <article className="card kpi">
          <span className="label">③ 확인된 누적 총비용</span>
          <span className="value">{formatMoney(outlook.actualTotalCost)}</span>
          <span className="desc">광고비 + 기타 비용 배부</span>
        </article>
        <article className="card kpi">
          <span className="label">④ 추정 순수익</span>
          <span className="value" style={{ color: outlook.cumulativeLoss < 0 ? '#dc2626' : '#16a34a' }}>{formatMoney(outlook.cumulativeLoss)}</span>
          <span className="desc">비용 확인 {outlook.completeActualMonthCount}개월 중 흑자 {outlook.profitMonths}개월 · 8월 보류</span>
        </article>
      </section>

      <section className="grid cards-2" style={{ marginTop: 20 }}>
        <article className="card kpi">
          <span className="label">⑤ 2026.08~2027.12 매출 목표</span>
          <span className="value">{formatMoney(outlook.targetRevenue)}</span>
          <span className="desc">17개월 목표 매출 합계</span>
        </article>
        <article className="card kpi">
          <span className="label">⑥ 2026.08~2027.12 마케팅 예산</span>
          <span className="value">{formatMoney(outlook.targetBudget)}</span>
          <span className="desc">광고비 + 어필리에이터 수수료 기준</span>
        </article>
      </section>

      <section className="grid cards-3" style={{ marginTop: 20 }}>
        <article className="card kpi"><span className="label">2026 하반기 모델 순수익</span><span className="value" style={{ color: outlook.q3Profit < 0 ? '#dc2626' : '#16a34a' }}>{formatCurrency(outlook.q3Profit)}</span></article>
        <article className="card kpi"><span className="label">2027 연간 모델 순수익</span><span className="value" style={{ color: outlook.q4Profit < 0 ? '#dc2626' : '#16a34a' }}>{formatCurrency(outlook.q4Profit)}</span></article>
        <article className="card kpi"><span className="label">흑자 전환 시점</span><span className="value">{outlook.breakevenRow ? outlook.breakevenRow.label : '계획 기간 내 없음'}</span><span className="desc">마케팅 예산 + 비광고비 모델</span></article>
      </section>

      <section className="card chart-card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>매출 vs 광고비 vs 총비용 vs 추정 순수익</h2><small>광고비와 광고비를 포함한 총비용을 별도 선으로 비교합니다.</small></div></div>
        <div className="outlook-month-filter" aria-label="그래프 조회 기간">
          <div>
            <span>조회 기간</span>
            <strong>{outlookStartMonth} ~ {outlookEndMonth} · {visibleRows.length}개월</strong>
          </div>
          <label>시작월<input type="month" min="2025-11" max="2027-12" value={outlookStartMonth} onChange={(event) => changeOutlookMonth('start', event.target.value)} /></label>
          <span className="range-separator">→</span>
          <label>종료월<input type="month" min="2025-11" max="2027-12" value={outlookEndMonth} onChange={(event) => changeOutlookMonth('end', event.target.value)} /></label>
          <div className="outlook-month-presets">
            <button type="button" onClick={() => setOutlookPreset('2025-11', '2027-12')}>전체 기간</button>
            <button type="button" onClick={() => setOutlookPreset('2026-01', '2026-12')}>2026년</button>
            <button type="button" onClick={() => setOutlookPreset('2027-01', '2027-12')}>2027년</button>
          </div>
        </div>
        <div className="outlook-chart-guide" aria-label="그래프 색상과 선 설명">
          <div className="outlook-guide-colors">
            <span><i className="blue" /><strong>매출</strong></span>
            <span><i className="purple" /><strong>광고비</strong></span>
            <span><i className="orange" /><strong>총비용</strong></span>
            <span><i className="red" /><strong>순손실 · 적자</strong><small>순이익이 0원 미만</small></span>
            <span><i className="green" /><strong>순이익 · 흑자</strong><small>순이익이 0원 이상</small></span>
          </div>
          <div className="outlook-guide-lines">
            <span><i className="solid" />실제 실적</span>
            <span><i className="dashed" />목표 플랜</span>
          </div>
        </div>
        <div className="outlook-series-toggles" aria-label="그래프 항목 표시 선택">
          <span>그래프 항목</span>
          {[
            ['revenue', 'revenue', '● 매출'],
            ['ad', 'ad', '● 광고비·마케팅 예산'],
            ['cost', 'cost', '● 총비용'],
            ['profit', 'profit', '● 추정 순수익'],
          ].map(([key, tone, label]) => (
            <button
              type="button"
              key={key}
              className={`${tone}${visibleSeries[key] ? ' active' : ''}`}
              aria-pressed={visibleSeries[key]}
              onClick={() => setVisibleSeries((current) => ({ ...current, [key]: !current[key] }))}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="show-all"
            onClick={() => setVisibleSeries({ revenue: true, ad: true, cost: true, profit: true })}
          >
            전체 보기
          </button>
        </div>
        <div className="outlook-profit-status">
          <strong className="loss">● 비용 확인 {outlook.completeActualMonthCount}개월 연속 적자 · 8월 손익 보류</strong>
          <strong className="profit">
            ● 목표 플랜: {outlook.breakevenRow ? `${outlook.breakevenRow.label}부터 월 흑자` : '계획 기간 내 월 흑자 없음'}
          </strong>
        </div>
        <canvas ref={chartRef} />
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>이 목표대로 되면?</h2><small>2026.08~2027.12 목표 매출·마케팅 예산 기준</small></div></div>
        <p className="page-note">
          비용이 확인된 <strong>{outlook.completeActualMonthCount}개월 연속 적자</strong>이며 누적 손실은 {formatMoney(outlook.cumulativeLoss)}입니다. 2026년 8월은 매출과 광고비 종료일이 달라 손익에서 제외했습니다. 새 17개월 플랜(2026년 8월 $20,000에서
          2027년 12월 $200,000까지 성장)을 그대로 달성한다고 가정하면, {outlook.breakevenRow
            ? <><strong>{outlook.breakevenRow.label}</strong>에 처음으로 월 단위 흑자로 전환됩니다.</>
            : ' 계획 기간 안에도 흑자 전환이 어렵습니다.'}
          {' '}원본 ROI는 매출 ÷ 마케팅 예산이며, 모델 순이익은 마케팅 예산에 현재 비광고비 배부율까지 추가한 계산값입니다.
        </p>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>월별 상세</h2><small>실적과 목표·예산을 분리해 비교합니다.</small></div></div>
        <table className="table">
          <thead>
            <tr><th>구분</th><th>데이터</th><th>매출 실적</th><th>매출 목표</th><th>광고비 실적</th><th>마케팅 예산</th><th>원본 마케팅 ROI</th><th>예산 차감 후</th><th>마케팅 예산 포함 총비용</th><th>추정 순수익</th><th>상태</th></tr>
          </thead>
          <tbody>
            {visibleRows.map((r, i) => (
              <tr key={`${r.label}-${i}`} style={!r.actual ? { opacity: 0.85 } : undefined}>
                <td>{r.label}{!r.actual && ' (목표)'}</td>
                <td><span className={`badge ${r.actual ? 'good' : 'warn'}`}>{r.actual ? '실적' : '목표'}</span></td>
                <td>{r.actual ? formatMoney(r.revenue) : '—'}</td>
                <td>{r.actual ? '—' : formatMoney(r.revenue)}</td>
                <td>{r.actual ? (r.costComplete ? formatMoney(r.adSpend) : '미수집') : '—'}</td>
                <td>{r.actual ? '—' : formatMoney(r.adSpend)}</td>
                <td>{r.actual ? '—' : `${(r.revenue / r.adSpend).toFixed(2)}x`}</td>
                <td>{r.afterAdProfit === null ? '계산 보류' : formatMoney(r.afterAdProfit)}</td>
                <td>{r.totalCost === null ? '미수집' : formatMoney(r.totalCost)}</td>
                <td>{r.profit === null ? <strong>계산 보류</strong> : <strong style={{ color: r.profit < 0 ? '#b91c1c' : '#047857' }}>{formatMoney(r.profit)}</strong>}</td>
                <td>{r.profit === null ? <span className="badge warn">비용 필요</span> : <span className={`badge ${r.profit < 0 ? 'bad' : 'good'}`}>{r.profit < 0 ? '적자' : '흑자'}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="page-note" style={{ fontSize: 12 }}>
          ※ 2026.08 Total Revenue는 8/17까지 $25,439.99, 정산액은 $11,404.27이며 광고비는 8/18까지 $35,235.56입니다. 종료일을 맞출 때까지 총비용·손익에 사용하지 않습니다.
          화면의 총비용·모델 순이익은 현재 비광고비 비율 {(outlook.nonAdRatio * 100).toFixed(1)}%를 추가 적용한 내부 시뮬레이션입니다.
        </p>
      </section>
    </>
  );
}

export default PerformanceOutlookDetailPage;
