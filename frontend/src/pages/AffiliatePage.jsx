import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import PageHeader from '../components/PageHeader';
import { formatCurrency, formatMoney } from '../format';
import {
  affiliateLiveMonthly,
  affiliateMonthly,
  affiliateCurrentPeriod,
  affiliateJulyProducts,
  affiliateSnapshot,
  affiliateWeekly,
  topAffiliateVideos,
} from '../data/affiliateData';
import {
  affiliateMonthlyPlan,
  affiliatePlanTotals,
  affiliatePlanningAssumptions,
  affiliateProductSamplePlan,
} from '../data/affiliatePlanningData';

Chart.register(...registerables);

const pct = (value) => `${value.toFixed(1)}%`;
const number = (value) => new Intl.NumberFormat('en-US').format(value);
const daysInMonth = (month) => {
  const [year, value] = month.split('-').map(Number);
  return new Date(year, value, 0).getDate();
};

function Delta({ value, suffix = '' }) {
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  return (
    <span className={`affiliate-delta ${direction}`}>
      {value > 0 ? '▲' : value < 0 ? '▼' : '–'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

const affiliateModes = {
  overview: ['어필리에이터 대시보드', '핵심 성과와 오늘의 실행 우선순위를 한눈에 확인합니다.'],
  samples: ['샘플·제품 계획', '제품별 샘플 발송에서 영상·매출·발주·비용까지 연결합니다.'],
  creators: ['크리에이터 관리', '크리에이터 풀과 콘텐츠 생산량, 협업 운영 기준을 관리합니다.'],
  content: ['영상 성과 분석', '판매 영상 순위와 잘 팔리는 이유, 개선 기준을 확인합니다.'],
  finance: ['어필리에이터 매출·비용·ROI', '귀속 매출과 수수료·샘플비, ROI 구조를 확인합니다.'],
};

function AffiliatePage({ mode = 'overview' }) {
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');
  const [contentView, setContentView] = useState('video');
  const [targetCreators, setTargetCreators] = useState(60);
  const [videosPerCreator, setVideosPerCreator] = useState(1.5);
  const [planGranularity, setPlanGranularity] = useState('month');
  const [planStartDate, setPlanStartDate] = useState('2026-08-01');
  const [planEndDate, setPlanEndDate] = useState('2027-12-31');
  const [planStartMonth, setPlanStartMonth] = useState('2026-08');
  const [planEndMonth, setPlanEndMonth] = useState('2027-12');
  const chartInstances = useRef({});

  const expectedVideos = Math.round(targetCreators * videosPerCreator);
  const attributedShare = (affiliateSnapshot.creatorAttributedGmv / affiliateSnapshot.totalShopGmv) * 100;
  const affiliateRoi = affiliateSnapshot.creatorAttributedGmv / affiliateSnapshot.commission;
  const liveGmv = affiliateLiveMonthly.reduce((sum, item) => sum + item.liveGmv, 0);
  const liveSalesDays = affiliateLiveMonthly.reduce((sum, item) => sum + item.salesDays, 0);
  const liveShare = (liveGmv / affiliateSnapshot.totalShopGmv) * 100;
  const videoConversionRate = (affiliateMonthly.reduce((sum, item) => sum + item.sellingVideos, 0)
    / affiliateMonthly.reduce((sum, item) => sum + item.videos, 0)) * 100;
  const selectedPlan = useMemo(() => {
    const start = planGranularity === 'day' ? planStartDate : `${planStartMonth}-01`;
    const end = planGranularity === 'day' ? planEndDate : `${planEndMonth}-${String(daysInMonth(planEndMonth)).padStart(2, '0')}`;
    const scalable = ['revenueGoal', 'creatorRevenueGoal', 'activeCreatorsNeeded', 'funnelSamplesNeeded', 'productSamplePackages', 'expectedVideos', 'expectedCommission', 'sampleCost'];
    const rows = affiliateMonthlyPlan.flatMap((item) => {
      const monthStart = `${item.month}-01`;
      const monthEnd = `${item.month}-${String(daysInMonth(item.month)).padStart(2, '0')}`;
      const overlapStart = start > monthStart ? start : monthStart;
      const overlapEnd = end < monthEnd ? end : monthEnd;
      if (overlapStart > overlapEnd) return [];
      const overlapDays = Math.round((new Date(`${overlapEnd}T12:00:00`) - new Date(`${overlapStart}T12:00:00`)) / 86400000) + 1;
      const fraction = overlapDays / daysInMonth(item.month);
      const row = { ...item, start: overlapStart, end: overlapEnd, overlapDays, fraction };
      scalable.forEach((key) => { row[key] = item[key] * fraction; });
      return [row];
    });
    const totals = rows.reduce((sum, item) => {
      scalable.forEach((key) => { sum[key] += item[key]; });
      return sum;
    }, Object.fromEntries(scalable.map((key) => [key, 0])));
    return { start, end, rows, totals };
  }, [planGranularity, planStartDate, planEndDate, planStartMonth, planEndMonth]);
  const planTotals = selectedPlan.totals;
  const samplePlanGap = planTotals.productSamplePackages - affiliatePlanningAssumptions.currentSamplesSent;
  const currentSampleProgress = planTotals.productSamplePackages
    ? (affiliatePlanningAssumptions.currentSamplesSent / planTotals.productSamplePackages) * 100
    : 0;
  const selectedProductPlan = useMemo(() => affiliateProductSamplePlan.map((item) => {
    const revenueGoal = planTotals.revenueGoal * item.share;
    const samplePackages = (revenueGoal / item.unitPrice) * 1.714;
    return {
      ...item,
      revenueGoal,
      samplePackages,
      expectedVideos: samplePackages * affiliatePlanningAssumptions.sampleToContentRate,
      finalOrderUnits: `${item.product.includes('Bundle') ? '각 ' : ''}${number(Math.round(samplePackages * 1.25))}개`,
      sampleCost: samplePackages * item.unitPrice * affiliatePlanningAssumptions.sampleCogsRate,
    };
  }), [planTotals.revenueGoal]);
  const planPeriodLabel = `${selectedPlan.start} ~ ${selectedPlan.end}`;
  const selectedDays = Math.round(
    (new Date(`${endDate}T12:00:00`) - new Date(`${startDate}T12:00:00`)) / 86400000
  ) + 1;
  const view = selectedDays <= 45 ? 'weekly' : 'monthly';
  const selectedRows = useMemo(() => {
    const rows = view === 'weekly' ? affiliateWeekly : affiliateMonthly;
    return rows.filter((item) => item.end >= startDate && item.start <= endDate);
  }, [view, startDate, endDate]);

  const tableRows = useMemo(() => {
    if (view === 'weekly') {
      return selectedRows.map((item, index) => {
        const previous = selectedRows[index - 1];
        return {
          label: item.week,
          videos: item.videos,
          creators: item.creators,
          pool: null,
          gmv: item.videoGmv,
          selling: item.sellingVideos,
          impressions: item.impressions,
          delta: previous ? ((item.videos - previous.videos) / Math.max(previous.videos, 1)) * 100 : 0,
          partial: item.partial,
        };
      });
    }
    return selectedRows.map((item, index) => {
      const previous = selectedRows[index - 1];
      return {
        label: item.month,
        videos: item.videos,
        creators: item.activeCreators,
        pool: item.pool,
        gmv: item.videoGmv,
        selling: item.sellingVideos,
        impressions: item.impressions,
        delta: previous ? ((item.videos - previous.videos) / Math.max(previous.videos, 1)) * 100 : 0,
        partial: item.partial,
      };
    });
  }, [view, selectedRows]);

  useEffect(() => {
    const renderChart = (id, config) => {
      const canvas = document.getElementById(id);
      if (!canvas) return;
      chartInstances.current[id]?.destroy();
      chartInstances.current[id] = new Chart(canvas, config);
    };

    const labels = view === 'monthly'
      ? selectedRows.map((item) => item.month.replace('2026-', ''))
      : selectedRows.map((item) => item.week);
    const rows = selectedRows;

    renderChart('affiliateGrowthChart', {
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: '영상 수',
            data: rows.map((item) => item.videos),
            backgroundColor: '#7c3aed',
            borderRadius: 8,
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: '활성 크리에이터',
            data: rows.map((item) => item.activeCreators ?? item.creators),
            borderColor: '#14b8a6',
            backgroundColor: '#14b8a6',
            tension: 0.25,
            pointRadius: 4,
            yAxisID: 'y',
          },
          ...(view === 'monthly' ? [{
            type: 'line',
            label: '누적 관찰 풀',
            data: rows.map((item) => item.pool),
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b',
            borderDash: [6, 5],
            tension: 0.2,
            pointRadius: 4,
            yAxisID: 'y',
          }] : []),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true, grid: { color: '#eef2f7' } }, x: { grid: { display: false } } },
      },
    });

    renderChart('affiliateGmvChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '영상 직접 GMV',
          data: rows.map((item) => item.videoGmv),
          backgroundColor: rows.map((item) => item.videoGmv > 0 ? '#2563eb' : '#cbd5e1'),
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: (value) => `$${value}` }, grid: { color: '#eef2f7' } },
          x: { grid: { display: false } },
        },
      },
    });

    return () => {
      Object.values(chartInstances.current).forEach((instance) => instance?.destroy());
      chartInstances.current = {};
    };
  }, [view, selectedRows]);

  const pageCopy = affiliateModes[mode] || affiliateModes.overview;

  return (
    <div className={`affiliate-page mode-${mode}`}>
      <PageHeader title={pageCopy[0]} subtitle={pageCopy[1]}>
        <div className="affiliate-report-state">
          <span className="status-dot" />
          7월 Core·제품 2026.07.31 · 8월 MTD 2026.08.05
        </div>
      </PageHeader>

      <section className="card affiliate-shared-filter">
        <div className="affiliate-toolbar">
          <div className="affiliate-date-filter">
            <div>
              <span className="eyebrow">REPORT RANGE</span>
              <strong>{startDate} ~ {endDate}</strong>
            </div>
            <label>시작일<input type="date" min="2026-02-01" max="2026-08-05" value={startDate} onChange={(event) => { const value = event.target.value; setStartDate(value); if (value > endDate) setEndDate(value); }} /></label>
            <span className="range-separator">→</span>
            <label>종료일<input type="date" min="2026-02-01" max="2026-08-05" value={endDate} onChange={(event) => { const value = event.target.value; setEndDate(value); if (value < startDate) setStartDate(value); }} /></label>
            <button type="button" onClick={() => { setStartDate('2026-02-01'); setEndDate('2026-08-05'); }}>전체 데이터</button>
          </div>
          <p className="affiliate-source-note">
            선택 {selectedDays}일 · 운영 차트·표에 적용 · 상단 KPI는 원본 전체 기간 누적값
          </p>
        </div>
      </section>

      <nav className="affiliate-section-nav" aria-label="어필리에이터 상세 메뉴">
        <Link to="/affiliate/sample-plan" className={mode === 'samples' ? 'active samples' : 'samples'}><span>01</span><div><strong>샘플·제품 계획</strong><small>발송·영상·발주·비용</small></div><b>→</b></Link>
        <Link to="/affiliate/creators" className={mode === 'creators' ? 'active creators' : 'creators'}><span>02</span><div><strong>크리에이터 관리</strong><small>풀·활성·운영 가이드</small></div><b>→</b></Link>
        <Link to="/affiliate/content" className={mode === 'content' ? 'active content' : 'content'}><span>03</span><div><strong>영상 성과</strong><small>TOP 영상·판매 요인</small></div><b>→</b></Link>
        <Link to="/affiliate/finance" className={mode === 'finance' ? 'active finance' : 'finance'}><span>04</span><div><strong>매출·비용·ROI</strong><small>GMV·수수료·샘플비</small></div><b>→</b></Link>
      </nav>

      {mode !== 'overview' && <Link className="affiliate-back-link" to="/affiliate">← 어필리에이터 대시보드로</Link>}

      {(mode === 'overview' || mode === 'samples') && (
        <section className="card affiliate-plan-range-card">
          <div>
            <span className="eyebrow">PLAN RANGE</span>
            <strong>{planPeriodLabel}</strong>
            <small>2026.08~2027.12 예산·ROI 계획 원본</small>
          </div>
          <div className="affiliate-plan-granularity" aria-label="계획 집계 기준">
            <button type="button" className={planGranularity === 'day' ? 'active' : ''} onClick={() => setPlanGranularity('day')}>날짜별</button>
            <button type="button" className={planGranularity === 'month' ? 'active' : ''} onClick={() => setPlanGranularity('month')}>월별</button>
          </div>
          {planGranularity === 'day' ? (
            <div className="affiliate-plan-date-controls">
              <label>시작일<input type="date" min="2026-08-01" max="2027-12-31" value={planStartDate} onChange={(event) => { const value = event.target.value; setPlanStartDate(value); if (value > planEndDate) setPlanEndDate(value); }} /></label>
              <span>→</span>
              <label>종료일<input type="date" min="2026-08-01" max="2027-12-31" value={planEndDate} onChange={(event) => { const value = event.target.value; setPlanEndDate(value); if (value < planStartDate) setPlanStartDate(value); }} /></label>
            </div>
          ) : (
            <div className="affiliate-plan-date-controls">
              <label>시작월<input type="month" min="2026-08" max="2027-12" value={planStartMonth} onChange={(event) => { const value = event.target.value; setPlanStartMonth(value); if (value > planEndMonth) setPlanEndMonth(value); }} /></label>
              <span>→</span>
              <label>종료월<input type="month" min="2026-08" max="2027-12" value={planEndMonth} onChange={(event) => { const value = event.target.value; setPlanEndMonth(value); if (value < planStartMonth) setPlanStartMonth(value); }} /></label>
            </div>
          )}
          <span className="badge good">17개월 원본 반영</span>
        </section>
      )}

      <section className="card affiliate-overview-only affiliate-overview-funnel">
        <div>
          <span className="eyebrow">EXECUTION SNAPSHOT</span>
          <h2>선택 기간 목표 실행 흐름</h2>
          <p>{planPeriodLabel} · 현재 발송과 필요한 실행량을 비교합니다.</p>
        </div>
        <div className="affiliate-overview-steps">
          <div><span>현재 발송</span><strong>2,099</strong></div><i>→</i>
          <div><span>목표 샘플</span><strong>{number(Math.round(planTotals.productSamplePackages))}</strong></div><i>→</i>
          <div><span>예상 영상</span><strong>{number(Math.round(planTotals.expectedVideos))}</strong></div><i>→</i>
          <div><span>매출 목표</span><strong>{formatCurrency(planTotals.revenueGoal)}</strong></div>
        </div>
        <Link to="/affiliate/sample-plan">실행계획 자세히 보기 →</Link>
      </section>

      <section className="grid affiliate-kpis affiliate-overview-core affiliate-finance-content">
        <article className="card kpi affiliate-kpi purple">
          <span className="label">협업 크리에이터</span>
          <span className="value">{number(affiliateSnapshot.observedCreatorPool)}명</span>
          <span className="desc">7/1–7/31 Core Metrics 협업 참여</span>
        </article>
        <article className="card kpi affiliate-kpi teal">
          <span className="label">분석 영상 / 판매 영상</span>
          <span className="value">{number(affiliateSnapshot.videos)}개</span>
          <span className="desc">7/1–7/31 게시 영상 · 판매 발생 {number(affiliateSnapshot.sellingVideos)}개</span>
        </article>
        <article className="card kpi affiliate-kpi blue">
          <span className="label">Creator-attributed GMV</span>
          <span className="value">{formatMoney(affiliateSnapshot.creatorAttributedGmv)}</span>
          <span className="desc">전체 Shop GMV의 {pct(attributedShare)} · 영상/라이브/쇼케이스 포함</span>
        </article>
        <article className="card kpi affiliate-kpi rose">
          <span className="label">어필리에이터 ROI</span>
          <span className="value">{affiliateRoi.toFixed(2)}x</span>
          <span className="desc">귀속 GMV ÷ 커미션 {formatMoney(affiliateSnapshot.commission)}</span>
        </article>
        <article className="card kpi affiliate-kpi amber">
          <span className="label">45일 샘플 ROI</span>
          <span className="value">{affiliateSnapshot.sampleRoi45d.toFixed(2)}x</span>
          <span className="desc">샘플 {number(affiliateSnapshot.samplesShipped)}건 → 콘텐츠 {number(affiliateSnapshot.sampleContent)}건</span>
        </article>
      </section>

      <section className="card affiliate-overview-core" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>{affiliateCurrentPeriod.label} 현재</h2><small>8월 원본은 5일간 누적값과 일평균 지표를 구분합니다.</small></div><span className="badge warn">부분 기간</span></div>
        <div className="grid cards-4 affiliate-mtd-grid">
          <article><span>귀속 GMV</span><strong>{formatMoney(affiliateCurrentPeriod.creatorAttributedGmv)}</strong><small>5일 누적</small></article>
          <article><span>판매 수량</span><strong>{number(affiliateCurrentPeriod.attributedItemsSold)}개</strong><small>환불 {formatMoney(affiliateCurrentPeriod.refunds)}</small></article>
          <article><span>영상 / LIVE</span><strong>{number(affiliateCurrentPeriod.videos)} / {number(affiliateCurrentPeriod.liveStreams)}</strong><small>기간 누적</small></article>
          <article><span>예상 수수료</span><strong>{formatMoney(affiliateCurrentPeriod.estimatedCommission)}</strong><small>ROI {(affiliateCurrentPeriod.creatorAttributedGmv / affiliateCurrentPeriod.estimatedCommission).toFixed(2)}x</small></article>
        </div>
        <p className="affiliate-plan-footnote">일평균: 게시 크리에이터 {affiliateCurrentPeriod.avgDailyCreatorsPosted}명 · 판매 크리에이터 {affiliateCurrentPeriod.avgDailyCreatorsWithSales}명 · 판매 영상 {affiliateCurrentPeriod.avgDailyVideosWithSales}개. 7월 합계와 직접 더하지 않습니다.</p>
      </section>

      <section className="card affiliate-overview-core" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>7월 제품별 귀속 GMV</h2><small>Transaction Analysis Product List 42개 중 상위 6개</small></div><span className="badge good">Core 합계 일치</span></div>
        <div className="table-scroll"><table className="table"><thead><tr><th>순위</th><th>제품</th><th>귀속 GMV</th><th>판매</th><th>주문</th><th>환불</th><th>예상 수수료</th></tr></thead><tbody>
          {affiliateJulyProducts.map((item) => <tr key={item.name}><td>{item.rank}</td><td><strong>{item.name}</strong></td><td>{formatMoney(item.gmv)}</td><td>{number(item.items)}개</td><td>{number(item.orders)}건</td><td>{formatMoney(item.refunds)}</td><td>{formatMoney(item.commission)}</td></tr>)}
        </tbody></table></div>
      </section>

      <section className="card affiliate-share-strip affiliate-overview-core affiliate-finance-content">
        <div className="affiliate-share-score">
          <span className="eyebrow">REVENUE CONTRIBUTION</span>
          <strong>{pct(attributedShare)}</strong>
          <p>전체 Shop GMV 중<br />Creator-attributed GMV 비중</p>
        </div>
        <div className="affiliate-share-reasons">
          <div><span>01</span><p><strong>후행 구매까지 귀속</strong>영상 시청 직후뿐 아니라 creator link를 누른 뒤 나중에 산 주문도 포함됩니다.</p></div>
          <div><span>02</span><p><strong>설명이 필요한 카테고리</strong>스킨케어는 고민–성분–사용법 시연이 구매 결정을 돕는 구조입니다.</p></div>
          <div><span>03</span><p><strong>반복 노출과 언어 확장</strong>동일 승자 크리에이터의 후속편과 스페인어 문제 해결형 콘텐츠가 상위권에 반복됩니다.</p></div>
        </div>
        <div className="affiliate-share-caution">
          <span>해석 주의</span>
          <p>이 비중은 영상 직접 매출이 아니라 영상·LIVE·쇼케이스를 합친 귀속 매출입니다. 기간이 같은 Shop GMV와 비교해야 합니다.</p>
        </div>
      </section>

      <section className="card affiliate-detail-section affiliate-finance-content affiliate-finance-breakdown">
        <div className="affiliate-plan-heading">
          <div><span className="eyebrow">COST & RETURN</span><h2>현재 실적과 17개월 계획 비용</h2><p>실적과 미래 계획을 섞지 않고 나란히 비교합니다.</p></div>
          <span className="badge warn">계획값은 가정 기반</span>
        </div>
        <div className="grid cards-4">
          <article><span>현재 귀속 GMV</span><strong>{formatMoney(affiliateSnapshot.creatorAttributedGmv)}</strong><small>Performance 누적</small></article>
          <article><span>현재 수수료</span><strong>{formatMoney(affiliateSnapshot.commission)}</strong><small>현재 ROI {affiliateRoi.toFixed(2)}x</small></article>
          <article><span>전체 계획 예상 수수료</span><strong>{formatCurrency(affiliatePlanTotals.expectedCommission)}</strong><small>크리에이터 매출 85% × 25%</small></article>
          <article><span>전체 계획 예상 샘플비</span><strong>{formatCurrency(affiliatePlanTotals.sampleCost)}</strong><small>번들 중복 제거 기준</small></article>
        </div>
        <p className="affiliate-plan-footnote">계획 총비용은 수수료와 샘플비 합계 {formatCurrency(affiliatePlanTotals.expectedCommission + affiliatePlanTotals.sampleCost)}입니다. 물류비와 광고비는 포함하지 않았습니다.</p>
      </section>

      <section className="card affiliate-plan-dashboard affiliate-detail-section affiliate-samples-content">
        <div className="affiliate-plan-heading">
          <div>
            <span className="eyebrow">SAMPLE → CONTENT → REVENUE</span>
            <h2>{planPeriodLabel} 샘플·영상·매출 실행계획</h2>
            <p>제품별 샘플 발송량에서 예상 영상과 매출 목표, 수수료·샘플비까지 한 번에 연결합니다.</p>
          </div>
          <span className="badge warn">MIZON 5개 제품 · Village/PETINUBE 제외</span>
        </div>

        <div className="affiliate-plan-flow">
          <div><span>01 샘플 패키지</span><strong>{number(Math.round(planTotals.productSamplePackages))}개</strong><small>제품 수요식 기준</small></div>
          <i>→</i>
          <div><span>02 예상 영상</span><strong>{number(Math.round(planTotals.expectedVideos))}개</strong><small>콘텐츠 전환율 63.5%</small></div>
          <i>→</i>
          <div><span>03 크리에이터 매출</span><strong>{formatCurrency(planTotals.creatorRevenueGoal)}</strong><small>전체 목표의 85%</small></div>
          <i>→</i>
          <div><span>04 전체 매출 목표</span><strong>{formatCurrency(planTotals.revenueGoal)}</strong><small>{planPeriodLabel}</small></div>
        </div>

        <div className="grid affiliate-plan-summary">
          <article>
            <span>현재 누적 발송</span>
            <strong>{number(affiliatePlanningAssumptions.currentSamplesSent)}개</strong>
            <small>기존 Sample Performance 전체 기간</small>
          </article>
          <article>
            <span>선택 기간 추가 필요</span>
            <strong>{samplePlanGap >= 0 ? '+' : ''}{number(Math.round(samplePlanGap))}개</strong>
            <small>제품 샘플 계획 대비 단순 차이</small>
          </article>
          <article>
            <span>예상 샘플비</span>
            <strong>{formatCurrency(planTotals.sampleCost)}</strong>
            <small>판매가 × 샘플수 × COGS 30%</small>
          </article>
          <article>
            <span>예상 수수료</span>
            <strong>{formatCurrency(planTotals.expectedCommission)}</strong>
            <small>크리에이터 매출 85% × 수수료 25%</small>
          </article>
          <article>
            <span>필요 Active</span>
            <strong>{number(Math.round(planTotals.activeCreatorsNeeded))}명·월</strong>
            <small>선택 기간 월별 필요 Active 합계</small>
          </article>
        </div>

        <div className="grid affiliate-plan-comparison">
          <article className="affiliate-sample-gap">
            <div className="chart-title">
              <div><h3>현재 발송 vs 목표 샘플</h3><small>범위가 다른 누적값이므로 실행 규모 참고용</small></div>
              <strong>{currentSampleProgress.toFixed(1)}%</strong>
            </div>
            <div className="sample-progress-track">
              <span style={{ width: `${Math.min(currentSampleProgress, 100)}%` }} />
            </div>
            <div className="sample-progress-labels">
              <span>현재 {number(affiliatePlanningAssumptions.currentSamplesSent)}</span>
              <span>목표 {number(Math.round(planTotals.productSamplePackages))}</span>
            </div>
            <div className="affiliate-model-check">
              <span>모델 교차검증</span>
              <p>크리에이터 퍼널식 필요 샘플은 {number(Math.round(planTotals.funnelSamplesNeeded))}개입니다. 제품 수요식은 {number(Math.round(planTotals.productSamplePackages))}개이며 두 모델을 함께 비교해 실행량을 정합니다.</p>
            </div>
          </article>

          <article className="affiliate-month-plan">
            <div className="chart-title"><div><h3>{planGranularity === 'day' ? '선택 날짜의 월별 환산' : '월별 목표와 비용'}</h3><small>2026년 8월부터 2027년 12월까지 원본 기준</small></div></div>
            {selectedPlan.rows.map((item) => (
              <div className="month-plan-row" key={item.month}>
                <strong>{item.month}{item.fraction < 1 ? ` · ${item.overlapDays}일` : ''}{item.estimated ? ' *' : ''}</strong>
                <div><span>매출 목표</span><b>{formatCurrency(item.revenueGoal)}</b></div>
                <div><span>샘플</span><b>{number(Math.round(item.productSamplePackages))}개</b></div>
                <div><span>영상</span><b>{number(Math.round(item.expectedVideos))}개</b></div>
                <div><span>비용+수수료</span><b>{formatCurrency(item.sampleCost + item.expectedCommission)}</b></div>
              </div>
            ))}
          </article>
        </div>

        <div className="table-scroll">
          <table className="table affiliate-product-plan-table">
            <thead>
              <tr>
                <th>제품/번들</th><th>매출 목표</th><th>샘플 패키지</th><th>예상 영상</th><th>최종 발주</th><th>샘플비</th>
              </tr>
            </thead>
            <tbody>
              {selectedProductPlan.map((item) => (
                <tr key={item.product}>
                  <td><strong>{item.product}</strong><small>{item.detail}</small></td>
                  <td>{formatCurrency(item.revenueGoal)} <small>{pct(item.share * 100)}</small></td>
                  <td><strong>{number(Math.round(item.samplePackages))}개</strong></td>
                  <td>{number(Math.round(item.expectedVideos))}개</td>
                  <td>{item.finalOrderUnits}</td>
                  <td>{formatCurrency(item.sampleCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="affiliate-plan-footnote">
          계산 가정: 샘플→콘텐츠 63.5%(1,332/2,099), 크리에이터 채널 85%, 수수료 25%, 샘플 COGS 30%.
          수수료 상한은 선택 기간 전체 매출에 25%를 적용한 {formatCurrency(planTotals.revenueGoal * 0.25)}입니다.
          예산과 목표 매출은 2026.08~2027.12 예산·ROI 플랜 원본을 사용합니다.
        </p>
      </section>

      <section className="grid affiliate-main-grid affiliate-detail-section affiliate-creators-content">
        <article className="card chart-card affiliate-chart-card">
          <div className="chart-title">
            <div>
              <span className="eyebrow">SUPPLY</span>
              <h2>풀과 영상 생산량</h2>
              <small>{startDate} ~ {endDate}와 겹치는 집계 구간</small>
            </div>
          </div>
          <div className="affiliate-canvas"><canvas id="affiliateGrowthChart" /></div>
        </article>

        <article className="card chart-card affiliate-chart-card">
          <div className="chart-title">
            <div>
              <span className="eyebrow">OUTPUT</span>
              <h2>영상 직접 GMV</h2>
              <small>해당 영상에서 직접 잡힌 GMV · 전체 어필리에이트 귀속 GMV와 별도</small>
            </div>
          </div>
          <div className="affiliate-canvas"><canvas id="affiliateGmvChart" /></div>
        </article>
      </section>

      <section className="card affiliate-table-card affiliate-detail-section affiliate-creators-content">
        <div className="chart-title">
          <div>
            <span className="eyebrow">SELECTED RANGE</span>
            <h2>{startDate} ~ {endDate} 운영 변화</h2>
          </div>
          <span className="badge warn">운영 집계 최신 2026.07.23</span>
        </div>
        <div className="table-scroll">
          <table className="table affiliate-table">
            <thead>
              <tr>
                <th>기간</th><th>영상</th><th>활성 크리에이터</th>
                {view === 'monthly' && <th>누적 풀</th>}
                <th>영상 증감</th><th>판매 영상</th><th>영상 GMV</th><th>노출</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((item) => (
                <tr key={item.label}>
                  <td><strong>{item.label}</strong>{item.partial && <small className="partial-label">진행 중</small>}</td>
                  <td>{number(item.videos)}</td>
                  <td>{number(item.creators)}</td>
                  {view === 'monthly' && <td>{number(item.pool)}</td>}
                  <td><Delta value={item.delta} suffix="%" /></td>
                  <td>{number(item.selling)} <small>({pct((item.selling / Math.max(item.videos, 1)) * 100)})</small></td>
                  <td>{formatCurrency(item.gmv)}</td>
                  <td>{number(item.impressions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid affiliate-decision-grid affiliate-detail-section affiliate-creators-content">
        <article className="card affiliate-plan-card">
          <span className="eyebrow">CAPACITY PLAN</span>
          <h2>다음 달 운영 목표</h2>
          <p className="page-note">관리 가능한 협업 인원과 1인당 콘텐츠 약속을 넣으면 필요한 영상 수를 바로 계산합니다.</p>
          <div className="affiliate-plan-inputs">
            <label>
              목표 협업 크리에이터
              <input type="number" min="1" value={targetCreators} onChange={(event) => setTargetCreators(Math.max(1, Number(event.target.value) || 1))} />
              <span>현재 Performance 기준 {affiliateSnapshot.activeCollaborations}명</span>
            </label>
            <label>
              1인당 목표 영상
              <input type="number" min="0.5" step="0.5" value={videosPerCreator} onChange={(event) => setVideosPerCreator(Math.max(0.5, Number(event.target.value) || 0.5))} />
              <span>권장 1.5–2.0개</span>
            </label>
          </div>
          <div className="affiliate-plan-result">
            <div><small>예상 영상</small><strong>{expectedVideos}개</strong></div>
            <div><small>필요 증원</small><strong>+{Math.max(targetCreators - affiliateSnapshot.activeCollaborations, 0)}명</strong></div>
            <div><small>주간 검수량</small><strong>{Math.ceil(expectedVideos / 4)}개</strong></div>
          </div>
        </article>

        <article className="card affiliate-insight-card">
          <span className="eyebrow">WHY THE POOL GREW</span>
          <h2>7월 풀 급증 진단</h2>
          <div className="insight-callout">
            <strong>신규 +341명 · 영상 +509개</strong>
            <p>7월은 전월 대비 관찰 풀과 게시량이 동시에 급증했습니다.</p>
          </div>
          <ul className="reason-list">
            <li><span>01</span><div><strong>샘플 운영 확대</strong><p>누적 2,099건 발송, 샘플 기반 콘텐츠 1,332건으로 대규모 시딩 흔적이 확인됩니다.</p></div></li>
            <li><span>02</span><div><strong>상품 소재 확장</strong><p>Rice Toner·BB Cream·Collagen 등 7월 영상의 제품/메시지 종류가 넓어졌습니다.</p></div></li>
            <li><span>03</span><div><strong>짧은 기간 집중 게시</strong><p>7/13–19 한 주에 262개가 게시돼 월 증가분이 특정 주에 집중됐습니다.</p></div></li>
          </ul>
          <p className="inference-note">※ 캠페인 ID가 없어 위 원인은 콘텐츠·샘플 데이터에 기반한 추정입니다. 다음 export부터 유입경로/캠페인 태그를 필수 저장하세요.</p>
        </article>
      </section>

      <section className="card affiliate-detail-section affiliate-content-content">
        <div className="chart-title">
          <div>
            <span className="eyebrow">{contentView === 'video' ? 'VIDEO LEADERBOARD' : 'LIVE PERFORMANCE'}</span>
            <h2>{contentView === 'video' ? '매출 기여 영상 TOP 5' : 'LIVE 성과'}</h2>
            <small>{contentView === 'video' ? 'Creator GMV가 아닌 shoppable video GMV 기준' : 'Shop Analytics LIVE 채널 귀속 기준'}</small>
          </div>
          <div className="segmented-control affiliate-content-tabs" aria-label="콘텐츠 유형">
            <button type="button" className={contentView === 'video' ? 'active' : ''} onClick={() => setContentView('video')}>영상 TOP 5</button>
            <button type="button" className={contentView === 'live' ? 'active' : ''} onClick={() => setContentView('live')}>LIVE 성과</button>
          </div>
        </div>
        {contentView === 'video' ? (
          <div className="affiliate-video-list">
            {topAffiliateVideos.map((video) => (
              <article className="affiliate-video-row" key={`${video.creator}-${video.date}`}>
                <span className={`affiliate-rank rank-${video.rank}`}>{video.rank}</span>
                <div className="affiliate-video-copy">
                  <strong>{video.title}</strong>
                  <span>{video.creator} · {video.date}</span>
                  <p>{video.diagnosis}</p>
                </div>
                <div className="affiliate-video-metric"><small>영상 GMV</small><strong>{formatCurrency(video.videoGmv)}</strong></div>
                <div className="affiliate-video-metric"><small>주문</small><strong>{video.orders}</strong></div>
                <div className="affiliate-video-metric"><small>노출</small><strong>{number(video.impressions)}</strong></div>
                <div className="affiliate-video-metric"><small>CTR</small><strong>{video.ctr}%</strong></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="affiliate-live-panel">
            <div className="affiliate-live-summary">
              <div><small>LIVE GMV</small><strong>{formatCurrency(liveGmv)}</strong><span>확인 기간 누적</span></div>
              <div><small>전체 GMV 비중</small><strong>{liveShare.toFixed(2)}%</strong><span>Shop GMV 대비</span></div>
              <div><small>매출 발생일</small><strong>{liveSalesDays}일</strong><span>4월·6월·7월</span></div>
              <div className="pending"><small>LIVE ROI</small><strong>산출 대기</strong><span>LIVE 비용/커미션 필요</span></div>
            </div>
            <div className="table-scroll">
              <table className="table affiliate-live-table">
                <thead><tr><th>월</th><th>LIVE GMV</th><th>매출 발생일</th><th>상태</th></tr></thead>
                <tbody>
                  {affiliateLiveMonthly.map((item) => (
                    <tr key={item.month}>
                      <td><strong>{item.month}</strong></td>
                      <td>{formatCurrency(item.liveGmv)}</td>
                      <td>{item.salesDays}일</td>
                      <td><span className={`badge ${item.partial ? 'warn' : 'good'}`}>{item.partial ? '부분 집계' : '마감'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="inference-note">LIVE 호스트·세션·광고비 또는 커미션이 원본에 없어 LIVE 전용 ROI는 계산하지 않았습니다. 해당 비용이 추가되면 LIVE GMV ÷ LIVE 비용으로 자동 산출할 수 있습니다.</p>
          </div>
        )}
      </section>

      <section className="grid affiliate-analysis-grid affiliate-detail-section affiliate-content-content">
        <article className="card affiliate-analysis-card win">
          <span className="eyebrow">WHAT SELLS</span>
          <h2>잘 팔리는 영상의 공통점</h2>
          <ol>
            <li><strong>고민을 먼저 말함</strong><span>다크서클·붓기·모공처럼 한 가지 문제를 첫 문장에 고정</span></li>
            <li><strong>루틴 속 위치가 명확함</strong><span>“세안 후 첫 단계”, “공항 가기 전”처럼 사용 장면을 보여줌</span></li>
            <li><strong>효능의 근거가 구체적임</strong><span>펩타이드·나이아신아마이드·스네일 뮤신을 결과와 연결</span></li>
            <li><strong>검증된 화자의 반복</strong><span>상위권에 동일 크리에이터가 재등장해 후속편의 누적 효과가 보임</span></li>
          </ol>
        </article>
        <article className="card affiliate-analysis-card risk">
          <span className="eyebrow">WHY IT DOESN'T</span>
          <h2>안 팔리는 영상의 주요 원인</h2>
          <ol>
            <li><strong>노출 부족</strong><span>수십 회 노출만으로 성과를 판정하면 콘텐츠 문제와 배포 문제를 혼동</span></li>
            <li><strong>제품명·해시태그만 제시</strong><span>고민–사용–결과의 서사가 없어 클릭할 이유가 약함</span></li>
            <li><strong>신규 영상의 귀속 지연</strong><span>7월 말 영상은 구매 귀속 기간이 짧아 0 GMV를 실패로 확정하면 안 됨</span></li>
            <li><strong>확산이 구매를 보장하지 않음</strong><span>높은 CTR 단독보다 주문·GPM·환불을 함께 봐야 함</span></li>
          </ol>
        </article>
        <article className="card affiliate-analysis-card action">
          <span className="eyebrow">DECISION RULES</span>
          <h2>영상 판정 기준</h2>
          <div className="rule-grid">
            <div><span className="badge good">확대</span><p>7일 경과 + 주문 2건 이상 또는 CTR 4% 이상 & GPM $30 이상</p></div>
            <div><span className="badge warn">보류</span><p>게시 7일 미만 또는 노출 300 미만. 데이터가 쌓일 때까지 판정하지 않음</p></div>
            <div><span className="badge bad">개선</span><p>노출 2,000 이상인데 CTR 1.5% 미만. 첫 3초 훅·썸네일·고민 문장 교체</p></div>
          </div>
        </article>
      </section>

      <section className="card affiliate-playbook affiliate-detail-section affiliate-creators-content">
        <div className="chart-title">
          <div>
            <span className="eyebrow">OPERATING PLAYBOOK</span>
            <h2>어필리에이터 관리 가이드라인</h2>
          </div>
          <span className="badge good">매주 월요일 갱신</span>
        </div>
        <div className="playbook-grid">
          <div><span>1</span><strong>모집</strong><p>상품별 타깃·언어·피부 고민 태그를 붙이고 유입경로를 기록합니다.</p><small>Owner · Affiliate manager</small></div>
          <div><span>2</span><strong>샘플 승인</strong><p>최근 30일 게시 빈도, 평균 조회, 카테고리 적합도와 기존 GMV를 확인합니다.</p><small>SLA · 요청 후 48시간</small></div>
          <div><span>3</span><strong>브리프 전달</strong><p>필수 3초 훅, 한 가지 고민, 사용 장면, 근거 2개, CTA를 1페이지로 제공합니다.</p><small>금지 · 과장 효능/의학적 표현</small></div>
          <div><span>4</span><strong>7일 리뷰</strong><p>300 노출 전에는 보류하고 CTR·GPM·주문·환불을 함께 판정합니다.</p><small>Cadence · 주 1회</small></div>
          <div><span>5</span><strong>확대/중단</strong><p>상위 훅은 동일 크리에이터 후속편과 유사 타깃 5명에게 재배포합니다.</p><small>Scale · 승자 1개당 5개 변형</small></div>
        </div>
      </section>

      <section className="affiliate-definition-note affiliate-detail-section affiliate-shared-detail">
        <strong>데이터 정의</strong>
        <p>
          7월 요약은 7/1–7/31 Core Metrics, 제품 상세는 동일 기간 Product List 기준입니다. 8월의 크리에이터·판매 영상 일부 항목은 일평균입니다.
          Creator-attributed GMV {formatMoney(affiliateSnapshot.creatorAttributedGmv)}에는 영상·LIVE·쇼케이스의 후행 구매가 포함되며,
          월별 표의 영상 GMV와 직접 합산되지 않습니다. Core와 상세 목록은 종료일이 하루 다릅니다.
        </p>
      </section>
    </div>
  );
}

export default AffiliatePage;
