#!/usr/bin/env python3
"""Merge reviewed July/August Shop Analytics XLSX files into the daily dataset."""

from __future__ import annotations

import ast
import re
from datetime import datetime
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
SOURCES = (
    (
        Path("/Users/serena/Downloads/Shop Analytics_Key metrics_20260818.xlsx"),
        "2026-08-01",
        "2026-08-17",
        17,
    ),
)
NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

FIELD_COLUMNS = {
    "gmv": "B",
    "orders": "C",
    "customers": "D",
    "itemsSold": "E",
    "itemsCanceledReturned": "F",
    "itemsRefunded": "G",
    "skuOrders": "I",
    "liveGmv": "K",
    "productCardGmv": "R",
    "videoGmv": "S",
    "gmvWithTax": "Z",
    "tax": "AA",
    "shippingFees": "AB",
    "productImpressions": "AC",
    "uniqueProductImpressions": "AD",
    "productClicks": "AE",
    "uniqueClicks": "AF",
}
INTEGER_FIELDS = {
    "orders",
    "customers",
    "itemsSold",
    "itemsCanceledReturned",
    "skuOrders",
    "productImpressions",
    "uniqueProductImpressions",
    "productClicks",
    "uniqueClicks",
}


def worksheet_rows(path: Path) -> list[dict[str, str | None]]:
    with ZipFile(path) as archive:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = [
                "".join(node.text or "" for node in item.iter(f"{{{NS['a']}}}t"))
                for item in root.findall("a:si", NS)
            ]

        root = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows: list[dict[str, str | None]] = []
        for row in root.findall(".//a:sheetData/a:row", NS):
            values: dict[str, str | None] = {}
            for cell in row.findall("a:c", NS):
                column = re.sub(r"\d", "", cell.attrib["r"])
                value_node = cell.find("a:v", NS)
                value = None if value_node is None else value_node.text
                if cell.attrib.get("t") == "s" and value is not None:
                    value = shared[int(value)]
                values[column] = value
            rows.append(values)
        return rows


def number(value: str | None, integer: bool = False) -> int | float:
    if value in (None, "", "-"):
        return 0
    parsed = float(str(value).replace(",", ""))
    return int(parsed) if integer else round(parsed, 2)


def normalize(row: dict[str, str | None]) -> dict:
    date = datetime.strptime(str(row["A"]), "%d/%m/%Y").strftime("%Y-%m-%d")
    record = {"date": date}
    for field, column in FIELD_COLUMNS.items():
        record[field] = number(row.get(column), field in INTEGER_FIELDS)
    return record


def existing_rows(path: Path) -> tuple[list[dict], str]:
    text = path.read_text(encoding="utf-8")
    match = re.search(
        r"(?:export const|const) dailyAnalytics = \[\s*(.*?)\];\s*\n\n(const MONTH_NAMES_KR.*)",
        text,
        re.S,
    )
    if not match:
        raise ValueError(f"Could not locate dailyAnalytics in {path}")
    records = []
    for item in re.findall(r"\{[^{}]+\}", match.group(1)):
        quoted = re.sub(r"([{,]\s*)([A-Za-z]\w*)\s*:", r"\1'\2':", item)
        records.append(ast.literal_eval(quoted))
    return records, match.group(2)


def render(records: list[dict], footer: str, react: bool) -> str:
    declaration = "export const" if react else "const"
    lines = [
        "// Shop Analytics source of truth:",
        "// Shop Analytics_Key metrics_20260808 (2).xlsx (2026-07-01–2026-07-31)",
        "// Shop Analytics_Key metrics_20260818.xlsx (2026-08-01–2026-08-17)",
        "// Shop Analytics_Key metrics_20260808 (1).xlsx is a byte-identical duplicate and is excluded.",
        "// 2026-08-17 has no source values for GMV with tax, tax, or shipping fees; stored as 0.",
        "// Historical daily rows through 2026-06-30 are retained from the reviewed 2026-07-24 export.",
        f"{declaration} dailyAnalytics = [",
    ]
    for record in records:
        fields = ", ".join(f"{key}: {value!r}" for key, value in record.items())
        lines.append(f"  {{ {fields} }},")
    lines.extend(["];", "", footer])
    return "\n".join(lines)


def main() -> None:
    source_rows: list[dict] = []
    source_summaries: list[str] = []
    for source, start, end, expected_days in SOURCES:
        if not source.exists():
            raise FileNotFoundError(source)

        raw = worksheet_rows(source)
        total_row = raw[3]
        daily_rows = [
            normalize(row)
            for row in raw
            if re.fullmatch(r"\d{2}/\d{2}/\d{4}", str(row.get("A")))
        ]
        dates = {row["date"] for row in daily_rows}
        if (
            len(daily_rows) != expected_days
            or len(dates) != expected_days
            or min(dates) != start
            or max(dates) != end
        ):
            raise ValueError(f"Expected {expected_days} unique daily rows for {start}–{end}")

        for field, column in FIELD_COLUMNS.items():
            expected = number(total_row.get(column), field in INTEGER_FIELDS)
            actual = sum(row[field] for row in daily_rows)
            if field not in INTEGER_FIELDS:
                actual = round(actual, 2)
            if actual != expected:
                raise ValueError(
                    f"{source.name}: {field} failed source reconciliation: {actual} != {expected}"
                )

        source_rows.extend(daily_rows)
        source_summaries.append(
            f"{start}–{end}: {expected_days} days · GMV ${sum(row['gmv'] for row in daily_rows):,.2f}"
        )

    if len({row["date"] for row in source_rows}) != len(source_rows):
        raise ValueError("Source date ranges overlap")

    for relative, react in (
        ("assets/shop-analytics-data.js", False),
        ("frontend/src/data/shopAnalytics.js", True),
    ):
        target = ROOT / relative
        old, footer = existing_rows(target)
        merged = {row["date"]: row for row in old if row["date"] < "2026-08-01"}
        merged.update({row["date"]: row for row in source_rows})
        records = [merged[key] for key in sorted(merged)]
        if len(records) != 290 or records[-1]["date"] != "2026-08-17":
            raise ValueError(f"Unexpected merged range in {relative}")
        target.write_text(render(records, footer, react), encoding="utf-8")

    print("Shop source checks: all 17 stored metrics match each source Total value")
    for summary in source_summaries:
        print(summary)
    print("Merged range: 290 days, 2025-11-01 through 2026-08-17")


if __name__ == "__main__":
    main()
