#!/usr/bin/env python3
"""Validate the bundle margin workbook supplied on 2026-08-08."""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))
from verify_20260727_sources import number, rows


SOURCE = Path("/Users/serena/Downloads/틱톡샵 번들 최고 할인 마진.xlsx")


def close(left, right, tolerance=0.005):
    return abs(left - right) <= tolerance


def main():
    sheet = rows(SOURCE)
    if len(sheet) != 46:
        raise AssertionError(f"Expected 46 rows, got {len(sheet)}")

    bundle_rows = {row.get("A", "").strip(): row for row in sheet[40:]}
    checks = {
        "Collagen Booster sets(Collagen100 + 7Vegan Peptide)": (46.0, 39.1, 27.882, 13.8, -2.582),
        "Rice Bundle set(Rice Toner+Rice Foam)": (45.0, 45.0, 24.833, 13.5, 6.667),
    }
    for name, (retail, sale, product_cost, affiliate_fee, profit) in checks.items():
        row = bundle_rows[name]
        actual = [number(row[key]) for key in ("E", "F", "Z", "W", "AA")]
        expected = [retail, sale, product_cost, affiliate_fee, profit]
        if not all(close(left, right) for left, right in zip(actual, expected)):
            raise AssertionError(f"{name}: {actual} != {expected}")
        if not close(sale - product_cost - affiliate_fee, profit):
            raise AssertionError(f"{name}: profit formula failed")
        break_even = product_cost + affiliate_fee
        max_discount = (1 - break_even / retail) * 100
        print(f"PASS {name}: break-even ${break_even:.3f}; max discount {max_discount:.2f}%")

    error_rows = [row.get("A", "") for row in sheet[1:39] if any(str(value).startswith("#") for value in row.values())]
    print(f"WARN formula-error product rows: {len(error_rows)}")
    for name in error_rows:
        print(f"  - {name.strip()}")

    suspicious = [
        row for row in sheet[1:39]
        if number(row.get("W")) is not None and number(row.get("W")) > 100
    ]
    if suspicious:
        print("WARN suspicious Affiliate fee rows:")
        for row in suspicious:
            print(f"  - {row.get('A', '').strip()}: {number(row.get('W')):,.2f}")


if __name__ == "__main__":
    main()
