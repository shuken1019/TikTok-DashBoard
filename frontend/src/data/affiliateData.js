// Source: Transaction Analysis exports supplied on 2026-08-08.
// July Core Metrics and Product List cover 2026-07-01–07-31. August Core Metrics
// covers 2026-08-01–08-05. August fields described as "Avg. daily" remain daily
// averages and must not be added to July period totals.
// Never add Core totals to detail totals: the detail lists are a breakdown.

export const affiliateSnapshot = {
  asOf: '2026-07-31',
  periodStart: '2026-07-01',
  detailAsOf: '2026-07-31',
  creatorAttributedGmv: 10395.51,
  totalShopGmv: 13797.74,
  attributedItemsSold: 1167,
  activeCollaborations: 646,
  observedCreatorPool: 6535,
  videos: 1087,
  sellingVideos: 167,
  liveStreams: 177,
  creatorsWithSales: 120,
  refunds: 520.44,
  commission: 3370.93,
  periodSamplesShipped: 1081,
  samplesShipped: 2099,
  sampleContent: 1332,
  sampleContentGmv: 15654,
  sampleRoi45d: 0.6434,
};

// Source: Transaction_Analysis_Creator_List_20260701-20260731.xlsx.
// The two files supplied on 2026-08-09 are byte-identical copies. Creator List
// is authoritative for creator-level ranking and detail sums; Core Metrics stays
// authoritative for the headline Performance cards because its definitions differ.
export const affiliateCreatorListSummary = {
  periodStart: '2026-07-01',
  asOf: '2026-07-31',
  listedCreators: 6747,
  creatorsPostedContent: 640,
  creatorsWithSales: 120,
  creatorAttributedGmv: 10395.51,
  videoGmv: 10044.92,
  liveGmv: 57.58,
  productCardGmv: 293.01,
  orders: 1145,
  itemsSold: 1167,
  videos: 1025,
  liveStreams: 178,
  refunds: 520.44,
  estimatedCommission: 3370.93,
  top3Share: 53.8567131387,
};

export const affiliateJulyCreators = [
  { rank: 1, creator: 'blankitaoro17', gmv: 2552.47, refunds: 194.87, orders: 273, items: 276, videos: 61, liveStreams: 0, impressions: 294416, commission: 864.62 },
  { rank: 2, creator: 'nathaliegaby1', gmv: 1755.53, refunds: 26.04, orders: 221, items: 225, videos: 22, liveStreams: 0, impressions: 87644, commission: 590.03 },
  { rank: 3, creator: 'marbelizolivieri', gmv: 1290.68, refunds: 58.47, orders: 131, items: 133, videos: 5, liveStreams: 0, impressions: 54751, commission: 441.57 },
  { rank: 4, creator: 'radiel141', gmv: 727.84, refunds: 14.69, orders: 59, items: 60, videos: 1, liveStreams: 2, impressions: 162109, commission: 106.77 },
  { rank: 5, creator: 'aguilarluzangel', gmv: 443.77, refunds: 15.00, orders: 49, items: 50, videos: 8, liveStreams: 0, impressions: 10538, commission: 152.71 },
  { rank: 6, creator: 'legendarylavv', gmv: 312.33, refunds: 0, orders: 46, items: 46, videos: 0, liveStreams: 0, impressions: 25234, commission: 101.72 },
  { rank: 7, creator: 'lynnlouisewonders', gmv: 255.29, refunds: 18.69, orders: 33, items: 33, videos: 2, liveStreams: 0, impressions: 10326, commission: 103.46 },
  { rank: 8, creator: 'anita_love310', gmv: 250.93, refunds: 10.00, orders: 26, items: 26, videos: 3, liveStreams: 0, impressions: 8154, commission: 106.65 },
  { rank: 9, creator: 'aeny323', gmv: 156.68, refunds: 6.81, orders: 14, items: 14, videos: 5, liveStreams: 1, impressions: 11991, commission: 56.53 },
  { rank: 10, creator: 'alexarod_official', gmv: 151.02, refunds: 6.18, orders: 13, items: 13, videos: 1, liveStreams: 0, impressions: 12431, commission: 41.60 },
];

