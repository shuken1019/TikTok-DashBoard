// Source: TikTok Shop Campaign calendar / campaign management screenshots
// supplied on 2026-07-26. Platform campaign dates are subject to change.

// 2026-08-08 Product campaign export was header-only (0 data rows), so the
// calendar status is advanced by date while performance values remain at 7/26.
export const campaignDataAsOf = '2026-08-18';

// Promotion rows can overlap for one order. Display them individually and do
// not sum them into a shop or campaign total.
export const promotionSnapshot = {
  start: '2026-08-01',
  end: '2026-08-17',
  rowCount: 23,
  rows: [
    { name: 'Follower coupon 10%', gmv: 5526.00, orders: 470, roi: 5.25 },
    { name: 'Follower coupon add-on', gmv: 4231.89, orders: 757, roi: 1.12 },
    { name: 'Store Wide Free Shipping', gmv: 3961.35, orders: 201, roi: 3.94 },
  ],
};

export const platformCampaigns = [
  {
    id: 'summer-sale-2026',
    name: 'Summer Sale',
    fullName: '[Platform Campaign] Summer Sale',
    start: '2026-07-22',
    end: '2026-08-02',
    tier: 'MEGA',
    status: 'completed',
    description: '여름 시즌 인기 상품을 집중 노출하는 플랫폼 메가 세일입니다.',
  },
  {
    id: 'back-to-school-2026',
    name: 'Back To School',
    fullName: '[Platform Campaign] Back To School',
    start: '2026-08-20',
    end: '2026-08-30',
    tier: 'MEGA',
    status: 'upcoming',
    description: '개학 시즌 필수품과 준비 상품을 할인으로 연결하는 캠페인입니다.',
  },
  {
    id: 'september-stock-up-2026',
    name: 'September Stock Up',
    fullName: '[Platform Campaign] September Stock Up',
    start: '2026-09-16',
    end: '2026-09-27',
    tier: 'MEGA',
    status: 'upcoming',
    description: '생활 필수품을 미리 채우는 수요에 맞춘 9월 플랫폼 캠페인입니다.',
  },
  {
    id: 'fall-deals-2026',
    name: 'Fall Deals For You',
    fullName: '[Platform Campaign] Fall Deals For You',
    start: '2026-10-07',
    end: '2026-10-18',
    tier: 'MEGA',
    status: 'upcoming',
    description: '가을 쇼핑 시즌의 계절 상품과 일상 필수품을 집중 노출합니다.',
  },
  {
    id: 'bfcm-2026',
    name: 'Black Friday & Cyber Monday',
    fullName: '[Platform Campaign] Black Friday & Cyber Monday',
    start: '2026-11-10',
    end: '2026-11-30',
    tier: 'MEGA',
    status: 'upcoming',
    description: '연중 가장 큰 쇼핑 수요를 겨냥한 Black Friday 및 Cyber Monday 캠페인입니다.',
  },
  {
    id: 'holiday-eoy-2026',
    name: 'Holiday Deal / End Of Year',
    fullName: '[Platform Campaign] Holiday Deal/End Of Year',
    start: '2026-12-01',
    end: '2026-12-31',
    tier: 'MEGA',
    status: 'upcoming',
    description: '연말 선물과 고의도 쇼핑 수요를 잡기 위한 Holiday 및 End of Year 캠페인입니다.',
  },
];

export const registeredCampaigns = [
  {
    id: 'smart-promotion',
    name: '스마트 프로모션',
    type: 'Shop 캠페인',
    start: '2024-12-12 21:00',
    end: null,
    status: 'ongoing',
    registration: '승인',
    approved: null,
  },
  {
    id: 'summer-standard',
    name: '2026년 여름 세일 캠페인 - 표준 등록',
    type: '표준 등록',
    start: '2026-07-22 17:00',
    end: '2026-08-02 20:59',
    status: 'completed',
    registration: '등록 제품',
    approved: 39,
  },
  {
    id: 'seller-video-challenge',
    name: '판매자 단편 비디오 챌린지',
    type: '라이브 캠페인',
    start: '2026-07-22 17:00',
    end: '2026-08-02 20:58',
    status: 'completed',
    registration: '등록된 Tik',
    approved: 1,
  },
  {
    id: 'summer-pre-registration',
    name: '2026 여름 세일 캠페인 - 사전 등록',
    type: '프리미엄 오퍼 및 플래시 세일',
    start: '2026-07-22 17:00',
    end: '2026-08-02 20:59',
    status: 'completed',
    registration: '등록 제품',
    approved: 2,
  },
];

export const summerSalePerformance = {
  start: '2026-07-22',
  end: '2026-08-02',
  asOf: '2026-07-26',
  gmv: 1853.63,
  estimatedContribution: 2662.48,
  orders: 184,
  aov: 10.07,
  productImpressions: 231297,
  productClicks: 8722,
  averageUniqueReach: 29743,
  averageDailyCustomers: 36,
  creatorVideos: 241,
  creatorLives: 46,
  sellerVideos: 0,
  sellerLives: 0,
  traffic: {
    live: { share: 2.24, ctr: 1.47, ctor: 1.32 },
    video: { share: 81.42, ctr: 3.40, ctor: 2.44 },
    productCard: { share: 16.34, ctr: 5.90, ctor: 1.30 },
  },
};

export const smartPromotionPerformance = {
  start: '2026-07-01',
  end: '2026-07-24',
  gmvContribution: 39.55,
  newCustomers: 380,
  orders: 445,
  promotionGmv: 3663.81,
  shopGmv: 9262.88,
};

export const summerSaleProducts = [
  { rank: 1, product: 'Rice Milky Toner & Rice Glow Mask Cleanser Bundle', gmv: 732.06, skuOrders: 63, itemsSold: 63, stock: 24 },
  { rank: 2, product: 'MIZON 7 Vegan Peptide Booster Serum', gmv: 468.85, skuOrders: 46, itemsSold: 47, stock: 211 },
  { rank: 3, product: 'Snail Repair Intensive BB Cream SPF30', gmv: 334.70, skuOrders: 51, itemsSold: 56, stock: 401 },
  { rank: 4, product: 'MIZON Rice Water Milky Toner', gmv: 282.02, skuOrders: 24, itemsSold: 26, stock: 172 },
  { rank: 5, product: 'MIZON Rice Water Glow Mask Cleanser', gmv: 18.40, skuOrders: 1, itemsSold: 1, stock: 24 },
  { rank: 6, product: 'MIZON Under Eye Patches', gmv: 17.60, skuOrders: 1, itemsSold: 1, stock: 38 },
];
