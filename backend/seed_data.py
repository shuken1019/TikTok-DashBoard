"""Default/seed values for the persisted dashboard data resources.

Ported 1:1 from the static HTML prototype's assets/*.js default data files
so the React app starts from the same numbers.
"""

# Revenue is the real monthly GMV from Shop Analytics_Key metrics_20260724.pdf (see
# frontend/src/data/shopAnalytics.js). adSpend is the REAL daily ad cost from
# "Campaign overview data 20250725 - 20260725.pdf", with July replaced by
# "Campaign overview data 20260701 - 20260727.xlsx", cross-validated at cent precision.
# The dashboard period (Nov-Jul) contains $100,016.88 of the $100,480.97 combined
# full-period cost; Sep-Oct account for the difference. totalCost =
# adSpend + non-ad costs (product/seeding/commission/logistics/other from DEFAULT_COST_ITEMS,
# $13,559 total), prorated across months by the latest daily GMV share. Every month is a real, deep loss --
# ad spend alone has exceeded revenue every month since Feb. Edit in Admin as actuals change.
DEFAULT_MONTHLY = [
    {"month": "11월", "revenue": 197.15, "adSpend": 1745.70, "totalCost": 1816.11},
    {"month": "12월", "revenue": 390.1, "adSpend": 1547.71, "totalCost": 1687.02},
    {"month": "1월", "revenue": 845.38, "adSpend": 2991.97, "totalCost": 3293.88},
    {"month": "2월", "revenue": 2088.21, "adSpend": 8017.64, "totalCost": 8763.39},
    {"month": "3월", "revenue": 5975.89, "adSpend": 18839.92, "totalCost": 20974.06},
    {"month": "4월", "revenue": 10463.52, "adSpend": 19333.64, "totalCost": 23070.43},
    {"month": "5월", "revenue": 1972.69, "adSpend": 6637.13, "totalCost": 7341.63},
    {"month": "6월", "revenue": 2446.03, "adSpend": 6739.15, "totalCost": 7612.69},
    {"month": "7월", "revenue": 9861.16, "adSpend": 34164.02, "totalCost": 39016.67},
]

# MIZON analysis report target plan. Q3 revenue/ad budget: $141,000/$141,333.
# Q4 revenue/ad budget: $250,000/$150,000. Profit is a provisional model using the
# current configured non-ad cost ratio (39.60%). December's $150,000/$90,000 is a
# review estimate replacing an anomalous source value and must be reconfirmed.
DEFAULT_FORECAST = {
    "q3": {"revenue": 141000, "adSpend": 141333, "profit": -56169},
    "q4": {"revenue": 250000, "adSpend": 150000, "profit": 1001},
}

# Current non-ad cost pool ($13,559) using the dashboard's configured cost mix.
# Edit in Admin when actual product/seeding/commission/logistics costs are finalized.
DEFAULT_COST_ITEMS = [
    {"label": "제품 원가", "value": 5464},
    {"label": "시딩비용", "value": 2186},
    {"label": "예상 수수료", "value": 2698},
    {"label": "물류비", "value": 1913},
    {"label": "기타 비용", "value": 1298},
]

