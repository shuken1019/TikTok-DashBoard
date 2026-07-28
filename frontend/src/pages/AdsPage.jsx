import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import PageHeader from '../components/PageHeader';
import { getData } from '../api';
import {
  campaignOverviewFirstMonth,
  campaignOverviewLastMonth,
  campaignOverviewMonthly,
  campaignOverviewDataAsOf,
} from '../data/campaignOverview';

Chart.register(...registerables);

const formatCampaignCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

const costValueLabels = {
  id: 'costValueLabels',
  afterDatasetsDraw(chart) {
    const dataset = chart.data.datasets[0];
    const total = dataset.data.reduce((sum, value) => sum + Number(value || 0), 0);
    const arcs = chart.getDatasetMeta(0).data;
    if (!total || !arcs.length) return;

    const ctx = chart.ctx;
    const center = arcs[0].getProps(['x', 'y'], true);
    const centerValue = `$${Math.round(total).toLocaleString('en-US')}`;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#64748b';
    ctx.font = '600 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('총 비용', center.x, center.y - 12);
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
      ctx.font = '800 13px system-ui, -apple-system, sans-serif';
      ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
      ctx.shadowBlur = 4;
      ctx.fillText(`${percentage.toFixed(1)}%`, x, y);
      ctx.shadowBlur = 0;
    });
    ctx.restore();
  },
};

