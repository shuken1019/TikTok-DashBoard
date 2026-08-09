// Source: "틱톡샵 번들 최고 할인 마진.xlsx" supplied 2026-08-08.
// `본표` rows are individual-product assumptions. `번들 계산` rows are the
// workbook's dedicated bundle block and are not actual settlement results.
const defaultProductCosts = [
  {
    name: '7 Vegan Peptide Booster Serum', scope: '본표', retailPrice: 25.00, salePrice: 22.00, discount: 12.00,
    fobPrice: 7.25, productionCost: 3.04, distribution: 2.00, mcf: 8.00, tiktokFee: 0.15,
    affiliateFee: 5.00, affiliateProductCost: 14.12, totalCost: 19.12, netProfit: 2.88, margin: 13.09,
    price: 22.00, cost: 3.04, commission: 5.00, logistics: 2.00
  },
  {
    name: 'Collagen 100', scope: '본표', retailPrice: 21.00, salePrice: 18.48, discount: 12.00,
    fobPrice: 7.13, productionCost: 2.05, distribution: 1.68, mcf: 9.00, tiktokFee: 0.13,
    affiliateFee: 5.25, affiliateProductCost: 13.76, totalCost: 19.01, netProfit: -0.53, margin: -2.88,
    price: 18.48, cost: 2.05, commission: 5.25, logistics: 1.68
  },
  {
    name: 'Snail Gold Eye Gel Patch', scope: '본표', retailPrice: 22.00, salePrice: 22.00, discount: 0,
    fobPrice: 6.69, productionCost: 3.01, distribution: 1.76, mcf: 7.00, tiktokFee: 0.13,
    affiliateFee: 5.50, affiliateProductCost: 12.77, totalCost: 18.27, netProfit: 3.73, margin: 16.97,
    price: 22.00, cost: 3.01, commission: 5.50, logistics: 1.76
  },
  {
    name: 'Rice Water Toner', scope: '본표', retailPrice: 25.00, salePrice: 25.00, discount: 0,
    fobPrice: 6.25, productionCost: 2.84, distribution: 2.00, mcf: 7.00, tiktokFee: 0.15,
    affiliateFee: 6.25, affiliateProductCost: 12.82, totalCost: 19.07, netProfit: 5.93, margin: 23.72,
    price: 25.00, cost: 2.84, commission: 6.25, logistics: 2.00
  },
  {
    name: 'Rice Foam', scope: '본표', retailPrice: 20.00, salePrice: 20.00, discount: 0,
    fobPrice: 5.83, productionCost: 2.52, distribution: 1.60, mcf: 7.00, tiktokFee: 0.12,
    affiliateFee: 5.00, affiliateProductCost: 12.01, totalCost: 17.01, netProfit: 2.99, margin: 14.94,
    price: 20.00, cost: 2.52, commission: 5.00, logistics: 1.60
  },
  {
    name: 'Snail Repair Intensive BB Cream', scope: '본표', retailPrice: 15.80, salePrice: 15.80, discount: 0,
    fobPrice: 5.62, productionCost: 3.01, distribution: 1.26, mcf: 7.00, tiktokFee: 0.09,
    affiliateFee: 3.16, affiliateProductCost: 12.11, totalCost: 15.27, netProfit: 0.53, margin: 3.37,
    price: 15.80, cost: 3.01, commission: 3.16, logistics: 1.26
  },
  {
    name: 'Collagen Booster Set (Collagen 100 + 7 Vegan)', scope: '번들 계산', retailPrice: 46.00, salePrice: 39.10, discount: 15.00,
    fobPrice: 14.38, productionCost: 5.09, distribution: 3.68, mcf: 17.00, tiktokFee: 0.28,
    affiliateFee: 13.80, affiliateProductCost: 27.88, totalCost: 41.68, netProfit: -2.58, margin: -6.60,
    breakEvenPrice: 41.68, maxDiscount: 9.39, currentPromotionPrice: 25.19,
    price: 39.10, cost: 5.09, commission: 13.80, logistics: 3.68
  },
  {
    name: 'Rice Bundle Set (Rice Toner + Rice Foam)', scope: '번들 계산', retailPrice: 45.00, salePrice: 45.00, discount: 0,
    fobPrice: 12.08, productionCost: 5.36, distribution: 3.60, mcf: 14.00, tiktokFee: 0.27,
    affiliateFee: 13.50, affiliateProductCost: 24.83, totalCost: 38.33, netProfit: 6.67, margin: 14.82,
    breakEvenPrice: 38.33, maxDiscount: 14.82,
    price: 45.00, cost: 5.36, commission: 13.50, logistics: 3.60
  }
];
