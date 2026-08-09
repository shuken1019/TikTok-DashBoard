import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import PageHeader from '../components/PageHeader';
import { getData } from '../api';
import { formatCurrency } from '../format';
import { verifiedProductTraffic } from '../data/productTraffic';

Chart.register(...registerables);

const exactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function findVerifiedProduct(product) {
  return verifiedProductTraffic.find((item) => item.name === product) || null;
}

const chartOptions = {
  responsive: true,
  plugins: { legend: { position: 'top' } },
  scales: {
    x: { title: { display: true, text: '날짜' } },
    y: { beginAtZero: true, title: { display: true, text: '매출 (USD)' }, ticks: { callback: (value) => '$' + value / 1000 + 'k' } },
  },
};

function ProductsPage() {
  const [productSales, setProductSales] = useState([]);
  const [productCosts, setProductCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [startDate, setStartDate] = useState('2026-02-01');
  const [endDate, setEndDate] = useState('2026-07-26');
  const chartRef = useRef(null);

  useEffect(() => {
    Promise.all([getData('productSales'), getData('productCosts')]).then(([sales, costs]) => {
      setProductSales(sales);
      setProductCosts(costs);
      const firstProduct = [...new Set(sales.map((item) => item.product))][0] || '';
      setSelectedProduct(firstProduct);
      setLoading(false);
    });
  }, []);

  const uniqueProducts = useMemo(
    () => [...new Set([...productSales.map((item) => item.product), ...verifiedProductTraffic.map((item) => item.name)])],
    [productSales]
  );
  const verifiedProfile = useMemo(() => findVerifiedProduct(selectedProduct), [selectedProduct]);

  const filtered = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const source = verifiedProfile
      ? verifiedProfile.monthly.map((item) => ({ date: item.date, product: selectedProduct, sales: item.gmv }))
      : productSales;
    return source
      .filter((item) => item.product === selectedProduct)
      .filter((item) => {
        const date = new Date(item.date);
        return date >= start && date <= end;
      });
  }, [productSales, selectedProduct, startDate, endDate, verifiedProfile]);

  const totalSales = filtered.reduce((sum, item) => sum + item.sales, 0);
  const avgSales = filtered.length ? Math.round(totalSales / filtered.length) : 0;
  const trafficStats = useMemo(() => {
    if (!verifiedProfile) return null;
    const rows = verifiedProfile.monthly;
    const totalGmv = rows.reduce((sum, row) => sum + row.gmv, 0);
    const totalOrders = rows.reduce((sum, row) => sum + row.orders, 0);
    const totalItems = rows.reduce((sum, row) => sum + row.itemsSold, 0);
    const totalImpressions = rows.reduce((sum, row) => sum + row.impressions, 0);
    const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0);
    const peak = rows.reduce((best, row) => (row.gmv > best.gmv ? row : best), rows[0]);
    const june = rows[rows.length - 1];
    return {
      totalGmv,
      totalOrders,
      totalItems,
      totalImpressions,
      totalClicks,
      weightedCtr: totalImpressions ? totalClicks / totalImpressions * 100 : 0,
      peak,
      june,
      juneShopShare: verifiedProfile.juneShopGmv ? june.gmv / verifiedProfile.juneShopGmv * 100 : null,
    };
  }, [verifiedProfile]);

  useEffect(() => {
    if (loading) return;
    const canvas = document.getElementById('productSalesChart');
    if (!canvas) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvas, {
      type: 'line',
      data: {
        labels: filtered.map((item) => item.date),
        datasets: [
          {
            label: `${selectedProduct} 매출`,
            data: filtered.map((item) => item.sales),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            tension: 0,
            fill: true,
            pointRadius: 5,
          },
        ],
      },
      options: chartOptions,
    });

    return () => chartRef.current?.destroy();
  }, [filtered, selectedProduct, loading]);

  if (loading) return null;

  return (
    <>
      <PageHeader title="상품별 매출" subtitle="상품 선택 + 날짜별 조회, 마진 구조까지 한 페이지에서." />

      <section className="card chart-card">
        <div className="chart-title"><div><h2>상품별 매출 추이</h2><small>상품 선택 + 날짜별 조회</small></div></div>
        <div className="control-row">
          <label>
            상품 선택
            <select value={selectedProduct} onChange={(event) => {
              const product = event.target.value;
              const verified = findVerifiedProduct(product);
              setSelectedProduct(product);
              if (verified) {
                setStartDate(verified.period.slice(0, 10));
                setEndDate(verified.period.slice(-10));
              }
            }}>
              {uniqueProducts.map((product) => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
          </label>
          <label>시작일<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label>종료일<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
        </div>
        <canvas id="productSalesChart" style={{ marginTop: 18 }} />
      </section>

      <section className="grid cards-3" style={{ marginTop: 20 }}>
        <article className="card kpi">
          <span className="label">선택 상품</span>
          <span className="value">{selectedProduct || '-'}</span>
          <span className="desc">현재 선택된 상품</span>
        </article>
        <article className="card kpi">
          <span className="label">선택 기간 합계</span>
          <span className="value">{verifiedProfile ? exactCurrency.format(totalSales) : formatCurrency(totalSales)}</span>
          <span className="desc">선택 기간 총 매출</span>
        </article>
        <article className="card kpi">
          <span className="label">{verifiedProfile ? '월 평균 GMV' : '일 평균 매출'}</span>
          <span className="value">{verifiedProfile ? exactCurrency.format(totalSales / (filtered.length || 1)) : formatCurrency(avgSales)}</span>
          <span className="desc">{verifiedProfile ? `${filtered.length}개월 월 평균` : '기간의 일별 평균 매출'}</span>
        </article>
      </section>

      {verifiedProfile && trafficStats && (
        <section className="card seven-vegan-profile" style={{ marginTop: 20 }}>
          <div className="product-profile-head">
            <div>
              <span className="eyebrow">VERIFIED PRODUCT TRAFFIC</span>
              <h2>{verifiedProfile.fullName}</h2>
              <p>{verifiedProfile.description}</p>
              <div className="product-profile-meta">
                <span>Product ID {verifiedProfile.productId}</span>
                <span>{verifiedProfile.category}</span>
                <span>{verifiedProfile.period}</span>
                {verifiedProfile.priceSnapshot && <span>현재가 {exactCurrency.format(verifiedProfile.priceSnapshot.final)} · 정가 {exactCurrency.format(verifiedProfile.priceSnapshot.retail)} · 프로모션 -{exactCurrency.format(verifiedProfile.priceSnapshot.promotion)} ({verifiedProfile.priceSnapshot.asOf})</span>}
              </div>
            </div>
            <span className="badge good">원본 {verifiedProfile.sourceCount}개 파일 검증</span>
          </div>
          <div className="grid cards-4 product-traffic-kpis">
            <article><span>{verifiedProfile.monthly[0].month}~{verifiedProfile.monthly.at(-1).month} 누적 GMV</span><strong>{exactCurrency.format(trafficStats.totalGmv)}</strong><small>상품 단일 실적</small></article>
            <article><span>누적 주문</span><strong>{trafficStats.totalOrders.toLocaleString('en-US')}건</strong><small>판매 {trafficStats.totalItems.toLocaleString('en-US')}개</small></article>
            <article><span>가중 평균 CTR</span><strong>{trafficStats.weightedCtr.toFixed(2)}%</strong><small>노출 {trafficStats.totalImpressions.toLocaleString('en-US')} · 클릭 {trafficStats.totalClicks.toLocaleString('en-US')}</small></article>
            <article><span>최고 매출월</span><strong>{trafficStats.peak.month}</strong><small>{exactCurrency.format(trafficStats.peak.gmv)}</small></article>
          </div>
          <div className="product-traffic-insight">
            <strong>자동 분석</strong>
            <p>
              {trafficStats.peak.month} GMV가 {exactCurrency.format(trafficStats.peak.gmv)}로 최고점이며 당시 CTR은 {trafficStats.peak.ctr.toFixed(2)}%입니다.
              {trafficStats.juneShopShare !== null
                ? <> 최신 상품 GMV {exactCurrency.format(trafficStats.june.gmv)}는 같은 달 Shop 전체 GMV {exactCurrency.format(verifiedProfile.juneShopGmv)}의 <b>{trafficStats.juneShopShare.toFixed(1)}%</b>입니다.</>
                : <> 최신 집계 {trafficStats.june.month} GMV는 {exactCurrency.format(trafficStats.june.gmv)}, CTR은 {trafficStats.june.ctr.toFixed(2)}%입니다.</>}
              {trafficStats.peak.month === trafficStats.june.month
                ? ' 최신 기간이 현재 최고 매출 구간입니다.'
                : ` 최고점 이후 최신 GMV는 ${((trafficStats.june.gmv / trafficStats.peak.gmv - 1) * 100).toFixed(1)}% 변했습니다.`}
            </p>
          </div>
          <div className="table-scroll">
            <table className="table product-traffic-table">
              <thead>
                <tr><th>월</th><th>GMV</th><th>주문</th><th>판매</th><th>상품 노출</th><th>상품 클릭</th><th>CTR</th><th>장바구니</th><th>CTOR</th><th>Shop Tab GMV</th></tr>
              </thead>
              <tbody>
                {verifiedProfile.monthly.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td><td>{exactCurrency.format(row.gmv)}</td><td>{row.orders.toLocaleString('en-US')}</td>
                    <td>{row.itemsSold.toLocaleString('en-US')}</td><td>{row.impressions.toLocaleString('en-US')}</td>
                    <td>{row.clicks.toLocaleString('en-US')}</td><td>{row.ctr.toFixed(2)}%</td>
                    <td>{row.addToCart.toLocaleString('en-US')}</td><td>{row.ctor.toFixed(2)}%</td><td>{exactCurrency.format(row.shopTabGmv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><h2>상세 매출 테이블</h2><small>{verifiedProfile ? '월별 상품 GMV · 원본 집계' : '날짜별 판매 금액'}</small></div>
        <table className="table">
          <thead><tr><th>날짜</th><th>상품</th><th>매출</th></tr></thead>
          <tbody>
            {filtered.map((item, index) => (
              <tr key={`${item.date}-${index}`}>
                <td>{item.date}</td>
                <td>{item.product}</td>
                <td>{verifiedProfile ? exactCurrency.format(item.sales) : formatCurrency(item.sales)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title">
          <div><h2>제품 가격·원가·Affiliate 마진</h2><small>2026-08-08 제공 번들 할인 마진표 · 검증된 번들 계산 구간 기준</small></div>
          <span className="badge good">계산식 대조 완료</span>
        </div>
        <div className="product-cost-audit">
          <strong>보고 기준</strong>
          <span>Affiliate 순이익 = 실판매가 − Affiliate 적용 상품비 − Affiliate 수수료</span>
          <span>Collagen bundle: $39.10 − $27.88 − $13.80 = <b className="negative">-$2.58 (-6.60%)</b></span>
        </div>
        <div className="bundle-margin-summary">
          <article className="bundle-margin-card danger"><strong>Collagen Booster Set</strong><span>15% 할인 시 -$2.58</span><small>손익 0 가격 $41.68 · 최대 할인 9.39%</small></article>
          <article className="bundle-margin-card good"><strong>Rice Bundle Set</strong><span>현재 기준 +$6.67</span><small>손익 0 가격 $38.33 · 최대 할인 14.82%</small></article>
          <article className="bundle-margin-card warning"><strong>현재 프로모션 확인</strong><span>Seller Center 최종가 $25.19</span><small>같은 비용 가정 시 -$16.49 (-65.47%) · 할인 부담 주체 확인 필요</small></article>
        </div>
        <div className="table-scroll">
          <table className="table product-cost-table">
            <thead>
              <tr>
                <th>SKU / 제품</th><th>구분</th><th>소비자가</th><th>실판매가</th><th>할인율</th><th>손익 0 기준</th>
                <th>FOB <span className="term-help" title="해외 운송 전, 공급처에서 출고되는 기준 가격입니다.">?</span></th>
                <th>생산원가</th><th>유통비</th>
                <th>MCF <span className="term-help" title="마진표에 입력된 주문 처리·풀필먼트 기준값입니다.">?</span></th>
                <th>TikTok 수수료</th><th>Affiliate 수수료</th>
                <th>Affiliate 적용 상품비 <span className="term-help" title="마진표가 Affiliate 판매 계산에 사용하는 상품·운영비 합계입니다.">?</span></th>
                <th>총비용</th><th>순이익</th><th>마진</th>
              </tr>
            </thead>
            <tbody>
              {productCosts.map((item, index) => {
                const profitTone = Number(item.netProfit) >= 0 ? 'positive' : 'negative';
                return (
                  <tr key={`${item.name}-${index}`}>
                    <td><strong>{item.name}</strong></td>
                    <td><span className={`cost-scope ${item.scope === '본표' ? 'current' : 'scenario'}`}>{item.scope || '-'}</span></td>
                    <td>{exactCurrency.format(item.retailPrice)}</td><td><strong>{exactCurrency.format(item.salePrice)}</strong></td>
                    <td>{Number(item.discount || 0).toFixed(2)}%</td>
                    <td>{item.breakEvenPrice != null ? `${exactCurrency.format(item.breakEvenPrice)} / ${Number(item.maxDiscount).toFixed(2)}%` : '-'}</td>
                    <td>{exactCurrency.format(item.fobPrice)}</td><td>{exactCurrency.format(item.productionCost)}</td>
                    <td>{exactCurrency.format(item.distribution)}</td><td>{exactCurrency.format(item.mcf)}</td>
                    <td>{exactCurrency.format(item.tiktokFee)}</td><td>{exactCurrency.format(item.affiliateFee)}</td>
                    <td>{exactCurrency.format(item.affiliateProductCost)}</td><td>{exactCurrency.format(item.totalCost)}</td>
                    <td><strong className={`cost-profit ${profitTone}`}>{exactCurrency.format(item.netProfit)}</strong></td>
                    <td><strong className={`cost-profit ${profitTone}`}>{Number(item.margin).toFixed(2)}%</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="product-cost-source">※ `번들 계산`은 원본 하단 전용 계산 구간입니다. 원본의 오류 수식 8행과 비정상 수수료 입력 행은 자동 반영하지 않았습니다. $25.19는 Seller Center 화면의 현재 프로모션 최종가이며, 플랫폼 부담 할인 여부가 확인되기 전에는 확정 손익으로 보고하지 않습니다.</p>
      </section>
    </>
  );
}

export default ProductsPage;
