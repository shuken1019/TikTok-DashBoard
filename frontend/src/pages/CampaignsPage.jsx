import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import {
  campaignDataAsOf,
  platformCampaigns,
  registeredCampaigns,
  smartPromotionPerformance,
  summerSalePerformance,
  summerSaleProducts,
} from '../data/campaignCenterData';

const currency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);
const number = (value) => new Intl.NumberFormat('en-US').format(value);
const shortDate = (value) => `${Number(value.slice(5, 7))}월 ${Number(value.slice(8, 10))}일`;

function CampaignsPage() {
  const [view, setView] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(platformCampaigns[0]);

  const visibleCampaigns = useMemo(
    () => platformCampaigns.filter((item) => (
      (view === 'all' || item.status === view)
      && item.name.toLowerCase().includes(query.trim().toLowerCase())
    )),
    [view, query]
  );

  const ongoing = registeredCampaigns.filter((item) => item.status === 'ongoing');
  const upcoming = platformCampaigns.filter((item) => item.status === 'upcoming');
  const approvedTotal = registeredCampaigns.reduce((sum, item) => sum + (item.approved || 0), 0);
  const campaignProgress = 34.03;
  const clickRate = summerSalePerformance.productImpressions
    ? summerSalePerformance.productClicks / summerSalePerformance.productImpressions * 100
    : 0;

  return (
    <>
      <PageHeader
        title="캠페인 센터"
        subtitle="진행 중인 캠페인 성과와 예정된 플랫폼 캠페인 일정을 한곳에서 준비하고 관리합니다."
      >
        <div className="affiliate-report-state"><span className="status-dot" />캠페인 캘린더 {campaignDataAsOf} 기준</div>
      </PageHeader>

      <section className="card campaign-toolbar">
        <div>
          <span className="eyebrow">CAMPAIGN VIEW</span>
          <strong>등록 진행 중 {ongoing.length}개 · 예정 플랫폼 {upcoming.length}개</strong>
          <small>플랫폼 일정은 변경될 수 있어 집행 전 Seller Center에서 재확인하세요.</small>
        </div>
        <div className="campaign-view-tabs">
          <button type="button" className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}>전체</button>
          <button type="button" className={view === 'ongoing' ? 'active' : ''} onClick={() => setView('ongoing')}>진행 중</button>
          <button type="button" className={view === 'upcoming' ? 'active' : ''} onClick={() => setView('upcoming')}>예정</button>
        </div>
        <label className="campaign-search">캠페인 검색<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름으로 검색" /></label>
      </section>

      <section className="grid campaign-kpi-grid">
        <article className="card kpi campaign-kpi blue"><span className="label">현재 등록 캠페인</span><span className="value">{ongoing.length}개</span><span className="desc">Summer Sale·Smart Promotion 포함</span></article>
        <article className="card kpi campaign-kpi teal"><span className="label">Summer Sale GMV</span><span className="value">{currency(summerSalePerformance.gmv)}</span><span className="desc">7/22~7/26 화면 집계</span></article>
        <article className="card kpi campaign-kpi purple"><span className="label">주문 / AOV</span><span className="value">{number(summerSalePerformance.orders)}건</span><span className="desc">AOV {currency(summerSalePerformance.aov)}</span></article>
        <article className="card kpi campaign-kpi rose"><span className="label">등록 승인 수</span><span className="value">{approvedTotal}</span><span className="desc">제품·Tik 등록 화면 합계</span></article>
        <article className="card kpi campaign-kpi amber"><span className="label">다음 플랫폼 캠페인</span><span className="value">8월 20일</span><span className="desc">Back To School 시작</span></article>
      </section>

      <section className="card campaign-calendar-card">
        <div className="chart-title">
          <div><span className="eyebrow">PLATFORM CALENDAR</span><h2>2026 캠페인 캘린더</h2><small>카드를 누르면 일정과 설명을 확인할 수 있습니다.</small></div>
          <span className="badge warn">Last updated · Jul 8, 2026</span>
        </div>
        <div className="campaign-calendar">
          {visibleCampaigns.map((item) => (
            <button type="button" key={item.id} className={`campaign-calendar-item ${item.status} ${selectedCampaign?.id === item.id ? 'selected' : ''}`} onClick={() => setSelectedCampaign(item)}>
              <span>{item.start.slice(0, 7).replace('-', '.')}</span>
              <strong>{item.name}</strong>
              <small>{shortDate(item.start)} ~ {shortDate(item.end)}</small>
              <b>{item.status === 'ongoing' ? '진행 중' : item.status === 'completed' ? '종료' : '예정'}</b>
            </button>
          ))}
        </div>
        {selectedCampaign && (
          <div className="campaign-detail-panel">
            <div>
              <span className="eyebrow">{selectedCampaign.tier} PLATFORM CAMPAIGN</span>
              <h3>{selectedCampaign.fullName}</h3>
              <p>{selectedCampaign.description}</p>
            </div>
            <div><span>캠페인 기간</span><strong>{selectedCampaign.start} ~ {selectedCampaign.end}</strong></div>
            <div><span>현재 상태</span><strong className={selectedCampaign.status}>{selectedCampaign.status === 'ongoing' ? '진행 중' : selectedCampaign.status === 'completed' ? '종료' : '예정'}</strong></div>
          </div>
        )}
      </section>

      <section className="card campaign-performance-card">
        <div className="chart-title">
          <div><span className="eyebrow">COMPLETED · SUMMER SALE</span><h2>최근 종료 캠페인 성과</h2><small>2026-07-22 ~ 2026-08-02 · 성과 수치는 {summerSalePerformance.asOf} 화면 기준</small></div>
          <span className="badge warn">8/8 신규 행 없음</span>
        </div>
        <div className="campaign-progress"><span style={{ width: `${campaignProgress}%` }} /></div>
        <div className="grid campaign-core-metrics">
          <div><span>GMV</span><strong>{currency(summerSalePerformance.gmv)}</strong><small>예상 TikTok 기여 {currency(summerSalePerformance.estimatedContribution)}</small></div>
          <div><span>상품 노출</span><strong>{number(summerSalePerformance.productImpressions)}</strong><small>상품 클릭 {number(summerSalePerformance.productClicks)} · {clickRate.toFixed(2)}%</small></div>
          <div><span>평균 고유 도달</span><strong>{number(summerSalePerformance.averageUniqueReach)}</strong><small>일평균 고객 {number(summerSalePerformance.averageDailyCustomers)}명</small></div>
          <div><span>Creator 콘텐츠</span><strong>영상 {summerSalePerformance.creatorVideos}</strong><small>Creator LIVE {summerSalePerformance.creatorLives}회</small></div>
        </div>
        <div className="campaign-traffic-grid">
          {Object.entries(summerSalePerformance.traffic).map(([key, item]) => (
            <article key={key}>
              <div><strong>{key === 'live' ? 'LIVE' : key === 'video' ? 'Video' : 'Product Card'}</strong><span>{item.share.toFixed(2)}%</span></div>
              <div className="campaign-traffic-track"><span style={{ width: `${item.share}%` }} /></div>
              <small>CTR {item.ctr.toFixed(2)}% · CTOR {item.ctor.toFixed(2)}%</small>
            </article>
          ))}
        </div>
      </section>

      <section className="grid campaign-secondary-grid">
        <article className="card campaign-smart-card">
          <div className="chart-title"><div><span className="eyebrow">SMART PROMOTION</span><h2>스마트 프로모션</h2><small>{smartPromotionPerformance.start} ~ {smartPromotionPerformance.end}</small></div><span className="badge good">진행 중</span></div>
          <strong>{smartPromotionPerformance.gmvContribution.toFixed(2)}%</strong>
          <p>Shop GMV 중 스마트 프로모션 기여도</p>
          <div><span>프로모션 GMV <b>{currency(smartPromotionPerformance.promotionGmv)}</b></span><span>Shop GMV <b>{currency(smartPromotionPerformance.shopGmv)}</b></span></div>
          <small>신규 고객 {number(smartPromotionPerformance.newCustomers)}명 · 주문 {number(smartPromotionPerformance.orders)}건</small>
        </article>
        <article className="card campaign-action-card">
          <div className="chart-title"><div><span className="eyebrow">NEXT ACTION</span><h2>예정 캠페인 준비</h2><small>다음 캠페인 시작 전 확인할 항목</small></div></div>
          <ul>
            <li><strong>Back To School</strong><span>8월 20일 시작 · 상품/할인 등록 마감일 확인</span></li>
            <li><strong>September Stock Up</strong><span>재고 및 번들 구성 확정</span></li>
            <li><strong>BFCM</strong><span>11월 수요 대비 발주·크리에이터 콘텐츠 선제 확보</span></li>
            <li><strong>Holiday Deal</strong><span>12월 목표 검토값 확정 후 예산 연결</span></li>
          </ul>
        </article>
      </section>

      <section className="card campaign-table-card">
        <div className="chart-title"><div><h2>등록 캠페인 상태</h2><small>8/7 기준 일정 상태 · 8/8 Product campaign export는 데이터 행 0건</small></div><span className="badge warn">진행 {ongoing.length} · 종료 {registeredCampaigns.length - ongoing.length}</span></div>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>캠페인</th><th>현황</th><th>작전 날짜</th><th>캠페인 유형</th><th>등록 정보</th></tr></thead>
            <tbody>
              {registeredCampaigns.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td><span className={`badge ${item.status === 'ongoing' ? 'good' : ''}`}>{item.status === 'ongoing' ? '진행 중' : '종료'}</span></td>
                  <td>{item.start}{item.end ? ` ~ ${item.end}` : '부터'}</td>
                  <td>{item.type}</td>
                  <td>{item.registration}{item.approved !== null ? ` · 승인 ${item.approved}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card campaign-table-card">
        <div className="chart-title"><div><h2>Summer Sale 상품 성과</h2><small>작업 분석 화면에서 확인된 상위 상품</small></div><span className="badge warn">화면 캡처 기준</span></div>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>순위</th><th>상품</th><th>GMV</th><th>SKU 주문</th><th>판매 품목</th><th>재고</th></tr></thead>
            <tbody>
              {summerSaleProducts.map((item) => (
                <tr key={item.rank}><td><strong>{item.rank}</strong></td><td>{item.product}</td><td><strong>{currency(item.gmv)}</strong></td><td>{item.skuOrders}</td><td>{item.itemsSold}</td><td><span className={`badge ${item.stock < 30 ? 'warn' : 'good'}`}>{item.stock}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default CampaignsPage;
