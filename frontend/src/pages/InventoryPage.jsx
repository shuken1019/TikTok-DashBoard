import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { getData } from '../api';

function statusOf(item) {
  if (item.stock === 0) return { label: '품절', cls: 'bad' };
  if (item.atRisk) return { label: '소진 임박', cls: 'warn' };
  return { label: '정상', cls: 'good' };
}

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getData('inventory').then((data) => {
      setInventory(data);
      setLoading(false);
    });
  }, []);

  const soldOut = inventory.filter((item) => item.stock === 0).length;
  const atRisk = inventory.filter((item) => item.stock !== 0 && item.atRisk).length;
  const totalStock = inventory.reduce((sum, item) => sum + item.stock, 0);
  const risky = useMemo(() => inventory.filter((item) => item.stock === 0 || item.atRisk), [inventory]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return inventory;
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.id.toLowerCase().includes(term) ||
        item.sku.toLowerCase().includes(term)
    );
  }, [inventory, search]);

  if (loading) return null;

  return (
    <>
      <PageHeader title="재고관리" subtitle='TikTok Shop Seller Center "Manage products" 기준 실제 재고 현황.' />

      <section className="card">
        <div className="snapshot-banner">
          <span className="snapshot-icon">◎</span>
          <div><strong>현재 재고 Snapshot</strong><p>기간형 데이터가 아니므로 날짜 필터 대신 마지막 동기화 일자를 관리합니다.</p></div>
          <span className="badge warn">최신일 미등록</span>
          <a href="/admin">재고 업데이트 →</a>
        </div>
      </section>

      <section className="grid cards-4" style={{ marginTop: 20 }}>
        <article className="card kpi">
          <span className="label">전체 SKU</span>
          <span className="value">{inventory.length}</span>
          <span className="desc">Active 상품 기준</span>
        </article>
        <article className="card kpi">
          <span className="label">품절 SKU</span>
          <span className="value">{soldOut}</span>
          <span className="desc">재고 0개</span>
        </article>
        <article className="card kpi">
          <span className="label">재고 소진 임박</span>
          <span className="value">{atRisk}</span>
          <span className="desc">판매 속도 대비 재고 부족</span>
        </article>
        <article className="card kpi">
          <span className="label">총 재고 수량</span>
          <span className="value">{totalStock.toLocaleString('en-US')}</span>
          <span className="desc">품절 제외 합계</span>
        </article>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>재고 리스크 상품</h2><small>품절 또는 소진 임박 SKU</small></div></div>
        <table className="table">
          <thead><tr><th>상품</th><th>재고</th><th>누적 판매</th><th>상태</th></tr></thead>
          <tbody>
            {risky.map((item, index) => {
              const status = statusOf(item);
              return (
                <tr key={`${item.id}-${index}`}>
                  <td>{item.name}</td>
                  <td>{item.stock.toLocaleString('en-US')}</td>
                  <td>{item.sold}개</td>
                  <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="chart-title"><div><h2>전체 재고 현황</h2><small>Manage products 데이터 기준</small></div></div>
        <div className="control-row">
          <label>
            상품명/ID/SKU 검색
            <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="상품명, ID, SKU" />
          </label>
        </div>
        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr><th>상품</th><th>ID / SKU</th><th>재고</th><th>가격</th><th>조회수</th><th>누적 판매</th><th>상태</th></tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => {
              const status = statusOf(item);
              return (
                <tr key={`${item.id}-${index}`}>
                  <td>{item.name}</td>
                  <td>{item.id}<br />{item.sku}</td>
                  <td>{item.stock.toLocaleString('en-US')}</td>
                  <td>{item.price}</td>
                  <td>{item.views.toLocaleString('en-US')}</td>
                  <td>{item.sold}개 / ${Number(item.sales).toFixed(2)}</td>
                  <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}

export default InventoryPage;