function AdsPage() {
  const [costItems, setCostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startMonth, setStartMonth] = useState(campaignOverviewFirstMonth);
  const [endMonth, setEndMonth] = useState(campaignOverviewLastMonth);
  const chartInstances = useRef({});

  useEffect(() => {
    getData('costItems').then((cost) => {
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
    () => campaignOverviewMonthly.filter((item) => item.month >= startMonth && item.month <= endMonth),
    [startMonth, endMonth]
  );
  const campaignTotals = useMemo(() => {
    const totals = filteredMonthlyData.reduce((acc, item) => ({
      cost: acc.cost + item.cost,
      orders: acc.orders + item.orders,
      grossRevenue: acc.grossRevenue + item.grossRevenue,
    }), { cost: 0, orders: 0, grossRevenue: 0 });
    return {
      ...totals,
      roi: totals.cost ? totals.grossRevenue / totals.cost : 0,
      cpa: totals.orders ? totals.cost / totals.orders : 0,
    };
  }, [filteredMonthlyData]);

  useEffect(() => {
    if (loading) return;

    const renderChart = (canvasId, config) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      if (chartInstances.current[canvasId]) chartInstances.current[canvasId].destroy();
      chartInstances.current[canvasId] = new Chart(canvas, config);
    };

    renderChart('costBreakdown', {
      type: 'doughnut',
      plugins: [costValueLabels],
      data: {
        labels: costItems.map((item) => item.label),
        datasets: [{
          data: costItems.map((item) => item.value),
          backgroundColor: ['#2563eb', '#14b8a6', '#f59e0b', '#ef4444', '#a855f7'],
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
            position: 'top',
            labels: { usePointStyle: true, pointStyle: 'circle', padding: 14 },
          },
        },
      },
    });

    renderChart('adSpendChart', {
      data: {
        labels: filteredMonthlyData.map((item) => item.month),
        datasets: [
          {
            type: 'line',
            label: '광고비',
            data: filteredMonthlyData.map((item) => item.cost),
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b',
            pointRadius: 4,
            borderWidth: 3,
            tension: 0.2,
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: 'Gross revenue',
            data: filteredMonthlyData.map((item) => item.grossRevenue),
            borderColor: '#2563eb',
            backgroundColor: '#2563eb',
            pointRadius: 4,
            borderWidth: 3,
            tension: 0.2,
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: 'ROI',
            data: filteredMonthlyData.map((item) => item.roi),
            borderColor: '#14b8a6',
            backgroundColor: '#14b8a6',
            borderDash: [6, 5],
            pointRadius: 4,
            borderWidth: 3,
            tension: 0.2,
            yAxisID: 'y1',
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
            ticks: { callback: (value) => `$${Number(value).toLocaleString('en-US')}` },
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { callback: (value) => `${Number(value).toFixed(1)}x` },
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
      <PageHeader title="광고관리" subtitle="Campaign overview 실제 광고비·Gross revenue·ROI 성과." />

      <section className="card">
        <div className="control-row" style={{ marginTop: 0 }}>
          <label>
            시작월
            <input type="month" value={startMonth} min={campaignOverviewFirstMonth} max={campaignOverviewLastMonth} onChange={handleStartMonthChange} />
          </label>
          <label>
            종료월
            <input type="month" value={endMonth} min={campaignOverviewFirstMonth} max={campaignOverviewLastMonth} onChange={handleEndMonthChange} />
          </label>
          <button type="button" onClick={() => { setStartMonth(campaignOverviewFirstMonth); setEndMonth(campaignOverviewLastMonth); }}>
            전체 기간
          </button>
          <span className="page-note" style={{ marginTop: 0 }}>Campaign overview 일별 결합본 2025-07-03 ~ {campaignOverviewDataAsOf} · 7월 Cost는 공식 Overview 총계 적용</span>
        </div>
      </section>

      <section className="grid cards-4" style={{ marginTop: 20 }}>
        <article className="card kpi"><span className="label">캠페인 광고비</span><span className="value">{formatCampaignCurrency(campaignTotals.cost)}</span><span className="desc">PDF Cost 합계</span></article>
        <article className="card kpi"><span className="label">광고 Gross revenue</span><span className="value">{formatCampaignCurrency(campaignTotals.grossRevenue)}</span><span className="desc">Current shop 귀속</span></article>
        <article className="card kpi"><span className="label">캠페인 ROI</span><span className="value">{campaignTotals.roi.toFixed(2)}x</span><span className="desc">Gross revenue ÷ Cost</span></article>
        <article className="card kpi"><span className="label">SKU 주문 / CPA</span><span className="value">{campaignTotals.orders.toLocaleString('en-US')}건</span><span className="desc">CPA {formatCampaignCurrency(campaignTotals.cpa)}</span></article>
      </section>

      <section className="grid cards-2" style={{ marginTop: 20 }}>
        <article className="card chart-card">
          <div className="chart-title"><div><h2>비용 구조</h2><small>원가·시딩비·수수료·물류비·기타 (스냅샷)</small></div></div>
          <canvas id="costBreakdown" />
        </article>
        <article className="card chart-card">
          <div className="chart-title"><div><h2>광고비 / Gross revenue / ROI</h2><small>{startMonth} ~ {endMonth}</small></div></div>
          <canvas id="adSpendChart" />
        </article>
      </section>

      <section className="grid cards-2" style={{ marginTop: 20 }}>
        <Link to="/product-leaderboard" className="card linked">
          <div className="chart-title"><div><h2>🏆 상품 성과 리더보드</h2><small>광고비를 어떤 상품에 더 태울지 판단할 때 참고</small></div></div>
          <p className="page-note" style={{ marginTop: 0 }}>매출 순위·전환율·재고 리스크를 상품별로 확인하고 광고 예산 배분에 활용하세요.</p>
        </Link>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>월별 Campaign overview</h2><small>PDF·XLSX 일별 데이터를 월별 합산 · ROI는 월 합계 기준 재계산</small></div><span className="badge good">7/27 원본 대조 완료</span></div>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>월</th><th>광고비</th>
                <th><span className="metric-term">SKU 주문 <span className="term-help" tabIndex="0" role="button" aria-label="SKU 주문 설명" data-tooltip="상품 옵션 단위 주문 수예요. 한 주문에 여러 옵션이 있으면 여러 건으로 셀 수 있습니다.">?</span></span></th>
                <th><span className="metric-term">CPA <span className="term-help" tabIndex="0" role="button" aria-label="CPA 설명" data-tooltip="주문 1건을 만드는 데 사용한 평균 광고비예요.">?</span></span></th>
                <th><span className="metric-term">Gross revenue <span className="term-help" tabIndex="0" role="button" aria-label="Gross revenue 설명" data-tooltip="해당 캠페인에 귀속된 총매출이에요.">?</span></span></th>
                <th><span className="metric-term">ROI <span className="term-help" tabIndex="0" role="button" aria-label="ROI 설명" data-tooltip="광고비 $1당 얼마의 매출이 발생했는지 보여줘요. 1.0x면 광고비와 매출이 같은 수준입니다.">?</span></span></th>
              </tr>
            </thead>
            <tbody>
              {filteredMonthlyData.map((item) => (
                <tr key={item.month}>
                  <td><strong>{item.month}</strong></td>
                  <td>{formatCampaignCurrency(item.cost)}</td>
                  <td>{item.orders.toLocaleString('en-US')}건</td>
                  <td>{item.orders ? formatCampaignCurrency(item.cpa) : '–'}</td>
                  <td>{formatCampaignCurrency(item.grossRevenue)}</td>
                  <td><strong>{item.roi.toFixed(2)}x</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="page-note">※ 최신 결합 합계: 광고비 $100,480.97 · SKU 주문 2,724건 · Gross revenue $55,259.58 · ROI 0.55x. 2026년 7월 Cost는 공식 Overview 총계 $34,164.02에 맞췄으며, Shop Analytics 전체 GMV와 Campaign Gross revenue는 귀속 기준이 달라 별도 관리합니다.</p>
      </section>
    </>
  );
}

export default AdsPage;
