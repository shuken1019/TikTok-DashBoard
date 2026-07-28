import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import PageHeader from '../components/PageHeader';
import { getData } from '../api';
import { formatCurrency } from '../format';
import { overallAnalytics } from '../data/shopAnalytics';

Chart.register(...registerables);

const STEPS = 12;

function round2(n) {
  return Math.round(n * 100) / 100;
}

function BreakevenDetailPage() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [costItems, setCostItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [price, setPrice] = useState(0);
  const [productCost, setProductCost] = useState(0);
  const [overhead, setOverhead] = useState(0);
  const [fixedCost, setFixedCost] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const breakevenChartRef = useRef(null);
  const breakevenChartInstance = useRef(null);
  const cumulativeChartRef = useRef(null);
  const cumulativeChartInstance = useRef(null);
  const costMixChartRef = useRef(null);
  const costMixChartInstance = useRef(null);

  useEffect(() => {
    Promise.all([getData('monthly'), getData('costItems')]).then(([monthly, cost]) => {
      setMonthlyData(monthly);
      setCostItems(cost);
      setLoading(false);
    });
  }, []);

  const defaults = useMemo(() => {
    const units = overallAnalytics.itemsSold || 1;
    const avgPrice = round2(overallAnalytics.gmv / units);
    const productCostTotal = costItems.find((c) => c.label === '제품 원가')?.value || 0;
    const overheadTotal = costItems.filter((c) => c.label !== '제품 원가').reduce((s, c) => s + c.value, 0);
    const avgProductCost = round2(productCostTotal / units);
    const avgOverhead = round2(overheadTotal / units);
    const avgMonthlyAdSpend = monthlyData.length
      ? Math.round(monthlyData.reduce((s, m) => s + m.adSpend, 0) / monthlyData.length)
      : 0;
    const avgMonthlyUnits = monthlyData.length ? Math.round(units / monthlyData.length) : 0;
    return { avgPrice, avgProductCost, avgOverhead, avgMonthlyAdSpend, avgMonthlyUnits, totalUnits: units };
  }, [costItems, monthlyData]);

  function resetToDefaults() {
    setPrice(defaults.avgPrice);
    setProductCost(defaults.avgProductCost);
    setOverhead(defaults.avgOverhead);
    setFixedCost(defaults.avgMonthlyAdSpend);
  }

  useEffect(() => {
    if (!loading && !initialized && costItems.length && monthlyData.length) {
      resetToDefaults();
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, initialized, costItems, monthlyData]);

  const variableCostPerUnit = productCost + overhead;
  const contributionMargin = price - variableCostPerUnit;
  const contributionMarginPct = price ? (contributionMargin / price) * 100 : 0;
  const breakevenUnits = contributionMargin > 0 ? fixedCost / contributionMargin : null;
  const breakevenRevenue = breakevenUnits ? breakevenUnits * price : null;
  const unitGap = breakevenUnits ? Math.max(0, Math.ceil(breakevenUnits) - defaults.avgMonthlyUnits) : null;
  const requiredMultiple = breakevenUnits && defaults.avgMonthlyUnits ? breakevenUnits / defaults.avgMonthlyUnits : null;
  const breakevenGapText = breakevenUnits && defaults.avgMonthlyUnits
    ? (unitGap && unitGap > 0
        ? `현재 월평균 ${defaults.avgMonthlyUnits.toLocaleString('en-US')}개보다 ${unitGap.toLocaleString('en-US')}개 더 필요`
        : '현재 월평균 판매량으로도 월 손익분기에 도달할 수 있습니다')
    : '판매가가 원가와 부대비용의 합보다 낮아 계산이 어렵습니다';

  useEffect(() => {
    if (!initialized) return;
    const canvas = breakevenChartRef.current;
    if (!canvas) return;
    if (breakevenChartInstance.current) breakevenChartInstance.current.destroy();

    const maxUnits = breakevenUnits ? Math.ceil(breakevenUnits * 2.2) : Math.max(defaults.avgMonthlyUnits * 3, 100);
    const step = Math.max(1, Math.round(maxUnits / STEPS));
    const unitPoints = Array.from({ length: STEPS + 1 }, (_, i) => i * step);

    breakevenChartInstance.current = new Chart(canvas, {
      type: 'line',
      data: {
        labels: unitPoints,
        datasets: [
          { label: '매출', data: unitPoints.map((u) => u * price), borderColor: '#2563eb', backgroundColor: '#2563eb', pointRadius: 0, tension: 0 },
          { label: '총비용 (고정비+변동비)', data: unitPoints.map((u) => fixedCost + u * variableCostPerUnit), borderColor: '#dc2626', backgroundColor: '#dc2626', pointRadius: 0, tension: 0 },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: { callbacks: { title: (items) => `판매량 ${items[0].label}개` } },
        },
        scales: {
          x: { title: { display: true, text: '월 판매량 (개)' } },
          y: { title: { display: true, text: '$' }, ticks: { callback: (v) => '$' + Math.round(v / 1000) + 'k' } },
        },
      },
    });

    return () => breakevenChartInstance.current?.destroy();
  }, [initialized, price, variableCostPerUnit, fixedCost, breakevenUnits, defaults.avgMonthlyUnits]);

  useEffect(() => {
    if (loading) return;
    const canvas = cumulativeChartRef.current;
    if (!canvas) return;
    if (cumulativeChartInstance.current) cumulativeChartInstance.current.destroy();

    let cumRev = 0;
    let cumCost = 0;
    const cumRevSeries = [];
    const cumCostSeries = [];
    monthlyData.forEach((m) => {
      cumRev += m.revenue;
      cumCost += m.totalCost;
      cumRevSeries.push(round2(cumRev));
      cumCostSeries.push(round2(cumCost));
    });

    cumulativeChartInstance.current = new Chart(canvas, {
      type: 'line',
      data: {
        labels: monthlyData.map((m) => m.month),
        datasets: [
          { label: '누적 매출', data: cumRevSeries, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.12)', fill: true, tension: 0, pointRadius: 3 },
          { label: '누적 총비용', data: cumCostSeries, borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.08)', fill: true, tension: 0, pointRadius: 3 },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { ticks: { callback: (v) => '$' + Math.round(v / 1000) + 'k' } } },
      },
    });

    return () => cumulativeChartInstance.current?.destroy();
  }, [monthlyData, loading]);

  useEffect(() => {
    if (loading) return;
    const canvas = costMixChartRef.current;
    if (!canvas) return;
    if (costMixChartInstance.current) costMixChartInstance.current.destroy();

    const totalAdSpend = monthlyData.reduce((s, m) => s + m.adSpend, 0);
    const labels = [...costItems.map((c) => c.label), '광고비 (실제, 11월~7월 합계)'];
    const values = [...costItems.map((c) => c.value), totalAdSpend];

    costMixChartInstance.current = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: ['#8b5cf6', '#f59e0b', '#64748b', '#0ea5e9', '#a3a3a3', '#dc2626'] }],
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
    });

    return () => costMixChartInstance.current?.destroy();
  }, [costItems, monthlyData, loading]);

  if (loading || !initialized) return null;

  const cumRevTotal = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const cumCostTotal = monthlyData.reduce((s, m) => s + m.totalCost, 0);
  const gapNow = cumRevTotal - cumCostTotal;
  const sourceGap = Math.abs(cumRevTotal - overallAnalytics.gmv);
  const isLoss = gapNow < 0;

  return (
    <>
      <PageHeader
        title="손익분기점 분석"
        subtitle="지금까지 적자인지 확인하고, 월 적자를 피하려면 얼마나 팔아야 하는지 계산합니다."
      />

      <section className="card breakeven-hero">
        <div className="breakeven-hero-copy">
          <span className={`breakeven-status ${isLoss ? 'loss' : 'profit'}`}>{isLoss ? '아직 손익분기 전 · 누적 적자' : '손익분기 통과 · 누적 흑자'}</span>
          <p className="breakeven-eyebrow">지금까지 실제 손익</p>
          <h2>{isLoss ? `매출보다 비용이 ${formatCurrency(Math.abs(gapNow))} 더 큽니다.` : `매출이 비용보다 ${formatCurrency(gapNow)} 더 큽니다.`}</h2>
          <p className="breakeven-plain-definition"><strong>손익분기점</strong>은 매출과 총비용이 같아져 순이익이 정확히 $0이 되는 지점입니다. 이 지점을 넘으면 흑자, 넘지 못하면 적자입니다.</p>
        </div>
        <div className="breakeven-actual-grid">
          <article><span>누적 매출</span><strong>{formatCurrency(cumRevTotal)}</strong><small>11월~7월 월별 재무 데이터</small></article>
          <article><span>누적 총비용</span><strong>{formatCurrency(cumCostTotal)}</strong><small>원가·시딩·수수료·물류·광고 등</small></article>
          <article className={isLoss ? 'loss' : 'profit'}><span>현재 누적 손익</span><strong>{isLoss ? '-' : '+'}{formatCurrency(Math.abs(gapNow))}</strong><small>{isLoss ? '비용이 매출보다 큼' : '매출이 비용보다 큼'}</small></article>
        </div>
      </section>

      <section className="card breakeven-guide">
        <div className="chart-title"><div><h2>이 페이지는 이렇게 읽으면 됩니다</h2><small>실제 결과와 가정 계산기를 구분했습니다</small></div></div>
        <div className="breakeven-formula-grid">
          <article><b>1</b><div><strong>현재 결과 확인</strong><p>누적 매출 − 누적 총비용으로 지금 흑자인지 적자인지 봅니다.</p></div></article>
          <article><b>2</b><div><strong>1개 팔 때 남는 돈 계산</strong><p>판매가 − 제품 원가 − 개당 부대비용입니다.</p></div></article>
          <article><b>3</b><div><strong>필요 판매량 계산</strong><p>월 광고비 ÷ 1개 팔 때 남는 돈이 월 손익분기 판매량입니다.</p></div></article>
        </div>
      </section>

      <section className="card breakeven-simulator">
        <div className="chart-title"><div><h2>월 손익분기 What-if 계산기</h2><small>아래 숫자를 바꾸면 “월 적자를 피하려면 필요한 판매량”이 다시 계산됩니다</small></div><span className="breakeven-badge">가정 시뮬레이션</span></div>
        <div className="breakeven-summary-strip">
          <div className="breakeven-summary-pill actual">
            <span>실제 손익 기준</span>
            <strong>{isLoss ? `누적 적자 ${formatCurrency(Math.abs(gapNow))}` : `누적 흑자 ${formatCurrency(gapNow)}`}</strong>
            <small>월별 재무 데이터 기준 · 확정 실적</small>
          </div>
          <div className="breakeven-summary-pill simulation">
            <span>시뮬레이션 기준</span>
            <strong>{breakevenUnits ? `${Math.ceil(breakevenUnits).toLocaleString('en-US')}개` : '계산 불가'}</strong>
            <small>판매가·원가·부대비용 가정 · 잠정값</small>
          </div>
        </div>
        <div className="control-row" style={{ marginTop: 0, flexWrap: 'wrap' }}>
          <label>
            평균 판매가 ($/개)
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </label>
          <label>
            제품 원가 ($/개)
            <input type="number" step="0.01" value={productCost} onChange={(e) => setProductCost(Number(e.target.value))} />
          </label>
          <label>
            부대비용 ($/개, 시딩·수수료·물류·기타)
            <input type="number" step="0.01" value={overhead} onChange={(e) => setOverhead(Number(e.target.value))} />
          </label>
          <label>
            월 고정 광고비 ($)
            <input type="number" step="1" value={fixedCost} onChange={(e) => setFixedCost(Number(e.target.value))} />
          </label>
          <button type="button" onClick={resetToDefaults}>현재 기본값으로 재설정</button>
        </div>
        <div className="breakeven-formula-inline">
          <span>공헌이익 = 판매가 − 제품 원가 − 부대비용</span>
          <span>필요 판매량 = 월 광고비 ÷ 공헌이익</span>
        </div>
        <div className="breakeven-model-warning">
          <strong>⚠ 대표 보고 전 확인 필요</strong>
          <p>월별 재무 매출 <b>{formatCurrency(cumRevTotal)}</b>과 상품 판매수 집계의 GMV <b>{formatCurrency(overallAnalytics.gmv)}</b>가 <b>{formatCurrency(sourceGap)}</b> 차이 납니다. 따라서 아래 “개수 기준” 결과는 잠정 시뮬레이션이며, 대표 보고에는 위 실제 손익만 사용하세요.</p>
        </div>
      </section>

      <section className="grid cards-4" style={{ marginTop: 20 }}>
        <article className="card kpi">
          <span className="label">1개 팔 때 광고비 회수에 남는 돈 <span className="term-help" tabIndex="0" data-tooltip="판매가에서 제품 원가와 개당 부대비용을 뺀 금액입니다.">?</span></span>
          <span className="value">{formatCurrency(contributionMargin)}</span>
          <span className="desc">판매가의 {contributionMarginPct.toFixed(1)}% · {contributionMargin > 0 ? '한 개당 공헌이익이 남습니다' : '공헌이익이 없어 손익분기 계산이 어렵습니다'}</span>
        </article>
        <article className="card kpi">
          <span className="label">월 적자를 피하려면 필요한 판매량 <span className="term-help" tabIndex="0" data-tooltip="매출과 비용이 같아지는 최소 월 판매량입니다.">?</span></span>
          <span className="value">{breakevenUnits ? Math.ceil(breakevenUnits).toLocaleString('en-US') + '개' : '계산 불가'}</span>
          <span className="desc">{contributionMargin <= 0 ? '판매가가 원가+부대비용보다 낮습니다' : breakevenGapText}</span>
        </article>
        <article className="card kpi">
          <span className="label">월 적자를 피하려면 필요한 매출</span>
          <span className="value">{breakevenRevenue ? formatCurrency(breakevenRevenue) : '-'}</span>
        </article>
        <article className="card kpi">
          <span className="label">상품 데이터 기준 월평균 판매량</span>
          <span className="value">{defaults.avgMonthlyUnits.toLocaleString('en-US')}개</span>
          <span className="desc">{unitGap != null ? `잠정 기준 ${unitGap.toLocaleString('en-US')}개 부족` : ''}</span>
        </article>
      </section>

      <section className="card chart-card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>판매량이 늘면 언제 흑자가 되는가</h2><small><b className="blue-text">파란 매출선</b>이 <b className="red-text">빨간 비용선</b>을 넘어서는 지점부터 흑자입니다</small></div></div>
        <div className="breakeven-chart-shell"><canvas ref={breakevenChartRef} /></div>
        <div className="breakeven-result-callout">
          {breakevenUnits ? <>
            <strong>잠정 계산 결과: 월 {Math.ceil(breakevenUnits).toLocaleString('en-US')}개가 필요합니다.</strong>
            <span>상품 데이터 월평균 {defaults.avgMonthlyUnits.toLocaleString('en-US')}개보다 {unitGap.toLocaleString('en-US')}개 많고, 현재의 약 {requiredMultiple.toFixed(1)}배입니다. 판매가 {formatCurrency(price)} · 개당 원가와 부대비용 {formatCurrency(variableCostPerUnit)} · 월 광고비 {formatCurrency(fixedCost)} 가정입니다.</span>
          </> : <><strong>계산할 수 없습니다.</strong><span>판매가가 제품 원가와 부대비용의 합보다 커야 합니다.</span></>}
        </div>
      </section>

      <section className="grid cards-2" style={{ marginTop: 20 }}>
        <article className="card chart-card">
          <div className="chart-title"><div><h2>지금까지 실제 매출과 비용</h2><small>파란 매출선이 빨간 비용선을 넘지 못하면 아직 누적 적자입니다</small></div></div>
          <canvas ref={cumulativeChartRef} />
        </article>
        <article className="card chart-card">
          <div className="chart-title"><div><h2>어디에 비용이 쓰였나</h2><small>11월~7월 비용 항목별 합계</small></div></div>
          <canvas ref={costMixChartRef} />
        </article>
      </section>

      <section className="card breakeven-action-card" style={{ marginTop: 20 }}>
        <h2>경영 판단 요약</h2>
        <div className={`breakeven-action-status ${isLoss ? 'loss' : 'profit'}`}>
          <strong>{isLoss ? '현재 결론: 누적 적자' : '현재 결론: 누적 흑자'}</strong>
          <span>{isLoss ? `${formatCurrency(Math.abs(gapNow))}의 누적 격차를 줄여야 합니다.` : `${formatCurrency(gapNow)}의 누적 흑자입니다.`}</span>
        </div>
        <ul>
          <li><b>확정적으로 읽을 수 있는 값:</b> 월별 재무 데이터의 누적 매출 {formatCurrency(cumRevTotal)}, 누적 총비용 {formatCurrency(cumCostTotal)}.</li>
          <li><b>잠정으로만 읽을 값:</b> 상품 판매수 기반 월 필요 판매량. 매출 원천 간 {formatCurrency(sourceGap)} 차이가 있어 원천 정합 후 확정해야 합니다.</li>
          <li><b>개선 방향:</b> 판매가 인상, 제품 원가·시딩·수수료·물류비 절감, 광고비 효율 개선 중 어떤 조합으로 격차를 줄일지 What-if 계산기로 비교합니다.</li>
        </ul>
      </section>
    </>
  );
}

export default BreakevenDetailPage;
