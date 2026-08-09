import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import PageHeader from '../components/PageHeader';
import { livePerformanceRange, liveSessions } from '../data/livePerformanceData';

Chart.register(...registerables);

const number = (value) => new Intl.NumberFormat('en-US').format(Math.round(value));
const currency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);
const percent = (value) => `${value.toFixed(1)}%`;

function LivePage() {
  const [startDate, setStartDate] = useState(livePerformanceRange.start);
  const [endDate, setEndDate] = useState(livePerformanceRange.end);
  const chartInstances = useRef({});

  const filtered = useMemo(
    () => liveSessions.filter((item) => item.date >= startDate && item.date <= endDate),
    [startDate, endDate]
  );

  const totals = useMemo(() => {
    const result = filtered.reduce((sum, item) => ({
      sessions: sum.sessions + 1,
      minutes: sum.minutes + item.durationMinutes,
      gmv: sum.gmv + item.gmv,
      items: sum.items + item.itemsSold,
      orders: sum.orders + item.orders,
      customers: sum.customers + item.customers,
      views: sum.views + item.views,
      impressions: sum.impressions + item.impressions,
      productImpressions: sum.productImpressions + item.productImpressions,
      productClicks: sum.productClicks + item.productClicks,
      followers: sum.followers + item.newFollowers,
      comments: sum.comments + item.comments,
      shares: sum.shares + item.shares,
      likes: sum.likes + item.likes,
      weightedWatch: sum.weightedWatch + (item.avgViewSeconds * item.views),
    }), {
      sessions: 0, minutes: 0, gmv: 0, items: 0, orders: 0, customers: 0,
      views: 0, impressions: 0, productImpressions: 0, productClicks: 0,
      followers: 0, comments: 0, shares: 0, likes: 0, weightedWatch: 0,
    });
    return {
      ...result,
      sellingSessions: filtered.filter((item) => item.gmv > 0).length,
      aov: result.orders ? result.gmv / result.orders : 0,
      viewRate: result.impressions ? (result.views / result.impressions) * 100 : 0,
      productCtr: result.productImpressions ? (result.productClicks / result.productImpressions) * 100 : 0,
      clickToOrder: result.productClicks ? (result.orders / result.productClicks) * 100 : 0,
      avgWatch: result.views ? result.weightedWatch / result.views : 0,
      gmvPerHour: result.minutes ? result.gmv / (result.minutes / 60) : 0,
    };
  }, [filtered]);

  useEffect(() => {
    const render = (id, config) => {
      const canvas = document.getElementById(id);
      if (!canvas) return;
      chartInstances.current[id]?.destroy();
      chartInstances.current[id] = new Chart(canvas, config);
    };
    const labels = filtered.map((item) => `${item.date.slice(5).replace('-', '/')} ${item.start.slice(11, 16)}`);
    render('livePerformanceChart', {
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'LIVE GMV',
            data: filtered.map((item) => item.gmv),
            borderColor: '#2563eb',
            backgroundColor: '#2563eb',
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.2,
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: '시청수',
            data: filtered.map((item) => item.views),
            borderColor: '#14b8a6',
            backgroundColor: '#14b8a6',
            borderWidth: 3,
            pointRadius: 5,
            tension: 0.2,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: (value) => `$${value}` }, grid: { color: '#eef2f7' } },
          y1: { beginAtZero: true, position: 'right', grid: { display: false } },
          x: { grid: { display: false } },
        },
      },
    });
    render('liveEngagementChart', {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: '좋아요', data: filtered.map((item) => item.likes), borderColor: '#7c3aed', backgroundColor: '#7c3aed', borderWidth: 3, pointRadius: 5, tension: 0.2 },
          { label: '공유', data: filtered.map((item) => item.shares), borderColor: '#f59e0b', backgroundColor: '#f59e0b', borderWidth: 3, pointRadius: 5, tension: 0.2 },
          { label: '댓글', data: filtered.map((item) => item.comments), borderColor: '#ef4444', backgroundColor: '#ef4444', borderWidth: 3, pointRadius: 5, tension: 0.2 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true, grid: { color: '#eef2f7' } }, x: { grid: { display: false } } },
      },
    });
    return () => {
      Object.values(chartInstances.current).forEach((instance) => instance?.destroy());
      chartInstances.current = {};
    };
  }, [filtered]);

  const winningSession = filtered.find((item) => item.gmv > 0);
  const bestEngagement = filtered.reduce((best, item) => (item.likes > (best?.likes || -1) ? item : best), null);

  return (
    <>
      <PageHeader
        title="라이브 분석"
        subtitle="LIVE별 노출·시청·상품 클릭·주문·매출을 연결해 판매 전환이 막히는 지점을 확인합니다."
      >
        <div className="affiliate-report-state"><span className="status-dot" />LIVE 최신 원본 8월 9일 · 최근 방송 8월 5일</div>
      </PageHeader>

      <section className="card live-filter-card">
        <div>
          <span className="eyebrow">LIVE REPORT RANGE</span>
          <strong>{startDate} ~ {endDate}</strong>
          <small>누적 이력 {livePerformanceRange.start}~{livePerformanceRange.end} · 최신 추출 {livePerformanceRange.latestExportStart}~{livePerformanceRange.end}</small>
        </div>
        <div className="affiliate-plan-date-controls">
          <label>시작일<input type="date" min={livePerformanceRange.start} max={livePerformanceRange.end} value={startDate} onChange={(event) => { const value = event.target.value; setStartDate(value); if (value > endDate) setEndDate(value); }} /></label>
          <span>→</span>
          <label>종료일<input type="date" min={livePerformanceRange.start} max={livePerformanceRange.end} value={endDate} onChange={(event) => { const value = event.target.value; setEndDate(value); if (value < startDate) setStartDate(value); }} /></label>
          <button type="button" onClick={() => { setStartDate(livePerformanceRange.start); setEndDate(livePerformanceRange.end); }}>전체 기간</button>
        </div>
        <span className="badge good">총 {totals.sessions}회 LIVE</span>
      </section>

      <section className="grid live-kpi-grid">
        <article className="card kpi live-kpi blue"><span className="label">LIVE 귀속 GMV</span><span className="value">{currency(totals.gmv)}</span><span className="desc">판매 LIVE {totals.sellingSessions}/{totals.sessions}회 · {percent(totals.sessions ? totals.sellingSessions / totals.sessions * 100 : 0)}</span></article>
        <article className="card kpi live-kpi teal"><span className="label">시청수 / 노출</span><span className="value">{number(totals.views)}</span><span className="desc">노출 {number(totals.impressions)} · 유입률 {percent(totals.viewRate)}</span></article>
        <article className="card kpi live-kpi purple"><span className="label">상품 클릭률</span><span className="value">{percent(totals.productCtr)}</span><span className="desc">상품 노출 {number(totals.productImpressions)} → 클릭 {number(totals.productClicks)}</span></article>
        <article className="card kpi live-kpi rose"><span className="label">주문 / 클릭→주문</span><span className="value">{number(totals.orders)}건</span><span className="desc">클릭→주문 {percent(totals.clickToOrder)} · AOV {currency(totals.aov)}</span></article>
        <article className="card kpi live-kpi amber"><span className="label">총 방송시간</span><span className="value">{Math.floor(totals.minutes / 60)}h {Math.round(totals.minutes % 60)}m</span><span className="desc">평균 시청 {totals.avgWatch.toFixed(1)}초 · 시간당 GMV {currency(totals.gmvPerHour)}</span></article>
      </section>

      <section className="card live-funnel-card">
        <div className="chart-title">
          <div><span className="eyebrow">LIVE FUNNEL</span><h2>노출에서 주문까지</h2><small>각 단계의 절대량과 전환율을 함께 확인합니다.</small></div>
          <span className={`badge ${totals.orders ? 'good' : 'bad'}`}>{totals.orders ? '주문 발생' : '주문 없음'}</span>
        </div>
        <div className="live-funnel">
          <div><span>LIVE 노출</span><strong>{number(totals.impressions)}</strong></div><i>유입 {percent(totals.viewRate)} →</i>
          <div><span>시청</span><strong>{number(totals.views)}</strong></div><i>상품 노출 →</i>
          <div><span>상품 노출</span><strong>{number(totals.productImpressions)}</strong></div><i>CTR {percent(totals.productCtr)} →</i>
          <div><span>상품 클릭</span><strong>{number(totals.productClicks)}</strong></div><i>주문 {percent(totals.clickToOrder)} →</i>
          <div><span>주문</span><strong>{number(totals.orders)}</strong></div>
        </div>
      </section>

      <section className="grid cards-2 live-chart-grid">
        <article className="card chart-card live-chart-card">
          <div className="chart-title"><div><h2>LIVE별 GMV와 시청수</h2><small>파랑 선 = GMV · 초록 선 = 시청수</small></div></div>
          <div className="live-canvas-wrap"><canvas id="livePerformanceChart" /></div>
        </article>
        <article className="card chart-card live-chart-card">
          <div className="chart-title"><div><h2>LIVE별 참여 반응</h2><small>좋아요·공유·댓글 비교</small></div></div>
          <div className="live-canvas-wrap"><canvas id="liveEngagementChart" /></div>
        </article>
      </section>

      <section className="grid live-insight-grid">
        <article className="card live-insight win">
          <span className="eyebrow">판매 LIVE</span>
          <h3>{winningSession ? `${winningSession.date} ${winningSession.start.slice(11, 16)}` : '선택 기간 없음'}</h3>
          <strong>{winningSession ? `${currency(winningSession.gmv)} · 주문 ${winningSession.orders}건` : '매출 없음'}</strong>
          <p>{winningSession
            ? `상품 노출 ${number(winningSession.productImpressions)}회와 클릭 ${number(winningSession.productClicks)}회를 확보했습니다.`
            : '선택 기간에는 LIVE 귀속 매출과 주문이 없습니다.'}</p>
        </article>
        <article className="card live-insight attention">
          <span className="eyebrow">참여는 높지만 매출 0</span>
          <h3>{bestEngagement?.title || 'MIZON LIVE'}</h3>
          <strong>좋아요 {number(bestEngagement?.likes || 0)} · 공유 {number(bestEngagement?.shares || 0)}</strong>
          <p>{bestEngagement
            ? `상품 노출 ${number(bestEngagement.productImpressions)}회에서 클릭 ${number(bestEngagement.productClicks)}회, 주문 ${number(bestEngagement.orders)}건이었습니다.`
            : '선택 기간에 분석할 세션이 없습니다.'}</p>
        </article>
        <article className="card live-insight action">
          <span className="eyebrow">다음 LIVE 운영안</span>
          <h3>판매 세션 구조를 30분으로 재현</h3>
          <strong>상품 노출률과 클릭 수를 우선 관리</strong>
          <p>5분 이내 제품 소개 → 10분 데모 → 혜택/쿠폰 반복 → 종료 전 FAQ 순서로 운영하고, 클릭 10회 전에는 판매 실패로 단정하지 않습니다.</p>
        </article>
      </section>

      <section className="card live-table-card">
        <div className="chart-title"><div><h2>LIVE 세션 상세</h2><small>누적 7개 Room ID · 최신 원본으로 7월 세션 교체</small></div><span className="badge warn">제목 미제공 4건</span></div>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>시작시간 / 제목</th><th>방송시간</th><th>GMV</th><th>주문</th><th>시청 / 노출</th><th>상품 노출→클릭</th><th>평균 시청</th><th>반응</th><th>판정</th></tr></thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.roomId}>
                  <td><strong>{item.start}</strong><small>{item.title}</small></td>
                  <td>{Math.round(item.durationMinutes)}분</td>
                  <td><strong>{currency(item.gmv)}</strong></td>
                  <td>{item.orders}건</td>
                  <td>{number(item.views)} / {number(item.impressions)}</td>
                  <td>{number(item.productImpressions)} → {number(item.productClicks)} <small>{percent(item.productCtr)}</small></td>
                  <td>{item.avgViewSeconds.toFixed(1)}초</td>
                  <td>♥ {number(item.likes)} · 공유 {item.shares} · 댓글 {item.comments}</td>
                  <td><span className={`badge ${item.isTest ? 'warn' : item.gmv > 0 ? 'good' : 'bad'}`}>{item.isTest ? '테스트' : item.gmv > 0 ? '판매' : '매출 0'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="page-note">최신 Creator LIVE export는 7월 1일~8월 9일의 4개 세션입니다. 기존 4월 3개 세션은 이력으로 유지하고, 겹치는 7월 Room ID는 최신 값으로 교체했습니다. LIVE 귀속 GMV는 Shop Analytics의 채널 GMV와 집계 범위가 달라 직접 합산하지 않습니다.</p>
      </section>
    </>
  );
}

export default LivePage;
