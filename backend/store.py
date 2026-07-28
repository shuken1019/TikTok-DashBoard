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
            return value
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
