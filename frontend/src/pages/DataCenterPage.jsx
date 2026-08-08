import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import PageHeader from '../components/PageHeader';
import { formatMoney } from '../format';
import { aggregateRange, dailyAnalytics, firstDate, groupMonths, lastDate, topSpikeDays } from '../data/shopAnalytics';

Chart.register(...registerables);

const RECENT_DAYS = 30;
const CSV_COLUMNS = ['date', 'gmv', 'orders', 'customers', 'itemsSold', 'itemsRefunded', 'liveGmv', 'videoGmv', 'productCardGmv', 'shippingFees', 'tax', 'productImpressions', 'productClicks'];

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

const SOURCE_END_DATE = lastDate;

const channelValueLabels = {
  id: 'channelValueLabels',
  afterDatasetsDraw(chart) {
    const dataset = chart.data.datasets[0];
    const total = dataset.data.reduce((sum, value) => sum + Number(value || 0), 0);
    const arcs = chart.getDatasetMeta(0).data;
    if (!total || !arcs.length) return;

    const ctx = chart.ctx;
    const center = arcs[0].getProps(['x', 'y'], true);
    const centerValue = total >= 1000
      ? `$${Math.round(total).toLocaleString('en-US')}`
      : `$${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#64748b';
    ctx.font = '600 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('총 GMV', center.x, center.y - 12);
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 20px system-ui, -apple-system, sans-serif';
    ctx.fillText(centerValue, center.x, center.y + 13);

    arcs.forEach((arc, index) => {
      const value = Number(dataset.data[index] || 0);
      const percentage = (value / total) * 100;
      if (percentage < 4) return;
      const props = arc.getProps(
        ['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius'],
        true
      );
      const angle = (props.startAngle + props.endAngle) / 2;
      const radius = (props.innerRadius + props.outerRadius) / 2;
      const x = props.x + Math.cos(angle) * radius;
      const y = props.y + Math.sin(angle) * radius;
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 14px system-ui, -apple-system, sans-serif';
      ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
      ctx.shadowBlur = 4;
      ctx.fillText(`${percentage.toFixed(1)}%`, x, y);
      ctx.shadowBlur = 0;
    });
    ctx.restore();
  },
};

function DataCenterPage() {
  const chartInstances = useRef({});
  const [startDate, setStartDate] = useState(() => shiftIsoDate(SOURCE_END_DATE, -6));
  const [endDate, setEndDate] = useState(SOURCE_END_DATE);
  const [rangeMode, setRangeMode] = useState('7');

  function handleStartChange(event) {
    const value = event.target.value;
    setStartDate(value);
    if (value > endDate) setEndDate(value);
    setRangeMode('custom');
  }

  function setQuickRange(days) {
    const end = new Date(`${SOURCE_END_DATE}T12:00:00`);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    setStartDate(toLocalIsoDate(start));
    setEndDate(SOURCE_END_DATE);
    setRangeMode(String(days));
  }

  function downloadFilteredCsv() {
    const csv = [
      CSV_COLUMNS.join(','),
      ...filteredDaily.map((row) => CSV_COLUMNS.map((column) => row[column] ?? '').join(',')),
    ].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `shop-analytics_${startDate}_${endDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleEndChange(event) {
    const value = event.target.value;
    setEndDate(value);
    if (value < startDate) setStartDate(value);
    setRangeMode('custom');
  }

  const filteredDaily = useMemo(
    () => dailyAnalytics.filter((d) => d.date >= startDate && d.date <= endDate),
    [startDate, endDate]
  );
  const stats = useMemo(() => aggregateRange(dailyAnalytics, startDate, endDate), [startDate, endDate]);
  const filteredMonths = useMemo(() => groupMonths(filteredDaily), [filteredDaily]);
  const calendarDays = Math.round(
    (new Date(`${endDate}T12:00:00`) - new Date(`${startDate}T12:00:00`)) / 86400000
  ) + 1;
  const useDailyTrend = calendarDays <= 62;
  const primaryTrendRows = useDailyTrend ? filteredDaily : filteredMonths;
  const filteredSpikeDays = useMemo(
    () => topSpikeDays.filter((d) => d.date >= startDate && d.date <= endDate).slice(0, 5),
    [startDate, endDate]
  );
  const recentDaily = useMemo(() => dailyAnalytics.slice(-RECENT_DAYS), []);

  useEffect(() => {
    const renderChart = (canvasId, config) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      if (chartInstances.current[canvasId]) chartInstances.current[canvasId].destroy();
      chartInstances.current[canvasId] = new Chart(canvas, config);
    };

    renderChart('monthlyGmvChart', {
      data: {
        labels: useDailyTrend
          ? primaryTrendRows.map((d) => d.date.slice(5).replace('-', '/'))
          : primaryTrendRows.map((m) => m.label),
        datasets: [
          {
            type: 'line',
            label: 'GMV',
            data: primaryTrendRows.map((row) => row.gmv),
            borderColor: '#2563eb',
            backgroundColor: '#2563eb',
            yAxisID: 'y',
            tension: 0.2,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 3,
            fill: false,
          },
          {
            type: 'line',
            label: '주문수',
            data: primaryTrendRows.map((row) => row.orders),
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b',
            yAxisID: 'y1',
            tension: 0.2,
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 3,
            borderDash: [7, 5],
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top' } },
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            title: { display: true, text: 'GMV ($)' },
            grid: { color: 'rgba(148, 163, 184, 0.18)' },
            ticks: { callback: (value) => `$${Number(value).toLocaleString('en-US')}` },
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: '주문수' },
            ticks: { callback: (value) => `${Number(value).toLocaleString('en-US')}건` },
          },
        },
      },
    });

    renderChart('channelMixChart', {
      type: 'doughnut',
      plugins: [channelValueLabels],
      data: {
        labels: ['Product Card', 'Video', 'LIVE'],
        datasets: [{
          data: [stats.productCardGmv, stats.videoGmv, stats.liveGmv],
          backgroundColor: ['#2563eb', '#14b8a6', '#f59e0b'],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        cutout: '58%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, pointStyle: 'circle', padding: 16 },
          },
        },
      },
    });

    renderChart('recentTrendChart', {
      type: 'line',
      data: {
        labels: recentDaily.map((d) => d.date.slice(5)),
        datasets: [{
          label: '일별 GMV',
          data: recentDaily.map((d) => d.gmv),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          fill: true,
          tension: 0,
          pointRadius: 3,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'GMV ($)' } } },
      },
    });

    return () => {
      Object.values(chartInstances.current).forEach((instance) => instance?.destroy());
      chartInstances.current = {};
    };
  }, [filteredDaily, filteredMonths, useDailyTrend, stats, recentDaily]);

  const channelTotal = stats.productCardGmv + stats.videoGmv + stats.liveGmv;
  const pct = (v) => (channelTotal ? Math.round((v / channelTotal) * 1000) / 10 : 0);
  const daysSelected = filteredDaily.length;

  return (
    <>
      <PageHeader
        title="데이터센터"
        subtitle="TikTok Shop 실제 판매 데이터 기반 요약 리포트 (Shop Analytics 원본 기준, 일별 데이터 보유)"
      >
        <div className="data-center-live"><span className="status-dot" /><strong>Shop Analytics 최신</strong><small>2026.08.07</small></div>
      </PageHeader>

      <section className="card">
        <div className="data-filter-head">
          <div>
            <span className="eyebrow">ANALYSIS RANGE</span>
            <div className="control-row" style={{ marginTop: 0 }}>
              <label>시작일<input type="date" value={startDate} min={firstDate} max={SOURCE_END_DATE} onChange={handleStartChange} /></label>
              <label>종료일<input type="date" value={endDate} min={firstDate} max={SOURCE_END_DATE} onChange={handleEndChange} /></label>
              <button type="button" onClick={() => { setStartDate(firstDate); setEndDate(SOURCE_END_DATE); setRangeMode('all'); }}>전체 데이터</button>
            </div>
          </div>
          <div className="data-filter-actions">
            <div className="quick-range">
              <button type="button" className={rangeMode === '7' ? 'active' : ''} onClick={() => setQuickRange(7)}>최근 7일</button>
              <button type="button" className={rangeMode === '28' ? 'active' : ''} onClick={() => setQuickRange(28)}>최근 28일</button>
              <button type="button" className={rangeMode === 'month' ? 'active' : ''} onClick={() => { setStartDate(`${SOURCE_END_DATE.slice(0, 7)}-01`); setEndDate(SOURCE_END_DATE); setRangeMode('month'); }}>이번 달</button>
            </div>
            <button type="button" className="export-button" onClick={downloadFilteredCsv}>↓ 현재 구간 CSV</button>
          </div>
        </div>
        <p className="data-range-label">오늘 기준 조회: {startDate} ~ {endDate} · {calendarDays}일 범위 · 실제 데이터 {daysSelected}일 (최신 {lastDate})</p>
      </section>

      <section className="grid data-health-grid">
        <article className="card data-health-score">
          <div className="data-score-ring"><strong>QA</strong><small>검증</small></div>
          <div><span className="eyebrow">DATA HEALTH</span><h2>검증 완료 · 1개 주의</h2><p>7월 전체 31일과 8월 1–7일의 일별 합계가 각 원본 총계와 일치합니다.</p></div>
        </article>
        <article className="card data-health-summary">
          <div><span className="health-icon good">✓</span><p><strong>7월 31일 완전 집계</strong><small>GMV $13,797.74</small></p></div>
          <div><span className="health-icon warn">!</span><p><strong>8월 7일 비용 열 공란</strong><small>세금·배송비만 미집계</small></p></div>
          <div><span className="health-icon neutral">280</span><p><strong>Shop 일별 행</strong><small>누적 GMV $42,438.52</small></p></div>
        </article>
      </section>

      <section className="grid cards-4" style={{ marginTop: 20 }}>
        <article className="card kpi">
          <span className="label metric-term">누적 GMV <span className="term-help" tabIndex="0" role="button" aria-label="GMV 설명" data-tooltip="총 거래액이에요. 선택 기간에 판매된 상품 금액을 모두 더한 값입니다.">?</span></span>
          <span className="value">{formatMoney(stats.gmv)}</span>
          <span className="desc">세금 포함 {formatMoney(stats.gmvWithTax)}</span>
        </article>
        <article className="card kpi">
          <span className="label">누적 주문 / 고객</span>
          <span className="value">{stats.orders.toLocaleString('en-US')}건</span>
          <span className="desc">고객 {stats.customers.toLocaleString('en-US')}명 · SKU 주문 {stats.skuOrders.toLocaleString('en-US')}건</span>
        </article>
        <article className="card kpi">
          <span className="label metric-term">평균 주문액(AOV) <span className="term-help" tabIndex="0" role="button" aria-label="AOV 설명" data-tooltip="주문 1건당 평균 결제 금액이에요. 총매출을 주문 수로 나눠 계산합니다.">?</span></span>
          <span className="value">{formatMoney(stats.aov)}</span>
          <span className="desc">판매 아이템 {stats.itemsSold.toLocaleString('en-US')}개</span>
        </article>
        <article className="card kpi">
          <span className="label">취소·반품율</span>
          <span className="value">{stats.refundRate}%</span>
          <span className="desc">환불액 {formatMoney(stats.itemsRefunded)}</span>
        </article>
      </section>

      <section className="grid cards-4" style={{ marginTop: 20 }}>
        <article className="card kpi">
          <span className="label metric-term">제품 클릭률(CTR) <span className="term-help" tabIndex="0" role="button" aria-label="CTR 설명" data-tooltip="상품이 화면에 보인 횟수 중 실제로 클릭된 비율이에요.">?</span></span>
          <span className="value">{stats.ctr}%</span>
          <span className="desc">노출 {stats.productImpressions.toLocaleString('en-US')}회 · 클릭 {stats.productClicks.toLocaleString('en-US')}회</span>
        </article>
        <article className="card kpi">
          <span className="label">고유 노출 / 클릭</span>
          <span className="value">{stats.uniqueClicks.toLocaleString('en-US')}</span>
          <span className="desc">고유 노출 {stats.uniqueProductImpressions.toLocaleString('en-US')}회</span>
        </article>
        <article className="card kpi">
          <span className="label">배송비 합계</span>
          <span className="value">{formatMoney(stats.shippingFees)}</span>
          <span className="desc">세금 합계 {formatMoney(stats.tax)}</span>
        </article>
        <article className="card kpi">
          <span className="label metric-term">채널 GMV 비중 <span className="term-help" tabIndex="0" role="button" aria-label="채널 GMV 설명" data-tooltip="전체 매출이 상품 카드·영상·라이브 중 어디에서 발생했는지 보여주는 비율이에요.">?</span></span>
          <span className="value">{pct(stats.productCardGmv)}% Card</span>
          <span className="desc">Video {pct(stats.videoGmv)}% · LIVE {pct(stats.liveGmv)}%</span>
        </article>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>📈 매출 급등 포인트</h2><small>선택 구간 내 일별 GMV 상위 스파이크</small></div></div>
        {filteredSpikeDays.length ? (
          <table className="table">
            <thead><tr><th>날짜</th><th><span className="metric-term">GMV <span className="term-help" tabIndex="0" role="button" aria-label="GMV 설명" data-tooltip="총 거래액이에요. 판매된 상품 금액을 모두 더한 값입니다.">?</span></span></th><th>주문수</th><th>고객수</th></tr></thead>
            <tbody>
              {filteredSpikeDays.map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>{formatMoney(d.gmv)}</td>
                  <td>{d.orders}건</td>
                  <td>{d.customers}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="page-note">선택한 구간에는 두드러진 스파이크 데이 기록이 없습니다.</p>
        )}
        <p className="page-note">
          7월 10일 단일 GMV(${topSpikeDays[0].gmv.toLocaleString('en-US')})이 다른 달 전체 실적에 맞먹는 규모로, 대형 프로모션/세일 이벤트로 추정됩니다.
          4월 중순과 7월 중하순에 매출이 반복적으로 튀는 패턴이 있어, 해당 시점의 광고·프로모션 운영을 다음 시즌에도 재현할 가치가 있습니다.
        </p>
      </section>

      <section className="grid cards-3" style={{ marginTop: 20 }}>
        <article className="card chart-card" style={{ gridColumn: 'span 2' }}>
          <div className="chart-title">
            <div>
              <h2>{useDailyTrend ? '일별' : '월별'} GMV / 주문수 추이</h2>
              <small>{startDate} ~ {endDate} · {useDailyTrend ? `실제 데이터 ${filteredDaily.length}일` : `${filteredMonths.length}개월`} 자동 집계</small>
            </div>
          </div>
          <canvas id="monthlyGmvChart" />
        </article>
        <article className="card chart-card">
          <div className="chart-title"><div><h2>채널별 GMV 비중</h2><small>Product Card / Video / LIVE</small></div></div>
          <canvas id="channelMixChart" />
        </article>
      </section>

      <section className="card chart-card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>최근 30일 일별 GMV</h2><small>{recentDaily[0].date} ~ {recentDaily[recentDaily.length - 1].date} (기간 선택과 무관하게 항상 최신 30일)</small></div></div>
        <canvas id="recentTrendChart" />
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>월별 상세 데이터</h2><small>{startDate} ~ {endDate} · 실제 Shop Analytics 리포트 집계 기준</small></div></div>
        <table className="table">
          <thead>
            <tr>
              <th>월</th>
              <th><span className="metric-term">GMV <span className="term-help" tabIndex="0" role="button" aria-label="GMV 설명" data-tooltip="총 거래액이에요. 판매된 상품 금액을 모두 더한 값입니다.">?</span></span></th>
              <th>주문</th><th>고객</th>
              <th><span className="metric-term">AOV <span className="term-help" tabIndex="0" role="button" aria-label="AOV 설명" data-tooltip="평균 주문액이에요. 주문 1건당 평균 결제 금액입니다.">?</span></span></th>
              <th>취소·반품율</th>
              <th><span className="metric-term">CTR <span className="term-help" tabIndex="0" role="button" aria-label="CTR 설명" data-tooltip="클릭률이에요. 상품 노출 중 실제 클릭으로 이어진 비율입니다.">?</span></span></th>
              <th><span className="metric-term">LIVE GMV <span className="term-help" tabIndex="0" role="button" aria-label="LIVE GMV 설명" data-tooltip="라이브 방송을 통해 발생한 매출이에요.">?</span></span></th>
              <th><span className="metric-term">Video GMV <span className="term-help" tabIndex="0" role="button" aria-label="Video GMV 설명" data-tooltip="쇼핑 영상에서 발생한 매출이에요.">?</span></span></th>
              <th><span className="metric-term">Product Card GMV <span className="term-help" tabIndex="0" role="button" aria-label="Product Card GMV 설명" data-tooltip="상품 카드에 귀속된 매출이에요.">?</span></span></th>
            </tr>
          </thead>
          <tbody>
            {filteredMonths.map((m) => (
              <tr key={m.key}>
                <td>{m.year}.{m.monthName}</td>
                <td>{formatMoney(m.gmv)}</td>
                <td>{m.orders.toLocaleString('en-US')}</td>
                <td>{m.customers.toLocaleString('en-US')}</td>
                <td>{formatMoney(m.aov)}</td>
                <td>{m.refundRate}%</td>
                <td>{m.ctr}%</td>
                <td>{formatMoney(m.liveGmv)}</td>
                <td>{formatMoney(m.videoGmv)}</td>
                <td>{formatMoney(m.productCardGmv)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="page-note" style={{ fontSize: 12 }}>
          ※ 월 경계에 걸친 첫/마지막 달은 부분월(선택 구간 내 날짜만) 기준으로 집계됩니다. 고객수는 일별 합산 값으로, 기간 내 재구매 고객이 중복 집계될 수 있습니다.
          LIVE/Video/Product Card 외 세부 귀속(Creator/Seller, 직접/간접) 항목은 원본 리포트의 표 서식이 손상되어 신뢰도 있게 복원할 수 없어 제외했습니다.
        </p>
      </section>
    </>
  );
}

export default DataCenterPage;
