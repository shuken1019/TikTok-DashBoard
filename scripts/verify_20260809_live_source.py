#!/usr/bin/env python3
"""Validate the 2026-08-09 Creator LIVE performance refresh."""

from datetime import datetime
from pathlib import Path

from verify_20260727_sources import close, number, rows


SOURCE = Path("/Users/serena/Downloads/Creator-Live-Performance_20260809081100.xlsx")


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source: {SOURCE}")

    sheet = rows(SOURCE)
    if sheet[0].get("A") != "2026-07-01 ~ 2026-08-09":
        raise AssertionError(f"Unexpected export range: {sheet[0].get('A')}")

    header = sheet[2]
    expected_headers = {
        "A": "Room ID",
        "C": "Start Time",
        "F": "Attributed GMV",
        "L": "Views",
        "M": "Impressions",
        "V": "Product Impressions",
        "W": "Product clicks",
    }
    for column, expected in expected_headers.items():
        if header.get(column) != expected:
            raise AssertionError(f"Column {column}: {header.get(column)!r} != {expected!r}")

    data = sheet[3:]
    room_ids = [row.get("A", "").strip() for row in data]
    if len(data) != 4 or len(set(room_ids)) != 4 or "" in room_ids:
        raise AssertionError(f"Expected 4 unique Room IDs; got {len(data)} rows / {len(set(room_ids))} IDs")

    checks = {
        "Attributed GMV": ("F", 0.00),
        "Attributed items": ("G", 0),
        "Attributed orders": ("H", 0),
        "Views": ("L", 974),
        "Impressions": ("M", 9655),
        "Product impressions": ("V", 252),
        "Product clicks": ("W", 12),
        "Comments": ("AD", 6),
        "Shares": ("AF", 10),
        "Likes": ("AH", 441),
    }
    for label, (column, expected) in checks.items():
        close(sum(number(row.get(column, "")) for row in data), expected, label)

    durations = []
    for row in data:
        start = datetime.strptime(row["C"], "%Y-%m-%d %H:%M:%S")
        end = datetime.strptime(row["D"], "%Y-%m-%d %H:%M:%S")
        if end < start:
            raise AssertionError(f"Negative duration for Room ID {row['A']}")
        durations.append((end - start).total_seconds())

    if min(durations) != 8:
        raise AssertionError(f"Expected the test-like 8-second session; minimum was {min(durations)} seconds")

    july_refresh = next(row for row in data if row["A"] == "7664780238211369758")
    close(number(july_refresh["L"]), 260, "Refreshed MIZON LIVE views")
    close(number(july_refresh["R"]), 35.84, "Refreshed MIZON LIVE average view")

    print("PASS source range: 2026-07-01 ~ 2026-08-09")
    print("PASS grain: 4 rows, 4 unique Room IDs")
    print("PASS totals: GMV $0.00, 974 views, 9,655 impressions, 12 product clicks")
    print("PASS overlap refresh: MIZON LIVE 260 views, 35.84s average view")
    print("NOTE 2026-08-04 contains an 8-second, zero-view session; retained and labelled as test-like")


if __name__ == "__main__":
    main()
