// Source: user-provided MIZON margin table screenshot (received 2026-07-26).
// `본표` rows use the current table. `별도 계산` rows use the explicitly labelled
// scenario section at the bottom of the source and are never mixed with the current rows.
const defaultProductCosts = [
  {
    name: '7 Vegan Peptide Booster Serum', scope: '본표', retailPrice: 25.00, salePrice: 20.00,
    fobPrice: 7.25, productionCost: 3.04, distribution: 2.00, mcf: 8.00, tiktokFee: 0.15,
    affiliateFee: 5.00, affiliateProductCost: 14.12, totalCost: 19.12, netProfit: 0.88, margin: 4.40,
    price: 20.00, cost: 3.04, commission: 5.00, logistics: 2.00
  },
  {
    name: 'Collagen 100', scope: '본표', retailPrice: 21.00, salePrice: 18.48,
    fobPrice: 7.13, productionCost: 2.05, distribution: 1.68, mcf: 9.00, tiktokFee: 0.13,
    affiliateFee: 5.25, affiliateProductCost: 13.76, totalCost: 19.01, netProfit: -0.53, margin: -2.88,
    price: 18.48, cost: 2.05, commission: 5.25, logistics: 1.68
  },
  {
    name: 'Snail Gold Eye Gel Patch', scope: '본표', retailPrice: 22.00, salePrice: 19.99,
    fobPrice: 6.69, productionCost: 3.01, distribution: 1.76, mcf: 7.00, tiktokFee: 0.13,
    affiliateFee: 5.50, affiliateProductCost: 12.77, totalCost: 18.27, netProfit: 1.72, margin: 8.62,
    price: 19.99, cost: 3.01, commission: 5.50, logistics: 1.76
  },
  {
    name: 'Rice Water Toner', scope: '별도 계산', retailPrice: 25.00, salePrice: 23.75,
    fobPrice: 6.25, productionCost: 2.84, distribution: 2.00, mcf: 7.00, tiktokFee: 0.15,
    affiliateFee: 7.50, affiliateProductCost: 12.82, totalCost: 20.32, netProfit: 3.43, margin: 14.44,
    price: 23.75, cost: 2.84, commission: 7.50, logistics: 2.00
  },
  {
    name: 'Rice Foam', scope: '별도 계산', retailPrice: 20.00, salePrice: 17.99,
    fobPrice: 5.83, productionCost: 2.52, distribution: 1.60, mcf: 7.00, tiktokFee: 0.12,
    affiliateFee: 6.00, affiliateProductCost: 12.01, totalCost: 18.01, netProfit: -0.02, margin: -0.13,
    price: 17.99, cost: 2.52, commission: 6.00, logistics: 1.60
  },
  {
    name: 'Snail Repair Intensive BB Cream', scope: '별도 계산', retailPrice: 15.80, salePrice: 14.99,
    fobPrice: 5.62, productionCost: 3.01, distribution: 1.26, mcf: 7.00, tiktokFee: 0.09,
    affiliateFee: 3.16, affiliateProductCost: 12.11, totalCost: 15.27, netProfit: -0.28, margin: -1.86,
    price: 14.99, cost: 3.01, commission: 3.16, logistics: 1.26
  },
  {
    name: 'Collagen Booster Set (Collagen 100 + 7 Vegan)', scope: '별도 계산', retailPrice: 46.00, salePrice: 38.99,
    fobPrice: 14.38, productionCost: 5.09, distribution: 3.68, mcf: 17.00, tiktokFee: 0.28,
    affiliateFee: 13.80, affiliateProductCost: 27.88, totalCost: 41.68, netProfit: -2.69, margin: -6.90,
    price: 38.99, cost: 5.09, commission: 13.80, logistics: 3.68
  },
  {
    name: 'Rice Bundle Set (Rice Toner + Rice Foam)', scope: '별도 계산', retailPrice: 45.00, salePrice: 38.89,
    fobPrice: 12.08, productionCost: 5.36, distribution: 3.60, mcf: 14.00, tiktokFee: 0.27,
    affiliateFee: 13.50, affiliateProductCost: 24.83, totalCost: 38.33, netProfit: 0.56, margin: 1.43,
    price: 38.89, cost: 5.36, commission: 13.50, logistics: 3.60
  }
];
