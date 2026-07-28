// 2026.08~12 어필리에이터 실행계획 (MIZON 5개 제품 기준, Village/PETINUBE 제외).
// revenueGoal·adBudget·estimated만 입력값입니다. 나머지(creatorRevenueGoal,
// activeCreatorsNeeded, funnelSamplesNeeded, productSamplePackages, expectedVideos,
// expectedCommission, sampleCost)는 deriveAffiliatePlanMonth()가 revenueGoal +
// defaultAffiliatePlanProducts로부터 매번 다시 계산합니다 — 원본 5개월 리포트 값과
// 소수점 6자리까지 일치하는 것으로 검증된 비율입니다. Admin에서 매출 목표를 바꾸면
// 이 값들도 자동으로 함께 바뀝니다.
const defaultAffiliatePlanMonths = [
  { month: '2026-08', revenueGoal: 27000, adBudget: 40000, estimated: false },
  { month: '2026-09', revenueGoal: 47000, adBudget: 48000, estimated: false },
  { month: '2026-10', revenueGoal: 67000, adBudget: 53333, estimated: false },
  { month: '2026-11', revenueGoal: 100000, adBudget: 60000, estimated: false },
  { month: '2026-12', revenueGoal: 150000, adBudget: 90000, estimated: true }
];

// 제품별 샘플 발송 계획 배분 (전체 매출목표 대비 비중, 판매가). productSamplePackages·
// sampleCost·expectedVideos 계산에도 쓰이므로 여기 share/unitPrice를 바꾸면 월별 계획도
// 함께 바뀝니다.
const defaultAffiliatePlanProducts = [
  { product: 'Hero Bundle', detail: '7 Vegan Peptide + Collagen 100', share: 0.45, unitPrice: 38.99, each: true },
  { product: 'Rice Bundle', detail: 'Rice Toner + Rice Foam', share: 0.35, unitPrice: 38.89, each: true },
  { product: 'BB Cream', detail: '단품 · 21/23/25/27/30호', share: 0.20, unitPrice: 14.99, each: false }
];

// 원본 MIZON 리포트 5개월 실적값을 역산해 검증한 고정 비율. 크리에이터 채널 85%,
// 수수료 25%, 콘텐츠 전환율 1332/2099(63.5%), 샘플 수요배수 1.714x, 샘플 COGS 30%는
// 페이지 각주에 이미 명시된 가정값이고, active/funnel 비율은 원본 5개월 데이터에서
// revenueGoal 대비 상수 비율로 역산했습니다.
const AFFILIATE_PLAN_RATIOS = {
  creatorRevenueShare: 0.85,
  commissionRate: 0.25,
  contentConversion: 1332 / 2099,
  sampleMultiplier: 1.714,
  sampleCogsRate: 0.30,
  activeCreatorsPerRevenueDollar: 0.0109847506,
  funnelSamplesPerRevenueDollar: 0.051571599
};

function deriveAffiliatePlanMonth(input, products) {
  const revenueGoal = Number(input.revenueGoal) || 0;
  const creatorRevenueGoal = revenueGoal * AFFILIATE_PLAN_RATIOS.creatorRevenueShare;
  const expectedCommission = creatorRevenueGoal * AFFILIATE_PLAN_RATIOS.commissionRate;
  const activeCreatorsNeeded = revenueGoal * AFFILIATE_PLAN_RATIOS.activeCreatorsPerRevenueDollar;
  const funnelSamplesNeeded = revenueGoal * AFFILIATE_PLAN_RATIOS.funnelSamplesPerRevenueDollar;
  const productSamplePackages = products.reduce((sum, p) => {
    const unitPrice = Number(p.unitPrice) || 1;
    return sum + (revenueGoal * (Number(p.share) || 0) / unitPrice) * AFFILIATE_PLAN_RATIOS.sampleMultiplier;
  }, 0);
  const expectedVideos = productSamplePackages * AFFILIATE_PLAN_RATIOS.contentConversion;
  const sampleCost = products.reduce((sum, p) => {
    const unitPrice = Number(p.unitPrice) || 1;
    const samples = (revenueGoal * (Number(p.share) || 0) / unitPrice) * AFFILIATE_PLAN_RATIOS.sampleMultiplier;
    return sum + samples * unitPrice * AFFILIATE_PLAN_RATIOS.sampleCogsRate;
  }, 0);

  return {
    month: input.month,
    revenueGoal,
    adBudget: Number(input.adBudget) || 0,
    estimated: !!input.estimated,
    creatorRevenueGoal,
    activeCreatorsNeeded,
    funnelSamplesNeeded,
    productSamplePackages,
    expectedVideos,
    expectedCommission,
    sampleCost
  };
}