DEFAULT_PRODUCT_SALES = [
    {"date": "2026-06-09", "product": "7 Vegan Peptide Booster Serum", "sales": 9200},
    {"date": "2026-06-10", "product": "7 Vegan Peptide Booster Serum", "sales": 10800},
    {"date": "2026-06-11", "product": "7 Vegan Peptide Booster Serum", "sales": 11700},
    {"date": "2026-06-12", "product": "7 Vegan Peptide Booster Serum", "sales": 12400},
    {"date": "2026-06-13", "product": "7 Vegan Peptide Booster Serum", "sales": 13800},
    {"date": "2026-06-14", "product": "7 Vegan Peptide Booster Serum", "sales": 15100},
    {"date": "2026-06-15", "product": "7 Vegan Peptide Booster Serum", "sales": 16900},
    {"date": "2026-06-09", "product": "Collagen 100", "sales": 8200},
    {"date": "2026-06-10", "product": "Collagen 100", "sales": 9000},
    {"date": "2026-06-11", "product": "Collagen 100", "sales": 9600},
    {"date": "2026-06-12", "product": "Collagen 100", "sales": 10100},
    {"date": "2026-06-13", "product": "Collagen 100", "sales": 10700},
    {"date": "2026-06-14", "product": "Collagen 100", "sales": 11500},
    {"date": "2026-06-15", "product": "Collagen 100", "sales": 12300},
    {"date": "2026-06-09", "product": "Rice Water Toner", "sales": 7600},
    {"date": "2026-06-10", "product": "Rice Water Toner", "sales": 8200},
    {"date": "2026-06-11", "product": "Rice Water Toner", "sales": 8600},
    {"date": "2026-06-12", "product": "Rice Water Toner", "sales": 9000},
    {"date": "2026-06-13", "product": "Rice Water Toner", "sales": 9400},
    {"date": "2026-06-14", "product": "Rice Water Toner", "sales": 9800},
    {"date": "2026-06-15", "product": "Rice Water Toner", "sales": 10300},
    {"date": "2026-06-09", "product": "Rice Water Cleanser", "sales": 5400},
    {"date": "2026-06-10", "product": "Rice Water Cleanser", "sales": 5800},
    {"date": "2026-06-11", "product": "Rice Water Cleanser", "sales": 6100},
    {"date": "2026-06-12", "product": "Rice Water Cleanser", "sales": 6500},
    {"date": "2026-06-13", "product": "Rice Water Cleanser", "sales": 6800},
    {"date": "2026-06-14", "product": "Rice Water Cleanser", "sales": 7100},
    {"date": "2026-06-15", "product": "Rice Water Cleanser", "sales": 7500},
    {"date": "2026-06-09", "product": "Snail BB Cream", "sales": 4700},
    {"date": "2026-06-10", "product": "Snail BB Cream", "sales": 5100},
    {"date": "2026-06-11", "product": "Snail BB Cream", "sales": 5300},
    {"date": "2026-06-12", "product": "Snail BB Cream", "sales": 5600},
    {"date": "2026-06-13", "product": "Snail BB Cream", "sales": 5900},
    {"date": "2026-06-14", "product": "Snail BB Cream", "sales": 6200},
    {"date": "2026-06-15", "product": "Snail BB Cream", "sales": 6500},
    {"date": "2026-06-09", "product": "Snail Gold Eye Gel Patch", "sales": 3100},
    {"date": "2026-06-10", "product": "Snail Gold Eye Gel Patch", "sales": 3350},
    {"date": "2026-06-11", "product": "Snail Gold Eye Gel Patch", "sales": 3450},
    {"date": "2026-06-12", "product": "Snail Gold Eye Gel Patch", "sales": 3600},
    {"date": "2026-06-13", "product": "Snail Gold Eye Gel Patch", "sales": 3800},
    {"date": "2026-06-14", "product": "Snail Gold Eye Gel Patch", "sales": 3950},
    {"date": "2026-06-15", "product": "Snail Gold Eye Gel Patch", "sales": 4150},
    {"date": "2026-06-09", "product": "Inners Bit 3300", "sales": 2100},
    {"date": "2026-06-10", "product": "Inners Bit 3300", "sales": 2250},
    {"date": "2026-06-11", "product": "Inners Bit 3300", "sales": 2380},
    {"date": "2026-06-12", "product": "Inners Bit 3300", "sales": 2520},
    {"date": "2026-06-13", "product": "Inners Bit 3300", "sales": 2680},
    {"date": "2026-06-14", "product": "Inners Bit 3300", "sales": 2840},
    {"date": "2026-06-15", "product": "Inners Bit 3300", "sales": 3000},
]

