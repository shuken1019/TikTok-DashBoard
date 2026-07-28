import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { getData } from '../api';
import { formatCurrency } from '../format';

const TOP_N = 12;

function statusOf(item) {
  if (item.stock === 0) return { label: '품절', cls: 'bad' };
  if (item.atRisk) return { label: '소진 임박', cls: 'warn' };
  if (item.sales === 0) return { label: '판매 0건', cls: 'info' };
  return { label: '정상', cls: 'good' };
}

function actionOf(item) {
  if (item.stock === 0) return '재입고 필요';
  if (item.atRisk) return '재고 보충 검토';
  if (item.sales === 0 && item.views > 500) return '노출은 있는데 전환 0건 — 리스팅/가격 점검';
  if (item.sales === 0) return '노출 자체가 부족 — 광고/콘텐츠 필요';
  return '현상 유지';
}

function ProductLeaderboardPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getData('inventory').then((data) => {
      setInventory(data);
      setLoading(false);
    });
  }, []);

  const sorted = useMemo(() => [...inventory].sort((a, b) => b.sales - a.sales), [inventory]);

  const stats = useMemo(() => {
    const totalSales = inventory.reduce((s, i) => s + i.sales, 0);
    const totalSold = inventory.reduce((s, i) => s + i.sold, 0);
    const totalViews = inventory.reduce((s, i) => s + i.views, 0);
    const zeroSales = inventory.filter((i) => i.sales === 0).length;
    const atRisk = inventory.filter((i) => i.atRisk).length;
    const soldOut = inventory.filter((i) => i.stock === 0).length;
    const top = sorted[0];
    const topSharePct = top && totalSales ? (top.sales / totalSales) * 100 : 0;
    return { totalSales, totalSold, totalViews, zeroSales, atRisk, soldOut, top, topSharePct };
  }, [inventory, sorted]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter((item) => item.name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term));
  }, [sorted, search]);

  if (loading) return null;

  const leaderTop = sorted.slice(0, TOP_N);
  const maxSales = stats.top ? stats.top.sales : 1;

  return (
    <>
      <PageHeader title="상품 성과 리더보드" subtitle="실제 재고/판매 데이터 기준 상품별 매출 순위와 오늘 봐야 할 리스크." />

      <section className="grid cards-4">
        <article className="card kpi">
          <span className="label">전체 SKU 매출</span>
          <span className="value">{formatCurrency(stats.totalSales)}</span>
          <span className="desc">{inventory.length}개 SKU 합계</span>
        </article>
        <article className="card kpi">
          <span className="label">1위 상품 매출 집중도</span>
          <span className="value">{stats.topSharePct.toFixed(1)}%</span>
          <span className="desc">{stats.top?.name.slice(0, 24)}{stats.top?.name.length > 24 ? '…' : ''}</span>
        </article>
        <article className="card kpi">
          <span className="label">판매 0건 SKU</span>
          <span className="value">{stats.zeroSales}개</span>
          <span className="desc">재고만 차지 중일 가능성</span>
        </article>
        <article className="card kpi">
          <span className="label">품절 / 소진 임박</span>
          <span className="value">{stats.soldOut}개 / {stats.atRisk}개</span>
          <span className="desc">즉시 조치가 필요한 SKU</span>
        </article>
      </section>

      <section className="grid cards-2" style={{ marginTop: 20 }}>
        <article className="card" style={{ gridColumn: 'span 1' }}>
          <div className="panic-box">
            <h3>오늘 당장 봐야 할 것</h3>
            <ul>
              {stats.top && stats.topSharePct > 40 && (
                <li>매출 1위 &quot;{stats.top.name}&quot;가 전체 매출의 {stats.topSharePct.toFixed(0)}%를 차지 — 이 상품이 흔들리면 전체 매출이 흔들립니다.</li>
              )}
              {stats.soldOut > 0 && <li>품절 SKU {stats.soldOut}개 — 판매 기회 손실 중, 재입고 우선순위 확인 필요.</li>}
              {stats.atRisk > 0 && <li>재고 소진 임박 SKU {stats.atRisk}개 — 재주문 안 하면 곧 품절.</li>}
              {stats.zeroSales > 0 && <li>판매 0건 SKU {stats.zeroSales}개 — 리스팅/가격/콘텐츠 점검이 필요합니다.</li>}
            </ul>
          </div>
        </article>
        <article className="card">
          <div className="chart-title"><div><h2>상품 유형별 요약</h2><small>재고 데이터 기준</small></div></div>
          <table className="table">
            <tbody>
              <tr><td>누적 판매 수량</td><td>{stats.totalSold.toLocaleString('en-US')}개</td></tr>
              <tr><td>누적 조회수</td><td>{stats.totalViews.toLocaleString('en-US')}회</td></tr>
              <tr><td>전체 평균 전환율</td><td>{stats.totalViews ? ((stats.totalSold / stats.totalViews) * 100).toFixed(2) : 0}%</td></tr>
              <tr><td>정상 판매 중 SKU</td><td>{inventory.length - stats.zeroSales - stats.soldOut}개</td></tr>
            </tbody>
          </table>
        </article>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>매출 TOP {TOP_N}</h2><small>매출 기준 내림차순, 막대는 1위 대비 비율</small></div></div>
        <div className="leader-row head hide-sm">
          <div>순위</div><div>상품</div><div>매출</div><div>판매량</div><div>전환율</div><div>상태</div><div>오늘 할 일</div>
        </div>
        {leaderTop.map((item, index) => {
          const status = statusOf(item);
          const conv = item.views ? (item.sold / item.views) * 100 : 0;
          const share = maxSales ? (item.sales / maxSales) * 100 : 0;
          return (
            <div className="leader-row" key={`${item.id}-${index}`}>
              <div><span className={`leader-rank ${status.cls === 'bad' || status.cls === 'warn' ? 'risk' : ''}`}>{index + 1}</span></div>
              <div className="leader-name">
                {item.name}
                <small>{item.sku}</small>
                <div className="meter"><span style={{ width: `${Math.min(share, 100)}%` }} /></div>
              </div>
              <div>{formatCurrency(item.sales)}</div>
              <div>{item.sold}개</div>
              <div>{conv.toFixed(2)}%</div>
              <div><span className={`badge ${status.cls}`}>{status.label}</span></div>
              <div className="mini" style={{ fontSize: 12, color: 'var(--muted)' }}>{actionOf(item)}</div>
            </div>
          );
        })}
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>전체 SKU 상세</h2><small>{inventory.length}개 전체, 매출 내림차순</small></div></div>
        <div className="control-row" style={{ marginTop: 0 }}>
          <label>
            상품명/SKU 검색
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="상품명 또는 SKU" />
          </label>
        </div>
        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr><th>상품</th><th>재고</th><th>가격</th><th>조회수</th><th>판매</th><th>매출</th><th>전환율</th><th>상태</th><th>오늘 할 일</th></tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => {
              const status = statusOf(item);
              const conv = item.views ? (item.sold / item.views) * 100 : 0;
              return (
                <tr key={`${item.id}-${index}`}>
                  <td>{item.name}</td>
                  <td>{item.stock.toLocaleString('en-US')}</td>
                  <td>{item.price}</td>
                  <td>{item.views.toLocaleString('en-US')}</td>
                  <td>{item.sold}개</td>
                  <td>{formatCurrency(item.sales)}</td>
                  <td>{conv.toFixed(2)}%</td>
                  <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{actionOf(item)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}

export default ProductLeaderboardPage;
