#!/usr/bin/env python3
"""Re-run the 2026-07-27 source reconciliations without third-party packages."""

from __future__ import annotations

import hashlib
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

DOWNLOADS = Path("/Users/serena/Downloads")
NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"


def rows(path: Path) -> list[dict[str, str]]:
    with ZipFile(path) as archive:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = [
                "".join(node.text or "" for node in item.iter(f"{{{NS}}}t"))
                for item in root.findall(f"{{{NS}}}si")
            ]
        root = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        result = []
        for row in root.findall(f".//{{{NS}}}sheetData/{{{NS}}}row"):
            values: dict[str, str] = {}
            for cell in row.findall(f"{{{NS}}}c"):
                column = re.sub(r"\d", "", cell.attrib["r"])
                value_node = cell.find(f"{{{NS}}}v")
                if cell.attrib.get("t") == "inlineStr":
                    value = "".join(node.text or "" for node in cell.iter(f"{{{NS}}}t"))
                elif value_node is None:
                    value = ""
                elif cell.attrib.get("t") == "s":
                    value = shared[int(value_node.text)]
                else:
                    value = value_node.text or ""
                values[column] = value
            result.append(values)
        return result


def number(value: str) -> float:
    clean = str(value or "0").replace("$", "").replace("%", "").replace(",", "")
    return 0.0 if clean in ("", "-") else float(clean)


def close(actual: float, expected: float, label: str) -> None:
    if round(actual, 2) != round(expected, 2):
        raise AssertionError(f"{label}: {actual:.2f} != {expected:.2f}")


def detail_check(filename: str, metrics: dict[str, float], expected_rows: int) -> None:
    data = [row for row in rows(DOWNLOADS / filename)[2:] if row.get("B")]
    if len(data) != expected_rows:
        raise AssertionError(f"{filename}: {len(data)} rows != {expected_rows}")
    for column, expected in metrics.items():
        close(sum(number(row.get(column, "")) for row in data), expected, f"{filename} {column}")


def main() -> None:
    core = rows(DOWNLOADS / "Transaction_Analysis_Core_Metrics_20260701-20260725.xlsx")[2]
    for column, expected in {
        "A": 7007.76,
        "B": 847,
        "C": 340.70,
        "D": 32,
        "G": 702,
        "H": 101,
        "R": 314,
        "S": 2282.78,
        "T": 452,
    }.items():
        close(number(core[column]), expected, f"Core {column}")

    detail_check(
        "Transaction_Analysis_Creator_List_20260701-20260724.xlsx",
        {"B": 6758.68, "C": 36.20, "D": 6566.57, "J": 155.91, "F": 799, "G": 817, "V": 2212.34},
        6272,
    )
    detail_check(
        "Transaction_Analysis_Video_List_20260701-20260724.xlsx",
        {"G": 6566.57, "H": 781, "X": 2156.49},
        1510,
    )
    detail_check(
        "Transaction_Analysis_Live_List_20260701-20260724.xlsx",
        {"G": 36.20, "J": 3, "Z": 15.00},
        108,
    )
    detail_check(
        "Transaction_Analysis_Product_List_20260701-20260724.xlsx",
        {"D": 6758.68, "E": 817, "H": 799, "V": 2212.34},
        42,
    )

    product_a = DOWNLOADS / "Transaction_Analysis_Product_List_20260701-20260724.xlsx"
    product_b = DOWNLOADS / "Transaction_Analysis_Product_List_20260701-20260724 (1).xlsx"
    if hashlib.sha256(product_a.read_bytes()).digest() != hashlib.sha256(product_b.read_bytes()).digest():
        raise AssertionError("The two July Product files are not identical")

    close(number(core["A"]) - 6758.68, 249.08, "Core 7/25 vs detail 7/24 GMV gap")
    close(number(core["S"]) - 2212.34, 70.44, "Core 7/25 vs detail 7/24 commission gap")

    print("PASS: Core 7/25 and all four detail exports reconcile")
    print("PASS: Creator/Product detail GMV $6,758.68 and commission $2,212.34")
    print("PASS: Video $6,566.57 + LIVE $36.20 + showcase $155.91 = $6,758.68")
    print("PASS: duplicate July Product files are byte-identical and counted once")
    print("EXPECTED DATE GAP: Core 7/25 exceeds detail 7/24 by GMV $249.08")


if __name__ == "__main__":
    main()
