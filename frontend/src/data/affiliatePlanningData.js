// Source: TikTok_Shop_예산_ROI_플랜_2026-08_2027-12.xlsx.
// Bundle revenue and sample cost are counted once at the bundle/group level.

export const affiliatePlanningAssumptions = {
  creatorRevenueShare: 0.85,
  revenuePerActiveCreator: 77.38,
  sampleToActiveRate: 0.213,
  sampleToContentRate: 1332 / 2099,
  commissionRate: 0.25,
  sampleCogsRate: 0.30,
  currentSamplesSent: 2099,
};

const budgetPlan = [
  ['2026-08', 20000, 33333], ['2026-09', 25000, 40000], ['2026-10', 30000, 40000],
  ['2026-11', 50000, 58800], ['2026-12', 50000, 47600], ['2027-01', 55000, 47800],
  ['2027-02', 60000, 48000], ['2027-03', 70000, 51850], ['2027-04', 90000, 60000],
  ['2027-05', 100000, 62500], ['2027-06', 115000, 67650], ['2027-07', 125000, 69450],
  ['2027-08', 150000, 78950], ['2027-09', 160000, 80000], ['2027-10', 175000, 83350],
  ['2027-11', 190000, 86350], ['2027-12', 200000, 86950],
];

const sampleMultiplier = 1.714;
const productMix = [
  { share: 0.45, unitPrice: 38.99 },
  { share: 0.35, unitPrice: 38.89 },
  { share: 0.20, unitPrice: 14.99 },
];

export const affiliateMonthlyPlan = budgetPlan.map(([month, revenueGoal, adBudget]) => {
  const creatorRevenueGoal = revenueGoal * affiliatePlanningAssumptions.creatorRevenueShare;
  const productSamplePackages = productMix.reduce(
    (sum, item) => sum + (revenueGoal * item.share / item.unitPrice) * sampleMultiplier,
    0,
  );
  return {
    month, revenueGoal, adBudget, creatorRevenueGoal,
    activeCreatorsNeeded: revenueGoal * 0.0109847506,
    funnelSamplesNeeded: revenueGoal * 0.051571599,
    productSamplePackages,
    expectedVideos: productSamplePackages * affiliatePlanningAssumptions.sampleToContentRate,
    expectedCommission: creatorRevenueGoal * affiliatePlanningAssumptions.commissionRate,
    sampleCost: revenueGoal * sampleMultiplier * affiliatePlanningAssumptions.sampleCogsRate,
  };
});

export const affiliateProductSamplePlan = [
  {
    product: 'Hero Bundle',
    detail: '7 Vegan Peptide + Collagen 100',
    unitPrice: 38.99,
    revenueGoal: 175950,
    share: 0.45,
    samplePackages: 7735,
    expectedVideos: 4908,
    finalOrderUnits: '각 9,668개',
    sampleCost: 90473.49,
  },
  {
    product: 'Rice Bundle',
    detail: 'Rice Toner + Rice Foam',
    unitPrice: 38.89,
    revenueGoal: 136850,
    share: 0.35,
    samplePackages: 6031,
    expectedVideos: 3827,
    finalOrderUnits: '각 7,539개',
    sampleCost: 70368.27,
  },
  {
    product: 'BB Cream',
    detail: '단품 · 21/23/25/27/30호',
    unitPrice: 14.99,
    revenueGoal: 78200,
    share: 0.20,
    samplePackages: 8942,
    expectedVideos: 5674,
    finalOrderUnits: '11,177개',
    sampleCost: 40210.44,
  },
];

export const affiliatePlanTotals = affiliateMonthlyPlan.reduce((totals, item) => {
  totals.revenueGoal += item.revenueGoal;
  totals.creatorRevenueGoal += item.creatorRevenueGoal;
  totals.activeCreatorMonths += item.activeCreatorsNeeded;
  totals.funnelSamplesNeeded += item.funnelSamplesNeeded;
  totals.productSamplePackages += item.productSamplePackages;
  totals.expectedVideos += item.expectedVideos;
  totals.expectedCommission += item.expectedCommission;
  totals.sampleCost += item.sampleCost;
  return totals;
}, {
  revenueGoal: 0, creatorRevenueGoal: 0, activeCreatorMonths: 0,
  funnelSamplesNeeded: 0, productSamplePackages: 0, expectedVideos: 0,
  expectedCommission: 0, sampleCost: 0,
  commissionUpperBound: 1665000 * affiliatePlanningAssumptions.commissionRate,
  finalOrderUnits: 0,
});
affiliatePlanTotals.finalOrderUnits = affiliatePlanTotals.productSamplePackages * 1.25;
