import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import PageHeader from '../components/PageHeader';
import { getData } from '../api';
import { formatCurrency } from '../format';
import { MONTH_CALENDAR, filterByMonthRange } from '../monthCalendar';
import { dailyAnalytics, firstDate, lastDate } from '../data/shopAnalytics';

Chart.register(...registerables);

const RECENT_DAYS = 30;

function RevenueAdsDetailPage() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startMonth, setStartMonth] = useState(MONTH_CALENDAR[0]);
  const [endMonth, setEndMonth] = useState(MONTH_CALENDAR[MONTH_CALENDAR.length - 1]);
  const chartInstances = useRef({});

  useEffect(() => {
    getData('monthly').then((monthly) => {
      setMonthlyData(monthly);
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
    const adSpend = filteredMonthlyData.reduce((sum, item) => sum + item.adSpend, 0);
    const roas = adSpend ? revenue / adSpend : 0;
    const adSpendShare = revenue ? (adSpend / revenue) * 100 : 0;
    return { revenue, adSpend, roas, adSpendShare };
  }, [filteredMonthlyData]);

  const recentDaily = useMemo(() => dailyAnalytics.slice(-RECENT_DAYS), []);

  useEffect(() => {
    if (loading) return;

    const renderChart = (canvasId, config) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      if (chartInstances.current[canvasId]) chartInstances.current[canvasId].destroy();
      chartInstances.current[canvasId] = new Chart(canvas, config);
    };

    renderChart('revenueAdDetailChart', {
      data: {
        labels: filteredMonthlyData.map((item) => item.month),
        datasets: [
          { type: 'bar', label: '매출', data: filteredMonthlyData.map((item) => item.revenue), backgroundColor: '#2563eb', yAxisID: 'y' },
          { type: 'bar', label: '광고비', data: filteredMonthlyData.map((item) => item.adSpend), backgroundColor: '#f59e0b', yAxisID: 'y' },
          {
            type: 'line',
            label: 'ROAS (매출/광고비)',
            data: filteredMonthlyData.map((item) => (item.adSpend ? Math.round((item.revenue / item.adSpend) * 100) / 100 : 0)),
            borderColor: '#14b8a6',
            backgroundColor: '#14b8a6',
            yAxisID: 'y1',
            tension: 0,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: { beginAtZero: true, position: 'left', title: { display: true, text: '$' }, ticks: { callback: (v) => '$' + v / 1000 + 'k' } },
          y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'ROAS (x)' } },
        },
      },
    });

    renderChart('adSpendShareChart', {
      type: 'bar',
      data: {
        labels: filteredMonthlyData.map((item) => item.month),
        datasets: [
          {
            label: '광고비 비중 (%)',
            data: filteredMonthlyData.map((item) => (item.revenue ? Math.round((item.adSpend / item.revenue) * 1000) / 10 : 0)),
            backgroundColor: '#f59e0b',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => v + '%' } } },
      },
    });

    renderChart('recentGmvTrendChart', {
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
  }, [filteredMonthlyData, recentDaily, loading]);

  if (loading) return null;

  return (
    <>
      <PageHeader title="월별 매출 vs 광고비 상세" subtitle="광고비 효율(ROAS)과 매출 대비 광고비 비중을 월별로 분석합니다." />

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
          <span className="label">누적 매출</span>
          <span className="value">{formatCurrency(stats.revenue)}</span>
        </article>
        <article className="card kpi">
          <span className="label">누적 광고비</span>
          <span className="value">{formatCurrency(stats.adSpend)}</span>
        </article>
        <article className="card kpi">
          <span className="label">ROAS</span>
          <span className="value">{stats.roas.toFixed(2)}x</span>
          <span className="desc">광고비 $1당 매출 배수</span>
        </article>
        <article className="card kpi">
          <span className="label">광고비 비중</span>
          <span className="value">{stats.adSpendShare.toFixed(1)}%</span>
          <span className="desc">매출 대비 광고비</span>
        </article>
      </section>

      <section className="grid cards-2" style={{ marginTop: 20 }}>
        <article className="card chart-card" style={{ gridColumn: 'span 1' }}>
          <div className="chart-title"><div><h2>매출 vs 광고비 vs ROAS</h2><small>{startMonth} ~ {endMonth}</small></div></div>
          <canvas id="revenueAdDetailChart" />
        </article>
        <article className="card chart-card">
          <div className="chart-title"><div><h2>월별 광고비 비중</h2><small>광고비 ÷ 매출</small></div></div>
          <canvas id="adSpendShareChart" />
        </article>
      </section>

      <section className="card chart-card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>최근 30일 일별 GMV</h2><small>{recentDaily[0].date} ~ {recentDaily[recentDaily.length - 1].date} (Shop Analytics 실제 데이터)</small></div></div>
        <canvas id="recentGmvTrendChart" />
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>월별 상세</h2><small>매출·광고비·ROAS</small></div></div>
        <table className="table">
          <thead>
            <tr><th>월</th><th>매출</th><th>광고비</th><th>광고비 비중</th><th>ROAS</th></tr>
          </thead>
          <tbody>
            {filteredMonthlyData.map((item, index) => {
              const share = item.revenue ? (item.adSpend / item.revenue) * 100 : 0;
              const roas = item.adSpend ? item.revenue / item.adSpend : 0;
              return (
                <tr key={`${item.month}-${index}`}>
                  <td>{item.month}</td>
                  <td>{formatCurrency(item.revenue)}</td>
                  <td>{formatCurrency(item.adSpend)}</td>
                  <td>{share.toFixed(1)}%</td>
                  <td>{roas.toFixed(2)}x</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="page-note" style={{ fontSize: 12 }}>
          ※ 현재 광고비는 월 단위 합계만 추적됩니다. GMV Max/어필리에이터 광고 등 채널별 분해, 일별 광고비 데이터가 추가되면 채널별 ROAS와 캠페인 단위 분석까지 가능합니다.
        </p>
      </section>
    </>
  );
}

export default RevenueAdsDetailPage;