export const affiliateCurrentPeriod = {
  label: '8/1–8/5 MTD',
  start: '2026-08-01',
  end: '2026-08-05',
  creatorAttributedGmv: 3302.03,
  attributedItemsSold: 273,
  refunds: 156.73,
  videos: 268,
  liveStreams: 66,
  creatorsInCollaborations: 1386,
  estimatedCommission: 940.85,
  avgDailyCreatorsPosted: 52,
  avgDailyCreatorsWithSales: 17,
  avgDailyVideosWithSales: 24,
};

export const affiliateJulyProducts = [
  { rank: 1, name: '7 Vegan Peptide Booster Serum', gmv: 5235.48, items: 648, orders: 638, refunds: 231.69, commission: 1856.30 },
  { rank: 2, name: 'Rice Water Milky Toner', gmv: 1365.43, items: 135, orders: 133, refunds: 77.31, commission: 424.81 },
  { rank: 3, name: 'Rice Milky Toner & Glow Mask Bundle', gmv: 1259.67, items: 97, orders: 97, refunds: 103.95, commission: 388.23 },
  { rank: 4, name: 'Collagen Booster Set', gmv: 851.30, items: 60, orders: 60, refunds: 28.93, commission: 268.35 },
  { rank: 5, name: 'Under Eye Patches', gmv: 737.82, items: 63, orders: 62, refunds: 14.69, commission: 111.44 },
  { rank: 6, name: 'Snail Repair Intensive BB Cream SPF30', gmv: 704.69, items: 146, orders: 137, refunds: 39.63, commission: 269.82 },
];

export const affiliateMonthly = [
  { month: '2026-02', start: '2026-02-01', end: '2026-02-28', videos: 36, activeCreators: 28, newCreators: 28, pool: 28, videoGmv: 64.71, shopGmv: 2088.21, sellingVideos: 3, impressions: 1018 },
  { month: '2026-03', start: '2026-03-01', end: '2026-03-31', videos: 57, activeCreators: 45, newCreators: 39, pool: 67, videoGmv: 489.55, shopGmv: 5975.89, sellingVideos: 4, impressions: 65676 },
  { month: '2026-04', start: '2026-04-01', end: '2026-04-30', videos: 89, activeCreators: 78, newCreators: 73, pool: 140, videoGmv: 112.04, shopGmv: 10463.52, sellingVideos: 4, impressions: 4050 },
  { month: '2026-05', start: '2026-05-01', end: '2026-05-31', videos: 69, activeCreators: 59, newCreators: 52, pool: 192, videoGmv: 0, shopGmv: 1972.69, sellingVideos: 0, impressions: 927 },
  { month: '2026-06', start: '2026-06-01', end: '2026-06-30', videos: 72, activeCreators: 39, newCreators: 23, pool: 215, videoGmv: 328.08, shopGmv: 2446.03, sellingVideos: 8, impressions: 14322 },
  { month: '2026-07', start: '2026-07-01', end: '2026-07-31', videos: 1025, activeCreators: 640, newCreators: null, pool: 6747, videoGmv: 10044.92, shopGmv: 13797.74, sellingVideos: 167, impressions: 1201442 },
];

