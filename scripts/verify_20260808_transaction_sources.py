#!/usr/bin/env python3
"""Reconcile the 2026-08-08 Transaction Analysis source files.

The workbook parser is shared with the prior source audit and uses only the
Python standard library. This script does not modify dashboard data.
"""

from pathlib import Path
from verify_20260727_sources import number, rows


DOWNLOADS = Path("/Users/serena/Downloads")
JULY_CORE = DOWNLOADS / "Transaction_Analysis_Core_Metrics_20260701-20260731.xlsx"
AUG_CORE = DOWNLOADS / "Transaction_Analysis_Core_Metrics_20260801-20260805.xlsx"
JULY_PRODUCTS = DOWNLOADS / "Transaction_Analysis_Product_List_20260701-20260731.xlsx"


def core_values(path):
    sheet = rows(path)
    return sheet[0], sheet[1], sheet[2]


def close(left, right, tolerance=0.005):
    return abs(left - right) <= tolerance


def main():
    for path in (JULY_CORE, AUG_CORE, JULY_PRODUCTS):
        if not path.exists():
            raise SystemExit(f"Missing source: {path}")

    _, july_definitions, july = core_values(JULY_CORE)
    _, august_definitions, august = core_values(AUG_CORE)
    product_rows = rows(JULY_PRODUCTS)[2:]

    ids = [str(row.get("B", "")).strip() for row in product_rows]
    if len(product_rows) != 42 or len(set(ids)) != 42:
        raise AssertionError(f"Expected 42 unique products; got {len(product_rows)} rows / {len(set(ids))} IDs")

    checks = {
        "Creator-attributed GMV": (sum(number(row.get("D")) for row in product_rows), number(july["A"])),
        "Creator-attributed items sold": (sum(number(row.get("E")) for row in product_rows), number(july["B"])),
        "Refunds": (sum(number(row.get("F")) for row in product_rows), number(july["C"])),
        "Items refunded": (sum(number(row.get("G")) for row in product_rows), number(july["D"])),
        "Est. commission": (sum(number(row.get("V")) for row in product_rows), number(july["S"])),
    }
    for label, (detail, core) in checks.items():
        if not close(detail, core):
            raise AssertionError(f"{label}: product detail {detail:.2f} != core {core:.2f}")
        print(f"PASS {label}: {core:,.2f}")

    daily_fields = [
        column for column in ("K", "L", "N", "O", "P", "Q")
        if "average" in str(august_definitions.get(column, "")).lower() and "per day" in str(august_definitions.get(column, "")).lower()
    ]
    if daily_fields != ["K", "L", "N", "O", "P", "Q"]:
        raise AssertionError(f"Unexpected August grain: {daily_fields}")

    print("PASS July product rows: 42 unique product IDs")
    print("PASS August schema: K/L/N/O/P/Q are daily averages and remain separately labelled")
    print(f"INFO July GMV {number(july['A']):,.2f}; August 1-5 GMV {number(august['A']):,.2f}")


if __name__ == "__main__":
    main()
