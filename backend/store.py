"""Generic JSON-file backed persistence for the dashboard's editable data resources.

Mirrors the loadData/saveData/resetData pattern from the static prototype's
assets/data-store.js, but shared server-side instead of per-browser localStorage.
"""

import copy
import json
from pathlib import Path
from typing import Any

from . import seed_data

DATA_DIR = Path(__file__).resolve().parent / "data"

RESOURCES: dict[str, tuple[type, Any]] = {
    "inventory": (list, seed_data.DEFAULT_INVENTORY),
    "monthly": (list, seed_data.DEFAULT_MONTHLY),
    "forecast": (dict, seed_data.DEFAULT_FORECAST),
    "costItems": (list, seed_data.DEFAULT_COST_ITEMS),
    "productSales": (list, seed_data.DEFAULT_PRODUCT_SALES),
    "productCosts": (list, seed_data.DEFAULT_PRODUCT_COSTS),
}

OLD_MONTHLY_REVENUE = {
    "11월": 197.15, "12월": 390.1, "1월": 845.38, "2월": 2088.21,
    "3월": 5975.89, "4월": 10463.52, "5월": 1972.69,
    "6월": 2446.03, "7월": 9861.16,
}

PREVIOUS_MONTHLY_REVENUE = {
    "11월": 128.5, "12월": 265.55, "1월": 960.67, "2월": 1328.74,
    "3월": 8214.87, "4월": 11414.39, "5월": 7186.05,
    "6월": 2446.03, "7월": 9861.16,
}

PRE_JUNE_SETTLEMENT_REVENUE = {
    "11월": 128.5, "12월": 265.55, "1월": 960.67, "2월": 1328.74,
    "3월": 8214.87, "4월": 11414.39, "5월": 7186.05,
    "6월": 2446.03, "7월": 14137.42,
}

VERIFIED_PRE_AUG_REVENUE = {
    "11월": 128.5, "12월": 265.55, "1월": 960.67, "2월": 1328.74,
    "3월": 8214.87, "4월": 11414.39, "5월": 7186.05,
    "6월": 3828.00, "7월": 14137.42,
}

MONTH_KEY_MAP = {
    "11월": "2025-11", "12월": "2025-12", "1월": "2026-01", "2월": "2026-02",
    "3월": "2026-03", "4월": "2026-04", "5월": "2026-05", "6월": "2026-06", "7월": "2026-07",
}

PREVIOUS_TARGET_PLAN = {
    "2026-08": (27000, 40000), "2026-09": (47000, 48000),
    "2026-10": (67000, 53333), "2026-11": (100000, 60000),
    "2026-12": (150000, 90000),
}


