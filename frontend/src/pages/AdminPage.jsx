import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import EditableTable from '../components/EditableTable';
import ForecastEditor from '../components/ForecastEditor';

const DATA_SOURCES = [
  { name: 'Shop Analytics', detail: '일별 판매 원본', period: '2025.11.01–2026.08.07', size: '280일 · GMV $42,438.52', mode: 'Embedded', pages: '전체 매출 · 데이터센터 · 상품', status: '8/7 세금·배송비 미집계', tone: 'warn' },
  { name: 'Campaign overview', detail: '일별 Cost·주문·Gross revenue·ROI', period: '유효 데이터 2025.07.03–2026.07.27', size: '390일 · Cost $100,480.97 · ROI 0.55x', mode: 'XLSX + 공식 UI', pages: '광고관리 · 전체 매출 · 상세', status: '8/8 파일 데이터 행 0건', tone: 'warn' },
  { name: 'Monthly Finance', detail: '정산 Total Revenue·광고비·배부 비용', period: '2025.11–2026.08.07', size: '누적 Total Revenue $60,516.67', mode: 'XLSX + Admin', pages: '손익 · Forecast', status: '8월 매출만 확인 · 비용 미수집', tone: 'warn' },
  { name: 'Product campaign', detail: '상품 캠페인 단위 export', period: '2026.08.08', size: '데이터 행 0건', mode: 'XLSX', pages: '캠페인', status: '헤더만 존재', tone: 'warn' },
  { name: 'Affiliate Videos 2–4월', detail: '영상 단위 export', period: '2026.02.01–04.30', size: '182개 영상', mode: 'PDF 수동', pages: '어필리에이터', status: '완료', tone: 'good' },
  { name: 'Affiliate Videos 5–7월', detail: '영상 단위 export', period: '2026.05.01–07.23', size: '722개 영상', mode: 'PDF 수동', pages: '어필리에이터', status: '부분월', tone: 'warn' },
  { name: 'Affiliate Core Metrics', detail: '영상·LIVE·쇼케이스 귀속', period: '2026.07.01–07.25', size: 'GMV $7,007.76 · 수수료 $2,282.78', mode: 'XLSX', pages: '어필리에이터', status: '검증 완료', tone: 'good' },
  { name: 'Affiliate 상세 목록', detail: 'Creator·Video·LIVE·Product', period: '2026.07.01–07.24', size: 'Creator 6,272 · Video 1,510 · LIVE 108 · Product 42', mode: 'XLSX', pages: '어필리에이터 · 라이브', status: 'Core보다 1일 지연', tone: 'warn' },
  { name: 'Sample Performance', detail: '샘플 발송/콘텐츠 ROI', period: '45일 ROI snapshot', size: '2,099건 발송', mode: 'PDF 수동', pages: '어필리에이터 · 비용', status: '스냅샷', tone: 'warn' },
  { name: '운영 마스터', detail: '재고·원가·광고비', period: '관리자 입력 기준', size: 'SKU 단위', mode: '수동 입력', pages: '재고 · 광고 · 손익', status: '최신일 없음', tone: 'warn' },
];

const TABS = [
  { key: 'inventory', label: '재고관리' },
  { key: 'monthly', label: '월별 매출·광고비' },
  { key: 'forecast', label: 'Forecast' },
  { key: 'cost', label: '비용구조' },
  { key: 'productSales', label: '상품별 매출' },
  { key: 'productCosts', label: '제품 비용 & 마진' },
  { key: 'dataSources', label: '데이터 소스 현황' },
];