DEFAULT_PRODUCT_COSTS = [
    {"name": "7 Vegan Peptide Booster Serum", "scope": "본표", "retailPrice": 25.00, "salePrice": 20.00, "fobPrice": 7.25, "productionCost": 3.04, "distribution": 2.00, "mcf": 8.00, "tiktokFee": 0.15, "affiliateFee": 5.00, "affiliateProductCost": 14.12, "totalCost": 19.12, "netProfit": 0.88, "margin": 4.40, "price": 20.00, "cost": 3.04, "commission": 5.00, "logistics": 2.00},
    {"name": "Collagen 100", "scope": "본표", "retailPrice": 21.00, "salePrice": 18.48, "fobPrice": 7.13, "productionCost": 2.05, "distribution": 1.68, "mcf": 9.00, "tiktokFee": 0.13, "affiliateFee": 5.25, "affiliateProductCost": 13.76, "totalCost": 19.01, "netProfit": -0.53, "margin": -2.88, "price": 18.48, "cost": 2.05, "commission": 5.25, "logistics": 1.68},
    {"name": "Snail Gold Eye Gel Patch", "scope": "본표", "retailPrice": 22.00, "salePrice": 19.99, "fobPrice": 6.69, "productionCost": 3.01, "distribution": 1.76, "mcf": 7.00, "tiktokFee": 0.13, "affiliateFee": 5.50, "affiliateProductCost": 12.77, "totalCost": 18.27, "netProfit": 1.72, "margin": 8.62, "price": 19.99, "cost": 3.01, "commission": 5.50, "logistics": 1.76},
    {"name": "Rice Water Toner", "scope": "별도 계산", "retailPrice": 25.00, "salePrice": 23.75, "fobPrice": 6.25, "productionCost": 2.84, "distribution": 2.00, "mcf": 7.00, "tiktokFee": 0.15, "affiliateFee": 7.50, "affiliateProductCost": 12.82, "totalCost": 20.32, "netProfit": 3.43, "margin": 14.44, "price": 23.75, "cost": 2.84, "commission": 7.50, "logistics": 2.00},
    {"name": "Rice Foam", "scope": "별도 계산", "retailPrice": 20.00, "salePrice": 17.99, "fobPrice": 5.83, "productionCost": 2.52, "distribution": 1.60, "mcf": 7.00, "tiktokFee": 0.12, "affiliateFee": 6.00, "affiliateProductCost": 12.01, "totalCost": 18.01, "netProfit": -0.02, "margin": -0.13, "price": 17.99, "cost": 2.52, "commission": 6.00, "logistics": 1.60},
    {"name": "Snail Repair Intensive BB Cream", "scope": "별도 계산", "retailPrice": 15.80, "salePrice": 14.99, "fobPrice": 5.62, "productionCost": 3.01, "distribution": 1.26, "mcf": 7.00, "tiktokFee": 0.09, "affiliateFee": 3.16, "affiliateProductCost": 12.11, "totalCost": 15.27, "netProfit": -0.28, "margin": -1.86, "price": 14.99, "cost": 3.01, "commission": 3.16, "logistics": 1.26},
    {"name": "Collagen Booster Set (Collagen 100 + 7 Vegan)", "scope": "별도 계산", "retailPrice": 46.00, "salePrice": 38.99, "fobPrice": 14.38, "productionCost": 5.09, "distribution": 3.68, "mcf": 17.00, "tiktokFee": 0.28, "affiliateFee": 13.80, "affiliateProductCost": 27.88, "totalCost": 41.68, "netProfit": -2.69, "margin": -6.90, "price": 38.99, "cost": 5.09, "commission": 13.80, "logistics": 3.68},
    {"name": "Rice Bundle Set (Rice Toner + Rice Foam)", "scope": "별도 계산", "retailPrice": 45.00, "salePrice": 38.89, "fobPrice": 12.08, "productionCost": 5.36, "distribution": 3.60, "mcf": 14.00, "tiktokFee": 0.27, "affiliateFee": 13.50, "affiliateProductCost": 24.83, "totalCost": 38.33, "netProfit": 0.56, "margin": 1.43, "price": 38.89, "cost": 5.36, "commission": 13.50, "logistics": 3.60},
]