def _migrate_known_defaults(resource: str, value: Any, default: Any) -> Any:
    """Update only known embedded defaults; never overwrite genuine Admin edits."""
    if resource == "monthly" and isinstance(value, list) and len(value) == len(OLD_MONTHLY_REVENUE):
        is_old_default = any(
            all(
                row.get("month") in revision
                and abs(float(row.get("revenue", 0)) - revision[row["month"]]) < 0.01
                for row in value
            )
            for revision in (OLD_MONTHLY_REVENUE, PREVIOUS_MONTHLY_REVENUE, PRE_JUNE_SETTLEMENT_REVENUE, VERIFIED_PRE_AUG_REVENUE)
        )
        if is_old_default:
            return copy.deepcopy(default)

    if resource == "monthly" and isinstance(value, list):
        actual_rows = [row for row in value if float(row.get("revenue", 0) or 0) or float(row.get("totalCost", 0) or 0)]
        known_revisions = (OLD_MONTHLY_REVENUE, PREVIOUS_MONTHLY_REVENUE, PRE_JUNE_SETTLEMENT_REVENUE, VERIFIED_PRE_AUG_REVENUE)
        normalized_revisions = [
            {MONTH_KEY_MAP.get(month, month): revenue for month, revenue in revision.items()}
            for revision in known_revisions
        ]
        is_known_actual_default = len(actual_rows) >= 9 and any(
            all(
                str(row.get("month", "")).replace(".", "-") in revision
                and abs(float(row.get("revenue", 0) or 0) - revision[str(row.get("month", "")).replace(".", "-")]) < 0.01
                for row in actual_rows
            )
            for revision in normalized_revisions
        )
        if is_known_actual_default:
            verified_by_month = {
                str(row.get("month", "")).replace(".", "-"): copy.deepcopy(row)
                for row in default
                if float(row.get("revenue", 0) or 0) or float(row.get("totalCost", 0) or 0)
            }
            migrated = []
            existing_months = set()
            for row in value:
                month = str(row.get("month", "")).replace(".", "-")
                existing_months.add(month)
                updated = copy.deepcopy(row)
                if month in verified_by_month:
                    updated.update(verified_by_month[month])
                migrated.append(updated)
            migrated.extend(
                copy.deepcopy(row) for month, row in verified_by_month.items()
                if month not in existing_months
            )
            return sorted(migrated, key=lambda row: str(row.get("month", "")).replace(".", "-"))

        target_rows = [
            row for row in value
            if not float(row.get("revenue", 0) or 0)
            and (float(row.get("targetRevenue", 0) or 0) or float(row.get("targetAdSpend", 0) or 0))
        ]
        is_previous_plan = len(target_rows) == 5 and all(
            row.get("month") in PREVIOUS_TARGET_PLAN
            and abs(float(row.get("targetRevenue", 0)) - PREVIOUS_TARGET_PLAN[row["month"]][0]) < 0.01
            and abs(float(row.get("targetAdSpend", 0)) - PREVIOUS_TARGET_PLAN[row["month"]][1]) < 0.01
            for row in target_rows
        )
        if is_previous_plan:
            normalized_actual = []
            for row in actual_rows:
                updated = copy.deepcopy(row)
                updated["month"] = MONTH_KEY_MAP.get(updated.get("month"), updated.get("month"))
                updated.setdefault("targetRevenue", 0)
                updated.setdefault("targetAdSpend", 0)
                normalized_actual.append(updated)
            return normalized_actual + copy.deepcopy(default[9:])

    if resource == "forecast" and isinstance(value, dict):
        q3, q4 = value.get("q3", {}), value.get("q4", {})
        if (q3.get("revenue"), q3.get("profit"), q4.get("revenue"), q4.get("profit")) in (
            (141000, -56169, 250000, 1001),
            (141000, -46064, 250000, 18917),
            (141000, -41820, 250000, 26441),
            (141000, -40612, 250000, 28583),
        ):
            return copy.deepcopy(default)

    return value


def _path_for(resource: str) -> Path:
    return DATA_DIR / f"{resource}.json"


def is_valid_resource(resource: str) -> bool:
    return resource in RESOURCES


def load(resource: str) -> Any:
    expected_type, default = RESOURCES[resource]
    path = _path_for(resource)
    if path.exists():
        with path.open(encoding="utf-8") as f:
            value = json.load(f)
        if isinstance(value, expected_type):
            migrated = _migrate_known_defaults(resource, value, default)
            if migrated != value:
                save(resource, migrated)
            return migrated
    return copy.deepcopy(default)


def save(resource: str, value: Any) -> Any:
    expected_type, _ = RESOURCES[resource]
    if not isinstance(value, expected_type):
        raise TypeError(f"'{resource}' expects a {expected_type.__name__}, got {type(value).__name__}")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with _path_for(resource).open("w", encoding="utf-8") as f:
        json.dump(value, f, ensure_ascii=False, indent=2)
    return value


def reset(resource: str) -> Any:
    path = _path_for(resource)
    if path.exists():
        path.unlink()
    _, default = RESOURCES[resource]
    return copy.deepcopy(default)