function AdminPage() {
  const [activeTab, setActiveTab] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    return TABS.some((tab) => tab.key === requested) ? requested : 'inventory';
  });

  return (
    <>
      <PageHeader
        title="Admin"
        subtitle="대시보드에 표시되는 모든 데이터를 여기서 추가/수정/삭제합니다. 저장하면 각 페이지에 바로 반영됩니다."
      />

      <section className="card">
        <div className="admin-tab-row">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`admin-tab${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'inventory' && (
        <EditableTable
          resource="inventory"
          title="재고관리"
          subtitle='TikTok Shop Seller Center "Manage products" 기준 SKU 데이터'
          searchable
          columns={[
            { field: 'name', label: '상품명', type: 'text' },
            { field: 'id', label: 'ID', type: 'text' },
            { field: 'sku', label: 'SKU', type: 'text' },
            { field: 'stock', label: '재고', type: 'number' },
            { field: 'price', label: '가격', type: 'text' },
            { field: 'views', label: '조회수', type: 'number' },
            { field: 'sold', label: '판매수량', type: 'number' },
            { field: 'sales', label: '판매액($)', type: 'number', step: '0.01' },
            { field: 'atRisk', label: '소진임박', type: 'checkbox' },
          ]}
        />
      )}

      {activeTab === 'monthly' && (
        <>
          <section className="card source-verification-card" style={{ marginTop: 20 }}>
            <span className="badge good">원본 검증 완료</span>
            <strong>매출 기준은 정산 XLSX의 Total Revenue입니다.</strong>
            <p className="page-note">2025.11~2026.07 마감 매출에 2026.08.01~08.07(UTC-7) Total Revenue $13,052.48을 추가했습니다. 누적은 $60,516.67입니다. 8월 광고비·총비용은 캠페인 파일에 데이터 행이 없어 미수집 상태로 유지합니다.</p>
          </section>
          <EditableTable
            resource="monthly"
            title="월별 실적·목표·마케팅 예산"
            subtitle="실적 매출은 정산 Total Revenue, 2026.08~2027.12 목표와 예산은 예산·ROI 플랜 원본입니다. 저장하면 손익·Forecast 화면에 반영됩니다."
            columns={[
              { field: 'month', label: '월', type: 'text' },
              { field: 'revenue', label: '매출 (Total Revenue)', type: 'number', step: '0.01' },
              { field: 'adSpend', label: '광고비 (미수집은 공란)', type: 'number', step: '0.01', optional: true },
              { field: 'totalCost', label: '총비용 (미수집은 공란)', type: 'number', step: '0.01', optional: true },
              { field: 'targetRevenue', label: '목표 매출', type: 'number', step: '0.01' },
              { field: 'targetAdSpend', label: '마케팅 예산', type: 'number', step: '0.01' },
            ]}
          />
        </>
      )}

      {activeTab === 'forecast' && <ForecastEditor />}

      {activeTab === 'cost' && (
        <EditableTable
          resource="costItems"
          title="비용구조"
          subtitle="광고관리 페이지의 비용구조 도넛차트에 반영됩니다."
          columns={[
            { field: 'label', label: '항목명', type: 'text' },
            { field: 'value', label: '금액', type: 'number' },
          ]}
        />
      )}

      {activeTab === 'productSales' && (
        <EditableTable
          resource="productSales"
          title="상품별 매출"
          subtitle="상품별매출 페이지의 날짜별 매출 차트/테이블에 반영됩니다."
          searchable
          columns={[
            { field: 'date', label: '날짜', type: 'date' },
            { field: 'product', label: '상품', type: 'text' },
            { field: 'sales', label: '매출', type: 'number' },
          ]}
        />
      )}

      {activeTab === 'productCosts' && (
        <EditableTable
          resource="productCosts"
          title="제품 비용 & 마진"
          subtitle="상품별매출 페이지의 제품 비용 & 마진 테이블에 반영됩니다."
          searchable
          columns={[
            { field: 'name', label: 'SKU / 제품', type: 'text' },
            { field: 'scope', label: '구분', type: 'text' },
            { field: 'retailPrice', label: '소비자가', type: 'number', step: '0.01' },
            { field: 'salePrice', label: '실판매가', type: 'number', step: '0.01' },
            { field: 'fobPrice', label: 'FOB', type: 'number', step: '0.01' },
            { field: 'productionCost', label: '생산원가', type: 'number', step: '0.01' },
            { field: 'distribution', label: '유통비', type: 'number', step: '0.01' },
            { field: 'mcf', label: 'MCF', type: 'number', step: '0.01' },
            { field: 'tiktokFee', label: 'TikTok 수수료', type: 'number', step: '0.01' },
            { field: 'affiliateFee', label: 'Affiliate 수수료', type: 'number', step: '0.01' },
            { field: 'affiliateProductCost', label: 'Affiliate 적용 상품비', type: 'number', step: '0.01' },
            { field: 'totalCost', label: '총비용', type: 'number', step: '0.01' },
            { field: 'netProfit', label: '순이익', type: 'number', step: '0.01' },
            { field: 'margin', label: '마진 %', type: 'number', step: '0.01' },
          ]}
        />
      )}

      {activeTab === 'dataSources' && (
        <section className="card data-source-card" style={{ marginTop: 20 }}>
          <div className="chart-title">
            <div><span className="eyebrow">SOURCE REGISTRY</span><h2>데이터 소스 현황</h2><small>원본마다 기간과 모수가 다르므로 합산 전 반드시 확인</small></div>
            <span className="badge warn">다음 점검 · 7월 마감 후</span>
          </div>
          <div className="table-scroll">
            <table className="table data-source-table">
              <thead><tr><th>소스</th><th>보유 기간 / 기준일</th><th>규모</th><th>갱신 방식</th><th>연결 페이지</th><th>상태</th></tr></thead>
              <tbody>
                {DATA_SOURCES.map((source) => (
                  <tr key={source.name}>
                    <td><strong>{source.name}</strong><small>{source.detail}</small></td>
                    <td>{source.period}</td>
                    <td>{source.size}</td>
                    <td><span className={`source-mode ${source.mode === 'Embedded' ? 'auto' : 'manual'}`}>{source.mode}</span></td>
                    <td>{source.pages}</td>
                    <td><span className={`badge ${source.tone}`}>{source.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

export default AdminPage;
