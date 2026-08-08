function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function monthSortValue(str) {
  const digits = String(str == null ? '' : str).replace(/\D/g, '');
  if (!digits) return Infinity;
  return Number(digits);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('hidden');
  sidebar.closest('.app-shell')?.classList.toggle('sidebar-collapsed', sidebar.classList.contains('hidden'));
}

function removeSidebarToggles() {
  document.querySelectorAll('.sidebar-toggle, .menu-button').forEach(button => button.remove());
  document.getElementById('sidebar')?.classList.remove('hidden');
  document.querySelector('.app-shell')?.classList.remove('sidebar-collapsed');
}

function addTodaySummary() {
  const topBar = document.querySelector('.main-content > .top-bar');
  if (!topBar || topBar.querySelector('.top-date-summary')) return;
  const today = new Date();
  const dateText = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(today);
  const summary = document.createElement('div');
  summary.className = 'top-date-summary';
  summary.innerHTML = `
    <span class="top-date-icon">▣</span>
    <div><small>TODAY</small><strong>${dateText}</strong><em>오늘 기준으로 조회 기간을 설정합니다.</em></div>
  `;
  const brand = topBar.querySelector('.brand');
  if (brand) brand.insertAdjacentElement('afterend', summary);
  else topBar.appendChild(summary);
}

function highlightSidebarCategory(navId) {
  clearSidebarHighlight();
  const link = document.getElementById(navId);
  if (link) link.classList.add('highlight');
}

function clearSidebarHighlight() {
  document.querySelectorAll('.sidebar-nav a').forEach(link => link.classList.remove('highlight'));
}

const PAGE_NAV_MAP = {
  'revenue-ads-detail.html': 'nav-total',
  'profit-loss-detail.html': 'nav-total',
  'forecast-detail.html': 'nav-total',
  'performance-outlook-detail.html': 'nav-total',
  'breakeven-detail.html': 'nav-total'
};

const PAGE_CONTEXT = {
  'tiktok_shop_dashboard.html': { tone: 'actual', label: 'Campaign 공식 실적', detail: 'Cost·Gross revenue·SKU 주문·ROI와 Q3/Q4 목표 계획' },
  'revenue-ads-detail.html': { tone: 'actual', label: '통합 실제 데이터', detail: 'Shop Analytics GMV + Campaign overview 광고비' },
  'profit-loss-detail.html': { tone: 'actual', label: '실적 + 배부 비용', detail: '실제 GMV·광고비에 비광고 비용을 매출 비중으로 배부' },
  'forecast-detail.html': { tone: 'plan', label: '계획 데이터', detail: '3Q·4Q Forecast · 실제 실적과 구분' },
  'performance-outlook-detail.html': { tone: 'plan', label: '실적 + 계획 데이터', detail: 'Total Revenue 기준 · 8/7까지 매출 · 8월 비용 미수집 · 2027.12까지 목표 연결' },
  'breakeven-detail.html': { tone: 'plan', label: '시뮬레이션', detail: '입력한 가격·비용 가정에 따라 결과 변동' },
  'products.html': { tone: 'manual', label: '운영 마스터', detail: '관리자 입력 상품별 매출·원가 snapshot' },
  'product-leaderboard.html': { tone: 'manual', label: '운영 마스터', detail: '판매·재고 입력값 기반 상품 우선순위' },
  'inventory.html': { tone: 'manual', label: '운영 마스터', detail: 'Seller Center 기준 수동 재고 snapshot' },
  'ads.html': { tone: 'actual', label: '광고 실적 + 비용 Snapshot', detail: 'Campaign 광고비 실적과 관리자 입력 비용구조' },
  'live.html': { tone: 'actual', label: 'Creator LIVE 실제 데이터', detail: '2026-04-01~07-26 export · 세션 5회 원본 기준' },
  'campaigns.html': { tone: 'plan', label: '캠페인 일정 + 진행 실적', detail: 'Seller Center 캘린더·등록 목록·Summer Sale 화면 기준' },
  'admin.html': { tone: 'manual', label: '로컬 관리 데이터', detail: '이 브라우저에 저장되며 다른 기기와 자동 동기화되지 않음' },
  'guide.html': { tone: 'guide', label: '내부 운영 가이드', detail: '정책 변경 가능 · 실제 집행 전 최신 Seller Center 확인' }
};

