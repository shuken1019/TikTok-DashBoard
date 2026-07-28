import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/guide', label: '틱톡샵 가이드', group: 'LEARN' },
  { to: '/', label: '전체 매출', end: true, group: 'PERFORMANCE' },
  { to: '/data-center', label: '데이터센터' },
  { to: '/products', label: '상품별매출', group: 'COMMERCE' },
  { to: '/product-leaderboard', label: '상품 리더보드' },
  { to: '/inventory', label: '재고관리' },
  { to: '/affiliate', label: '어필리에이터', group: 'GROWTH' },
  { to: '/live', label: '라이브' },
  { to: '/campaigns', label: '캠페인' },
  { to: '/ads', label: '광고관리' },
  { to: '/admin', label: 'Admin', group: 'SYSTEM' },
];

function Layout() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="layout">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <div className="logo">TT</div>
              <div>
                <strong>Admin 계정</strong>
                <p>관리자 전용 대시보드</p>
              </div>
            </div>
          </div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <div key={item.to} style={{ display: 'contents' }}>
                {item.group && <span className="nav-group-label">{item.group}</span>}
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => (isActive ? 'active' : undefined)}
                >
                  {item.label}
                </NavLink>
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <span className="sidebar-status-label"><i /> DATA STATUS</span>
            <strong>Shop 7/26 · Campaign 7/27 · Affiliate Core 7/25 · 상세 7/24</strong>
            <p>운영 가능 · 데이터센터 확인 필요 4건</p>
            <NavLink to="/data-center">데이터 상태 보기 →</NavLink>
          </div>
        </aside>

        <div className="main-content">
          <Outlet />
        </div>
      </div>
      <button
        type="button"
        className={`back-to-top${showBackToTop ? ' visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="맨 위로"
      >
        ↑
      </button>
    </section>
  );
}

export default Layout;
