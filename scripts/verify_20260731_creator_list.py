#!/usr/bin/env python3
"""Validate the July 2026 Transaction Analysis Creator List exports."""

from hashlib import sha256
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))
from verify_20260727_sources import number, rows


SOURCES = [
    Path("/Users/serena/Downloads/Transaction_Analysis_Creator_List_20260701-20260731.xlsx"),
    Path("/Users/serena/Downloads/Transaction_Analysis_Creator_List_20260701-20260731 (1).xlsx"),
]


def numeric(row, column):
    value = number(row.get(column))
    return 0 if value is None else value


def main():
    hashes = [sha256(path.read_bytes()).hexdigest() for path in SOURCES]
    if len(set(hashes)) != 1:
        raise AssertionError("The two supplied Creator List files differ")

    records = rows(SOURCES[0])[2:]
    names = [str(row.get("A", "")).strip() for row in records]
    if len(records) != 6747 or len(set(names)) != 6747 or any(not name for name in names):
        raise AssertionError("Creator grain or uniqueness check failed")

    expected = {
        "B": 10395.51,
        "C": 57.58,
        "D": 10044.92,
        "E": 520.44,
        "F": 1145,
        "G": 1167,
        "L": 178,
        "M": 1025,
        "V": 3370.93,
    }
    for column, target in expected.items():
        actual = sum(numeric(row, column) for row in records)
        if abs(actual - target) > 0.005:
            raise AssertionError(f"Column {column}: {actual} != {target}")

    sales_creators = sum(numeric(row, "B") > 0 for row in records)
    content_creators = sum(numeric(row, "L") + numeric(row, "M") > 0 for row in records)
    if sales_creators != 120 or content_creators != 640:
        raise AssertionError("Creator activity counts do not match expected values")

    top = sorted(records, key=lambda row: numeric(row, "B"), reverse=True)[:3]
    top_names = [row["A"] for row in top]
    if top_names != ["blankitaoro17", "nathaliegaby1", "marbelizolivieri"]:
        raise AssertionError(f"Unexpected top creators: {top_names}")
    top_share = sum(numeric(row, "B") for row in top) / expected["B"] * 100

    print(f"PASS identical source copies: {hashes[0]}")
    print(f"PASS creator grain: {len(records):,} rows, {len(set(names)):,} unique names")
    print(f"PASS totals: GMV ${expected['B']:,.2f}, commission ${expected['V']:,.2f}, items {expected['G']:,.0f}")
    print(f"PASS activity: {content_creators:,} posted content; {sales_creators:,} generated GMV")
    print(f"PASS concentration: top 3 creators generated {top_share:.2f}% of GMV")
    print("NOTE Core Metrics remains the headline source; Creator List controls ranking and detail sums.")


if __name__ == "__main__":
    main()
