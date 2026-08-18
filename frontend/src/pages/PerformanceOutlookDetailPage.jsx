import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import AdRecoveryDashboard from '../components/AdRecoveryDashboard';
import { getData } from '../api';
import { formatCurrency, formatMoney } from '../format';

Chart.register(...registerables);

const FORECAST_DASH = [6, 4];
const DECEMBER_MINIMUM_PROFIT = 5000;
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
    // 비광고비 스냅샷은 현재까지 확인된 전체 Total Revenue 대비 비율로 환산한다.
    // 8월 손익은 종료일 불일치로 제외하지만, 검증된 8월 매출 자체는 비율 분모에 포함한다.
    const totalRevenue = actualRows.reduce((s, m) => s + m.revenue, 0);
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
    const decemberSource = targetRows.find((r) => r.label === '2026.12');
    const decemberBreakEvenRevenue = decemberSource && nonAdRatio < 1
      ? decemberSource.adSpend / (1 - nonAdRatio)
      : null;
    const decemberRequiredRevenue = decemberSource && nonAdRatio < 1
      ? (decemberSource.adSpend + DECEMBER_MINIMUM_PROFIT) / (1 - nonAdRatio)
      : null;
    const decemberManagementRevenue = decemberRequiredRevenue
      ? Math.ceil(decemberRequiredRevenue / 5000) * 5000
      : null;
    const decemberManagementProfit = decemberSource && decemberManagementRevenue
      ? decemberManagementRevenue - decemberSource.adSpend - decemberManagementRevenue * nonAdRatio
      : null;
    const decemberAdCapAtSourceRevenue = decemberSource
      ? Math.max(0, decemberSource.revenue * (1 - nonAdRatio) - DECEMBER_MINIMUM_PROFIT)
      : null;
    const decemberManagementRoas = decemberSource && decemberManagementRevenue
      ? decemberManagementRevenue / decemberSource.adSpend
      : null;
    const decemberPlan = decemberSource ? {
      sourceRevenue: decemberSource.revenue,
      sourceAdSpend: decemberSource.adSpend,
      sourceProfit: decemberSource.profit,
      breakEvenRevenue: decemberBreakEvenRevenue,
      requiredRevenue: decemberRequiredRevenue,
      managementRevenue: decemberManagementRevenue,
      managementProfit: decemberManagementProfit,
      adCapAtSourceRevenue: decemberAdCapAtSourceRevenue,
      managementRoas: decemberManagementRoas,
      weeklyRevenue: decemberManagementRevenue / 4,
      weeklyAdSpend: decemberSource.adSpend / 4,
    } : null;
    const q3 = targetRows.filter((r) => r.label.startsWith('2026.')).reduce((s, r) => s + r.profit, 0);
    const q4 = targetRows.filter((r) => r.label.startsWith('2027.')).reduce((s, r) => s + r.profit, 0);
    const targetRevenue = targetRows.reduce((s, r) => s + r.revenue, 0);
    const targetBudget = targetRows.reduce((s, r) => s + r.adSpend, 0);
    const actualRevenue = actualRows.reduce((s, m) => s + m.revenue, 0);
    const actualAdSpend = completeActualRows.reduce((s, m) => s + m.adSpend, 0);
    const actualTotalCost = completeActualRows.reduce((s, m) => s + m.totalCost, 0);

    return { rows, targetRows, cumulativeLoss, profitMonths, breakevenRow, decemberPlan, nonAdRatio, q3Profit: q3, q4Profit: q4, targetRevenue, targetBudget, actualRevenue, actualAdSpend, actualTotalCost, completeActualMonthCount: completeActualRows.length, incompleteActualMonthCount: actualRows.length - completeActualRows.length };
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

      <AdRecoveryDashboard />

      <section className="grid cards-4 legacy-outlook-summary" style={{ marginTop: 0 }}>
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

      <section className="grid cards-2 legacy-outlook-summary" style={{ marginTop: 20 }}>
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

      <section className="grid cards-3 legacy-outlook-summary" style={{ marginTop: 20 }}>
        <article className="card kpi"><span className="label">12월 기존 계획 손익</span><span className="value" style={{ color: '#dc2626' }}>{formatCurrency(outlook.decemberPlan.sourceProfit)}</span><span className="desc">매출 $50k · 마케팅 예산 $47.6k</span></article>
        <article className="card kpi"><span className="label">12월 손익분기 매출</span><span className="value">{formatCurrency(outlook.decemberPlan.breakEvenRevenue)}</span><span className="desc">현재 예산과 비광고비 비율 유지 시</span></article>
        <article className="card kpi"><span className="label">12월 필수 관리 목표</span><span className="value" style={{ color: '#047857' }}>{formatCurrency(outlook.decemberPlan.managementRevenue)}</span><span className="desc">광고비 ≤$47.6k · 추정 이익 {formatCurrency(outlook.decemberPlan.managementProfit)}</span></article>
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
          <strong className="loss">● 기존 12월 계획: 매출 $50k → 추정 {formatCurrency(outlook.decemberPlan.sourceProfit)}</strong>
          <strong className="profit">
            ● 필수 관리안: 매출 ≥{formatCurrency(outlook.decemberPlan.managementRevenue)} · 광고비 ≤{formatCurrency(outlook.decemberPlan.sourceAdSpend)} → 추정 {formatCurrency(outlook.decemberPlan.managementProfit)}
          </strong>
        </div>
        <canvas ref={chartRef} />
      </section>

      <section className="card december-profit-plan legacy-outlook-summary" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>12월 안에 흑자를 내는 실행안</h2><small>기존 예산은 유지하되 매출·상품 마진·주간 집행 기준을 동시에 관리합니다.</small></div><span className="badge good">12월 월 이익 ≥ $5k</span></div>
        <p className="page-note">
          현재 12월 원본 계획은 매출 {formatCurrency(outlook.decemberPlan.sourceRevenue)}, 마케팅 예산 {formatCurrency(outlook.decemberPlan.sourceAdSpend)}로 추정 손익이 <strong>{formatCurrency(outlook.decemberPlan.sourceProfit)}</strong>입니다.
          반드시 흑자를 내려면 12월 매출을 최소 {formatCurrency(outlook.decemberPlan.requiredRevenue)}까지 높여야 하며, 운영 목표는 여유를 두고 <strong>매출 {formatCurrency(outlook.decemberPlan.managementRevenue)} 이상</strong>으로 잡습니다.
          같은 매출 $50k를 유지한다면 광고비를 <strong>{formatCurrency(outlook.decemberPlan.adCapAtSourceRevenue)} 이하</strong>로 낮춰야 월 이익 $5k가 남습니다.
        </p>
        <div className="december-plan-grid">
          <article><b>1</b><div><strong>적자 상품·할인 중단</strong><p>원가와 수수료를 포함해 이익이 남는 SKU만 광고합니다. Collagen Booster Set의 $25.19 프로모션가는 손익분기 가격 $41.68보다 낮아 재가격 또는 제외가 필요합니다.</p></div></article>
          <article><b>2</b><div><strong>광고비 상한 고정</strong><p>12월 광고비는 $47.6k를 넘기지 않고, 전체 매출÷광고비를 {outlook.decemberPlan.managementRoas.toFixed(2)}x 이상으로 유지합니다.</p></div></article>
          <article><b>3</b><div><strong>주간 목표로 쪼개기</strong><p>매주 매출 {formatCurrency(outlook.decemberPlan.weeklyRevenue)} 이상, 광고비 {formatCurrency(outlook.decemberPlan.weeklyAdSpend)} 이하를 확인합니다. 미달 캠페인은 다음 주 예산을 줄입니다.</p></div></article>
          <article><b>4</b><div><strong>GMV가 아닌 이익으로 증액</strong><p>광고·어필리에이터·샘플은 매출이 아니라 제품 원가와 수수료까지 뺀 기여이익이 플러스인 조합에만 추가 예산을 배정합니다.</p></div></article>
        </div>
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