export const affiliateWeekly = [
  { week: '05/18–05/24', start: '2026-05-18', end: '2026-05-24', videos: 23, creators: 21, videoGmv: 0, sellingVideos: 0, impressions: 63, orders: 0 },
  { week: '05/25–05/31', start: '2026-05-25', end: '2026-05-31', videos: 4, creators: 4, videoGmv: 0, sellingVideos: 0, impressions: 462, orders: 0 },
  { week: '06/01–06/07', start: '2026-06-01', end: '2026-06-07', videos: 12, creators: 9, videoGmv: 231.31, sellingVideos: 2, impressions: 12883, orders: 25 },
  { week: '06/08–06/14', start: '2026-06-08', end: '2026-06-14', videos: 16, creators: 13, videoGmv: 10, sellingVideos: 1, impressions: 179, orders: 0 },
  { week: '06/15–06/21', start: '2026-06-15', end: '2026-06-21', videos: 10, creators: 7, videoGmv: 34.95, sellingVideos: 2, impressions: 877, orders: 3 },
  { week: '06/22–06/28', start: '2026-06-22', end: '2026-06-28', videos: 25, creators: 18, videoGmv: 34, sellingVideos: 2, impressions: 227, orders: 2 },
  { week: '06/29–07/05', start: '2026-06-29', end: '2026-07-05', videos: 40, creators: 29, videoGmv: 57.5, sellingVideos: 4, impressions: 650, orders: 5 },
  { week: '07/06–07/12', start: '2026-07-06', end: '2026-07-12', videos: 43, creators: 25, videoGmv: 362.07, sellingVideos: 5, impressions: 32377, orders: 33 },
  { week: '07/13–07/19', start: '2026-07-13', end: '2026-07-19', videos: 262, creators: 179, videoGmv: 742, sellingVideos: 29, impressions: 53846, orders: 71 },
  { week: '07/20–07/23', start: '2026-07-20', end: '2026-07-23', videos: 245, creators: 186, videoGmv: 142.75, sellingVideos: 9, impressions: 27043, orders: 19, partial: true },
];

// Shop Analytics channel attribution. This is LIVE shop GMV, not a creator-level
// LIVE leaderboard; the source does not include host/session cost or commission.
export const affiliateLiveMonthly = [
  { month: '2026-04', liveGmv: 25.31, salesDays: 1 },
  { month: '2026-06', liveGmv: 19.98, salesDays: 1 },
  { month: '2026-07', liveGmv: 36.20, salesDays: 1, partial: true },
];

export const topAffiliateVideos = [
  {
    rank: 1,
    creator: '@nathaliegaby1',
    date: '2026-06-08',
    title: '7 Vegan Peptide · 문제 해결형 스페인어 콘텐츠',
    videoGmv: 1284.54,
    orders: 170,
    impressions: 61460,
    ctr: 6.07,
    diagnosis: '높은 노출과 6.07% CTR이 함께 작동해 170주문을 만들었습니다. 훅과 언어 타깃을 우선 복제할 영상입니다.',
  },
  {
    rank: 2,
    creator: '@radiel141',
    date: '2026-03-06',
    title: '다크서클·눈가 주름 문제 해결형 아이패치',
    videoGmv: 650.83,
    orders: 52,
    impressions: 160014,
    ctr: 0.48,
    diagnosis: 'CTR은 낮지만 문제 제기가 선명하고 대규모 노출이 52주문으로 연결됐습니다.',
  },
  {
    rank: 3,
    creator: '@blankitaoro17',
    date: '2026-07-21',
    title: 'Rice Milky Toner & Rice Glow Mask Cleanser 번들',
    videoGmv: 451.96,
    orders: 39,
    impressions: 38041,
    ctr: 2.26,
    diagnosis: '번들 사용 맥락이 39주문을 만들었습니다. 세트 구성과 함께 보여주는 포맷을 재활용할 가치가 있습니다.',
  },
  {
    rank: 4,
    creator: '@blankitaoro17',
    date: '2026-03-24',
    title: '7 Vegan Peptide Booster Serum 루틴',
    videoGmv: 421.20,
    orders: 76,
    impressions: 28701,
    ctr: 6.34,
    diagnosis: '상위권 최고 수준의 6.34% CTR과 76주문이 동시에 확인돼 재현 우선순위가 높습니다.',
  },
  {
    rank: 5,
    creator: '@blankitaoro17',
    date: '2026-07-12',
    title: 'Rice Water Milky Toner · 글래스 스킨 메시지',
    videoGmv: 341.53,
    orders: 30,
    impressions: 37300,
    ctr: 2.56,
    diagnosis: '제품 효능과 사용 장면이 30주문으로 이어졌습니다. 단일 효능 중심의 후속편을 테스트할 대상입니다.',
  },
];
