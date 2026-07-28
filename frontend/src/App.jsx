import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './styles.css';
import Layout from './components/Layout';
import GuidePage from './pages/GuidePage';
import DataCenterPage from './pages/DataCenterPage';
import TotalRevenuePage from './pages/TotalRevenuePage';
import RevenueAdsDetailPage from './pages/RevenueAdsDetailPage';
import ProfitLossDetailPage from './pages/ProfitLossDetailPage';
import ForecastDetailPage from './pages/ForecastDetailPage';
import PerformanceOutlookDetailPage from './pages/PerformanceOutlookDetailPage';
import BreakevenDetailPage from './pages/BreakevenDetailPage';
import ProductsPage from './pages/ProductsPage';
import ProductLeaderboardPage from './pages/ProductLeaderboardPage';
import InventoryPage from './pages/InventoryPage';
import AffiliatePage from './pages/AffiliatePage';
import LivePage from './pages/LivePage';
import CampaignsPage from './pages/CampaignsPage';
import AdsPage from './pages/AdsPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TotalRevenuePage />} />
          <Route path="/revenue-ads" element={<RevenueAdsDetailPage />} />
          <Route path="/profit-loss" element={<ProfitLossDetailPage />} />
          <Route path="/forecast" element={<ForecastDetailPage />} />
          <Route path="/performance-outlook" element={<PerformanceOutlookDetailPage />} />
          <Route path="/breakeven" element={<BreakevenDetailPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/data-center" element={<DataCenterPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product-leaderboard" element={<ProductLeaderboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/affiliate" element={<AffiliatePage />} />
          <Route path="/affiliate/sample-plan" element={<AffiliatePage mode="samples" />} />
          <Route path="/affiliate/creators" element={<AffiliatePage mode="creators" />} />
          <Route path="/affiliate/content" element={<AffiliatePage mode="content" />} />
          <Route path="/affiliate/finance" element={<AffiliatePage mode="finance" />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/ads" element={<AdsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
