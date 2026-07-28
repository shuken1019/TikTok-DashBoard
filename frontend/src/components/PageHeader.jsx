import { useLocation } from 'react-router-dom';

const PAGE_CONTEXT = {
  '/': ['actual', 'Campaign 공식 실적', 'Cost·Gross revenue·SKU 주문·ROI와 Q3/Q4 목표 계획'],
  '/revenue-ads': ['actual', '통합 실제 데이터', 'Shop Analytics GMV + Campaign overview 광고비'],
  '/profit-loss': ['actual', '실적 + 배부 비용', '실제 GMV·광고비에 비광고 비용을 매출 비중으로 배부'],
  '/forecast': ['plan', '계획 데이터', '3Q·4Q Forecast · 실제 실적과 구분'],
  '/performance-outlook': ['plan', '실적 + 계획 데이터', '입력 실적과 향후 목표 연결'],
  '/breakeven': ['plan', '시뮬레이션', '입력한 가격·비용 가정에 따라 결과 변동'],
  '/products': ['manual', '운영 마스터', '관리자 입력 상품별 매출·원가 snapshot'],
  '/product-leaderboard': ['manual', '운영 마스터', '판매·재고 입력값 기반 상품 우선순위'],
  '/inventory': ['manual', '운영 마스터', 'Seller Center 기준 수동 재고 snapshot'],
  '/live': ['actual', 'Creator LIVE 실제 데이터', '2026-04-01~07-26 export · 세션 5회 원본 기준'],
  '/campaigns': ['plan', '캠페인 일정 + 진행 실적', 'Seller Center 캘린더·등록 목록·Summer Sale 화면 기준'],
  '/ads': ['actual', '광고 실적 + 비용 Snapshot', 'Campaign 광고비 실적과 관리자 입력 비용구조'],
  '/admin': ['manual', '관리 데이터', '저장 즉시 연결된 대시보드 페이지에 반영'],
  '/guide': ['guide', '내부 운영 가이드', '실제 집행 전 최신 Seller Center 정책 확인'],
};

function PageHeader({ title, subtitle, children }) {
  const { pathname } = useLocation();
  const context = PAGE_CONTEXT[pathname];
  const todayLabel = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date());
  return (
    <>
      <div className="top-bar">
        <div className="brand">
          <div className="logo">TT</div>
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="top-date-summary">
          <span className="top-date-icon">▣</span>
          <div>
            <small>TODAY</small>
            <strong>{todayLabel}</strong>
            <em>오늘 기준으로 조회 기간을 설정합니다.</em>
          </div>
        </div>
        {children}
      </div>
      {context && (
        <div className={`page-context-bar ${context[0]}`}>
          <div><span className="context-dot" /><strong>{context[1]}</strong></div>
          <p>{context[2]}</p>
          <a href="/data-center">기준 확인 →</a>
        </div>
      )}
    </>
  );
}

export default PageHeader;