DEFAULT_INVENTORY = [
    {"name": "Collagen Booster Set", "id": "1732467111829541813", "sku": "MIZ_GRC_7VEGAN...", "stock": 0, "price": "$46.00", "views": 33612, "sold": 20, "sales": 396.51, "atRisk": False},
    {"name": "Rice Milky Toner & Rice Glow Mask Cleanser...", "id": "1732480952438330293", "sku": "100", "stock": 74, "price": "$38.89", "views": 8644, "sold": 17, "sales": 250.91, "atRisk": False},
    {"name": "Snail Repair Intensive BB Cream Broad Spectrum...", "id": "1732456115213538229", "sku": "-", "stock": 1832, "price": "$15.80", "views": 90262, "sold": 148, "sales": 602.99, "atRisk": False},
    {"name": "MIZON Rice Water Glow Mask Cleanser, 2-in-1...", "id": "-", "sku": "-", "stock": 424, "price": "$20.00", "views": 67456, "sold": 8, "sales": 0, "atRisk": False},
    {"name": "MIZON Real Vitamin C Ampoule - 19% Pure...", "id": "1731733543247123381", "sku": "MIZ_BEU_C03090...", "stock": 171, "price": "$28.75", "views": 1873, "sold": 1, "sales": 9.37, "atRisk": False},
    {"name": "Mizon Snail Repair Cream - Korean Face Moisturiz...", "id": "1731733626646991797", "sku": "-", "stock": 326, "price": "$12.00-$30.00", "views": 3057, "sold": 2, "sales": 63.63, "atRisk": True},
    {"name": "Mizon 7 Peptide & Snail Mucin Under-Eye Care...", "id": "1732129273412293557", "sku": "-", "stock": 73, "price": "$47.00", "views": 2413, "sold": 7, "sales": 0, "atRisk": True},
    {"name": "MIZON Hyalugen Double Layer Mist – Hyaluronic...", "id": "1731733590020821941", "sku": "MIZ_ANC_C03191...", "stock": 0, "price": "$24.00", "views": 1, "sold": 3, "sales": 0, "atRisk": False},
    {"name": "MIZON Triple Hyaluronic Acid Eye Gel Patches –...", "id": "1731738243883963317", "sku": "MIZ_GEN_C03130...", "stock": 1222, "price": "$22.00", "views": 761, "sold": 0, "sales": 0, "atRisk": False},
    {"name": "MIZON Rice Water Milky Toner for Glass Skin |...", "id": "1732388712530088885", "sku": "MIZ_ANC_RICE_20...", "stock": 74, "price": "$25.00", "views": 106960, "sold": 53, "sales": 1382.02, "atRisk": False},
    {"name": "MIZON Cicaluronic Eye Gel Patches – 24K Gold...", "id": "1731725388203266997", "sku": "MIZ_ANC_C03130...", "stock": 1075, "price": "$28.00", "views": 927, "sold": 2, "sales": 0, "atRisk": False},
    {"name": "MIZON Hyaluronic Acid 100 Serum – Deep...", "id": "1731738047512351669", "sku": "MIZ_ANC_C03090...", "stock": 316, "price": "$20.00", "views": 1635, "sold": 1, "sales": 0, "atRisk": False},
    {"name": "MIZON Hyalugen Water Toner – Deep Hydration...", "id": "1731738052787999669", "sku": "MIZ_ANC_C03191...", "stock": 0, "price": "$20.00", "views": 4, "sold": 0, "sales": 0, "atRisk": False},
    {"name": "MIZON Hyalugen Le Lift Cream – Hyaluronic Aci...", "id": "1731733554082976693", "sku": "MIZ_ANC_C03190...", "stock": 3, "price": "$25.83", "views": 964, "sold": 2, "sales": 12.83, "atRisk": True},
    {"name": "MIZON Collagen Power Lifting Cream – 75%...", "id": "1731738076603913141", "sku": "MIZ_ANC_C031107...", "stock": 1062, "price": "$22.50", "views": 4737, "sold": 2, "sales": 73.24, "atRisk": False},
    {"name": "MIZON Black Pearl Eye Gel Patch Masks –...", "id": "1731738138468258741", "sku": "MIZ_GEN_C03130...", "stock": 145, "price": "$22.00", "views": 2761, "sold": 1, "sales": 0, "atRisk": False},
    {"name": "MIZON Snail Repairing Foam Cleanser – Korea...", "id": "1731733772688200629", "sku": "MIZ_ANC_C03120...", "stock": 333, "price": "$12.00", "views": 1895, "sold": 1, "sales": 4.73, "atRisk": False},
    {"name": "MIZON Collagen Power Firming Eye Cream – 46...", "id": "1731738077472592821", "sku": "MIZ_ANC_C03110...", "stock": 290, "price": "$20.00", "views": 734, "sold": 0, "sales": 0, "atRisk": False},
    {"name": "MIZON Inner Bit Collagen 3300 Youth Enhancing...", "id": "1732118519330476981", "sku": "Stickered.MSKU.17...", "stock": 445, "price": "$28.00", "views": 12004, "sold": 7, "sales": 225.42, "atRisk": False},
    {"name": "MIZON Black Snail All-In-One Cream – Intensive...", "id": "-", "sku": "-", "stock": 468, "price": "$13.00-$23.00", "views": 1067, "sold": 4, "sales": 0, "atRisk": True},
    {"name": "MIZON Collagen 100 Ampoule – Korean Anti-...", "id": "1731725387414410165", "sku": "MIZ_ANC_C03090...", "stock": 498, "price": "$21.00", "views": 20576, "sold": 1, "sales": 104.78, "atRisk": False},
    {"name": "MIZON Pink Spot Overnight Acne...", "id": "1731725387608658869", "sku": "MIZ_PIC_C030902...", "stock": 549, "price": "$14.50", "views": 1104, "sold": 2, "sales": 16.26, "atRisk": False},
    {"name": "MIZON Water Volume EX Cream – Deep Hydratio...", "id": "-", "sku": "-", "stock": 35, "price": "$19.50-$26.00", "views": 616, "sold": 0, "sales": 0, "atRisk": True},
    {"name": "MIZON Snail Repair Intensive Toner – Snail...", "id": "1731738199644083125", "sku": "MIZ_ANC_C03070...", "stock": 307, "price": "$21.50", "views": 814, "sold": 0, "sales": 0, "atRisk": False},
    {"name": "MIZON Phyto Plump Collagen Eye Gel Patch...", "id": "1731733999943127989", "sku": "MIZ_GEN_C03130...", "stock": 0, "price": "$22.00", "views": 18, "sold": 0, "sales": 0, "atRisk": False},
    {"name": "MIZON 7 Vegan Peptide Booster Serum (150ml)...", "id": "1731725392684225461", "sku": "MIZ_GRC_7VEGAN...", "stock": 691, "price": "$25.00", "views": 260869, "sold": 464, "sales": 4253.23, "atRisk": True},
    {"name": "MIZON Pore Fresh Peeling Toner Pads – A...", "id": "1731733902737052597", "sku": "MIZ_GEN_C03120...", "stock": 459, "price": "$19.20", "views": 1407, "sold": 0, "sales": 0, "atRisk": False},
    {"name": "MIZON Collagen Power Firming Enriched Cream...", "id": "1731738127791920053", "sku": "MIZ_CT_C0311040...", "stock": 169, "price": "$20.00", "views": 826, "sold": 0, "sales": 0, "atRisk": False},
    {"name": "MIZON Phyto Plump Collagen Serum – Vega...", "id": "1731733961966785461", "sku": "MIZ_ANC_C03090...", "stock": 34, "price": "$20.00", "views": 676, "sold": 0, "sales": 0, "atRisk": False},
    {"name": "MIZON Snail Repair Intensive Essence – Sna...", "id": "1731738225188180917", "sku": "MIZ_ANC_C03090...", "stock": 577, "price": "$24.00", "views": 508, "sold": 0, "sales": 0, "atRisk": False},
]
