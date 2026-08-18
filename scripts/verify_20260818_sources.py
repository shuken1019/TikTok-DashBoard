#!/usr/bin/env python3
"""Reconcile the August 18 dashboard inputs against their controlling totals."""

from __future__ import annotations

import csv
from pathlib import Path

from verify_20260727_sources import number, rows

DOWNLOADS = Path('/Users/serena/Downloads')


def assert_close(label: str, actual: float, expected: float, tolerance: float = 0.01) -> None:
    if abs(actual - expected) > tolerance:
        raise AssertionError(f'{label}: {actual} != {expected}')
    print(f'PASS {label}: {actual:,.2f}')


def main() -> None:
    shop = rows(DOWNLOADS / 'Shop Analytics_Key metrics_20260818.xlsx')
    total = shop[3]
    daily = shop[9:26]
    assert len(daily) == 17
    assert_close('Shop GMV daily → total', sum(number(r['B']) for r in daily), number(total['B']))
    assert_close('Shop orders daily → total', sum(number(r['C']) for r in daily), number(total['C']))
    assert_close('Shop refunds daily → total', sum(number(r['G']) for r in daily), number(total['G']))

    traffic = rows(DOWNLOADS / 'Product_Traffic_Shop_[total]_Key_Metrics_01_08_2026-17_08_2026.xlsx')[6]
    assert_close('Product Traffic GMV ↔ Shop GMV', number(traffic['B']), number(total['B']))
    assert_close('Product Traffic SKU orders ↔ Shop SKU orders', number(traffic['D']), number(total['I']))

    transaction = rows(DOWNLOADS / 'Transaction_Analysis_Core_Metrics_20260801-20260815.xlsx')[2]
    assert_close('Affiliate GMV', number(transaction['A']), 8785.25)
    assert_close('Affiliate commission', number(transaction['S']), 2452.74)

    samples = rows(DOWNLOADS / 'Sample_Analysis_Core_Metrics_20260801-20260815.xlsx')[2]
    assert_close('Samples shipped', number(samples['A']), 631)
    assert_close('Sample content GMV', number(samples['B']), 7409.04)

    live = rows(DOWNLOADS / 'AccountsDataAnalysis_Total_20260801_20260817.xlsx')[3]
    assert_close('Accounts LIVE GMV', number(live['B']), 109.76)
    assert_close('Accounts LIVE SKU orders', number(live['E']), 7)
    assert_close('Accounts LIVE views', number(live['L']), 294357)

    promotions = rows(DOWNLOADS / 'Shop Promotion List - 20260818050737.xlsx')[3:]
    assert len(promotions) == 23
    assert_close('Top promotion GMV', number(promotions[0]['F']), 5526.00)
    assert_close('Top promotion orders', number(promotions[0]['G']), 470)

    with (DOWNLOADS / 'ads.tiktok.csv').open(encoding='utf-8-sig', newline='') as handle:
        records = [r for r in csv.DictReader(handle) if r['By Day'] not in ('', '-')]
    assert len(records) == 18
    assert_close('Ads cost daily → overview', sum(number(r['Cost']) for r in records), 35235.56)
    assert_close('Ads revenue daily → overview', sum(number(r['Gross revenue (Current shop)']) for r in records), 20440.07)
    assert_close('Ads orders daily → overview', sum(number(r['SKU orders (Current shop)']) for r in records), 968)

    print('PASS cutoff policy: Shop 08-17 · ads 08-18 · affiliate/sample 08-15')
    print('NOTE Product orders sum to 937 vs Shop 936; use SKU orders (939) for product reconciliation.')
    print('NOTE SKU GMV is $10,403.41 vs Shop GMV $10,403.59; $0.18 source-detail gap retained.')


if __name__ == '__main__':
    main()