function markActiveNavLink() {
  const currentPage = location.pathname.split('/').pop() || 'tiktok_shop_dashboard.html';
  const mappedNavId = PAGE_NAV_MAP[currentPage];
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.remove('active');
    if (href === currentPage || (mappedNavId && link.id === mappedNavId)) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function improveSidebar() {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav || nav.querySelector('.nav-group-label')) return;

  const affiliateLink = document.getElementById('nav-affiliate');
  if (affiliateLink && !document.getElementById('nav-live')) {
    const liveLink = document.createElement('a');
    liveLink.href = 'live.html';
    liveLink.id = 'nav-live';
    liveLink.textContent = '라이브';
    affiliateLink.insertAdjacentElement('afterend', liveLink);
  }
  const liveLink = document.getElementById('nav-live');
  if (liveLink && !document.getElementById('nav-campaigns')) {
    const campaignLink = document.createElement('a');
    campaignLink.href = 'campaigns.html';
    campaignLink.id = 'nav-campaigns';
    campaignLink.textContent = '캠페인';
    liveLink.insertAdjacentElement('afterend', campaignLink);
  }

  const groups = [
    ['nav-guide', 'LEARN'],
    ['nav-total', 'PERFORMANCE'],
    ['nav-product', 'COMMERCE'],
    ['nav-affiliate', 'GROWTH'],
    ['nav-admin', 'SYSTEM']
  ];
  groups.forEach(([id, label]) => {
    const target = document.getElementById(id);
    if (!target) return;
    const groupLabel = document.createElement('span');
    groupLabel.className = 'nav-group-label';
    groupLabel.textContent = label;
    nav.insertBefore(groupLabel, target);
  });

  if (affiliateLink) affiliateLink.textContent = '어필리에이터';

  const footer = document.querySelector('.sidebar-footer');
  if (footer) {
    footer.innerHTML = `
      <span class="sidebar-status-label"><i></i> DATA STATUS</span>
      <strong>Shop 7/26 · Campaign 7/27 · Affiliate Core 7/25 · 상세 7/24</strong>
      <p>운영 가능 · 데이터센터 확인 필요 4건</p>
      <a href="data-center.html">데이터 상태 보기 →</a>
    `;
  }
}

function addPageContext() {
  const currentPage = location.pathname.split('/').pop() || 'tiktok_shop_dashboard.html';
  if (['data-center.html', 'affiliate.html'].includes(currentPage)) return;
  const context = PAGE_CONTEXT[currentPage];
  const topBar = document.querySelector('.main-content > .top-bar');
  if (!context || !topBar || document.querySelector('.page-context-bar')) return;

  const bar = document.createElement('div');
  bar.className = `page-context-bar ${context.tone}`;
  bar.innerHTML = `
    <div><span class="context-dot"></span><strong>${context.label}</strong></div>
    <p>${context.detail}</p>
    <a href="data-center.html">기준 확인 →</a>
  `;
  topBar.insertAdjacentElement('afterend', bar);
}

function makeTablesResponsive() {
  document.querySelectorAll('table.table').forEach(table => {
    if (table.parentElement?.classList.contains('table-scroll')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

function addBackToTop() {
  if (document.getElementById('backToTop')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'backToTop';
  button.className = 'back-to-top';
  button.setAttribute('aria-label', '맨 위로');
  button.textContent = '↑';
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', () => button.classList.toggle('visible', window.scrollY > 500), { passive: true });
  document.body.appendChild(button);
}

function bindCardLinks() {
  document.querySelectorAll('.card.linked').forEach(card => {
    const navId = card.getAttribute('data-nav');
    const href = card.getAttribute('data-href');
    if (navId) {
      card.addEventListener('mouseenter', () => highlightSidebarCategory(navId));
      card.addEventListener('mouseleave', clearSidebarHighlight);
    }
    if (href) {
      card.addEventListener('click', () => { location.href = card.getAttribute('data-href'); });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  removeSidebarToggles();
  improveSidebar();
  markActiveNavLink();
  addTodaySummary();
  addPageContext();
  makeTablesResponsive();
  addBackToTop();
  bindCardLinks();
});
