import re
from typing import Dict, List, Optional

import pandas as pd


def normalize_header(header: str) -> str:
    return re.sub(r"[^a-z0-9]", "_", str(header).strip().lower())


def find_column(columns: List[str], keywords: List[str]) -> Optional[str]:
    normalized = [normalize_header(col) for col in columns]
    for keyword in keywords:
        for idx, col in enumerate(normalized):
            if keyword in col:
                return columns[idx]
    return None


def parse_monthly_sheet(df: pd.DataFrame) -> List[Dict]:
    if df.empty:
        return []

    original_columns = list(df.columns)
    month_col = find_column(original_columns, ["month", "date", "period", "월"])
    revenue_col = find_column(original_columns, ["revenue", "sales", "amount", "매출"])
    ad_spend_col = find_column(original_columns, ["ad_spend", "ad spend", "ad", "advertising", "광고"])
    total_cost_col = find_column(original_columns, ["total_cost", "total cost", "cost", "expense", "expenses", "총비용"])

    if not month_col or not revenue_col:
        return []

    if total_cost_col is None:
        total_cost_col = revenue_col

    rows = []
    for _, row in df.iterrows():
        month_value = row.get(month_col)
        if pd.isna(month_value):
            continue
        try:
            revenue = float(row.get(revenue_col, 0) or 0)
        except (TypeError, ValueError):
            revenue = 0.0
        try:
            ad_spend = float(row.get(ad_spend_col, 0) or 0) if ad_spend_col else 0.0
        except (TypeError, ValueError):
            ad_spend = 0.0
        try:
            total_cost = float(row.get(total_cost_col, 0) or 0)
        except (TypeError, ValueError):
            total_cost = 0.0

        rows.append(
            {
                "month": str(month_value).strip(),
                "revenue": revenue,
                "adSpend": ad_spend,
                "totalCost": total_cost,
                "profit": revenue - total_cost,
            }
        )

    return rows


def parse_forecast_sheet(df: pd.DataFrame) -> Dict:
    forecast = {"q3": {"revenue": 0.0, "adSpend": 0.0, "profit": 0.0}, "q4": {"revenue": 0.0, "adSpend": 0.0, "profit": 0.0}}
    if df.empty:
        return forecast

    lower_columns = [normalize_header(col) for col in df.columns]
    if any("q3" in col for col in lower_columns) or any("q4" in col for col in lower_columns):
        for _, row in df.iterrows():
            row_label = str(row.iloc[0]).strip().lower()
            if "q3" in row_label:
                forecast["q3"]["revenue"] = float(row.get(find_column(df.columns, ["revenue", "sales", "amount"])) or 0)
                forecast["q3"]["adSpend"] = float(row.get(find_column(df.columns, ["ad_spend", "advertising", "ad"])) or 0)
                forecast["q3"]["profit"] = float(row.get(find_column(df.columns, ["profit", "net", "이익"])) or 0)
            elif "q4" in row_label:
                forecast["q4"]["revenue"] = float(row.get(find_column(df.columns, ["revenue", "sales", "amount"])) or 0)
                forecast["q4"]["adSpend"] = float(row.get(find_column(df.columns, ["ad_spend", "advertising", "ad"])) or 0)
                forecast["q4"]["profit"] = float(row.get(find_column(df.columns, ["profit", "net", "이익"])) or 0)
        return forecast

    month_col = find_column(df.columns, ["month", "period", "월"])
    revenue_col = find_column(df.columns, ["revenue", "sales", "amount", "매출"])
    ad_col = find_column(df.columns, ["ad_spend", "ad spend", "ad", "advertising", "광고"])
    profit_col = find_column(df.columns, ["profit", "net", "이익"])

    if month_col and revenue_col:
        for _, row in df.iterrows():
            month_value = str(row.get(month_col)).strip().lower()
            if "q3" in month_value:
                forecast["q3"]["revenue"] = float(row.get(revenue_col, 0) or 0)
                forecast["q3"]["adSpend"] = float(row.get(ad_col, 0) or 0)
                forecast["q3"]["profit"] = float(row.get(profit_col, 0) or 0)
            elif "q4" in month_value:
                forecast["q4"]["revenue"] = float(row.get(revenue_col, 0) or 0)
                forecast["q4"]["adSpend"] = float(row.get(ad_col, 0) or 0)
                forecast["q4"]["profit"] = float(row.get(profit_col, 0) or 0)

    return forecast


def parse_cost_sheet(df: pd.DataFrame) -> List[Dict]:
    if df.empty:
        return []

    original_columns = list(df.columns)
    label_col = find_column(original_columns, ["category", "type", "cost_type", "label", "label", "비용", "항목"])
    value_col = find_column(original_columns, ["value", "amount", "cost", "expense", "total", "금액"])

    if not label_col or not value_col:
        return []

    items = []
    for _, row in df.iterrows():
        label = row.get(label_col)
        if pd.isna(label):
            continue
        value = row.get(value_col, 0) or 0
        try:
            value = float(value)
        except (TypeError, ValueError):
            value = 0.0
        items.append({"label": str(label).strip(), "value": value})

    return items


def parse_product_sheet(df: pd.DataFrame) -> List[Dict]:
    if df.empty:
        return []

    original_columns = list(df.columns)
    name_col = find_column(original_columns, ["product", "sku", "item", "상품", "제품"])
    price_col = find_column(original_columns, ["price", "판매가", "unit_price"])
    cost_col = find_column(original_columns, ["cost", "unit_cost", "원가"])
    commission_col = find_column(original_columns, ["commission", "fee", "수수료"])
    logistics_col = find_column(original_columns, ["logistics", "delivery", "shipping", "물류"])
    total_col = find_column(original_columns, ["total_cost", "total cost", "총비용"])
    margin_col = find_column(original_columns, ["margin", "gm", "gpm", "마진"])

    if not name_col or not price_col:
        return []

    products = []
    for _, row in df.iterrows():
        name = row.get(name_col)
        if pd.isna(name):
            continue
        def to_float(value):
            try:
                return float(value or 0)
            except (TypeError, ValueError):
                return 0.0

        price = to_float(row.get(price_col, 0))
        cost = to_float(row.get(cost_col, 0))
        commission = to_float(row.get(commission_col, 0))
        logistics = to_float(row.get(logistics_col, 0))
        total_cost = to_float(row.get(total_col, cost + commission + logistics if cost_col and commission_col and logistics_col else 0))
        margin = to_float(row.get(margin_col, 0))
        if not margin and total_cost > 0:
            margin = round((price - total_cost) / price * 100, 0) if price else 0

        products.append({
            "name": str(name).strip(),
            "price": price,
            "cost": cost,
            "commission": commission,
            "logistics": logistics,
            "totalCost": total_cost,
            "margin": margin,
        })

    return products


def parse_tiktok_excel(file_bytes: bytes) -> Dict:
    workbook = pd.ExcelFile(pd.io.common.BytesIO(file_bytes))
    sheets = {name: workbook.parse(name) for name in workbook.sheet_names}

    monthly_data = []
    forecast_data = {"q3": {"revenue": 0.0, "adSpend": 0.0, "profit": 0.0}, "q4": {"revenue": 0.0, "adSpend": 0.0, "profit": 0.0}}
    cost_items = []
    product_costs = []

    for sheet_name, sheet_df in sheets.items():
        normalized_name = normalize_header(sheet_name)
        if any(keyword in normalized_name for keyword in ["month", "monthly", "summary", "sales", "매출", "월"]):
            if not monthly_data:
                monthly_data = parse_monthly_sheet(sheet_df)
            if not forecast_data or forecast_data["q3"]["revenue"] == 0:
                forecast_data = parse_forecast_sheet(sheet_df)
        elif any(keyword in normalized_name for keyword in ["forecast", "projection", "plan", "예상"]):
            forecast_data = parse_forecast_sheet(sheet_df)
        elif any(keyword in normalized_name for keyword in ["cost", "expense", "비용", "structure"]):
            if not cost_items:
                cost_items = parse_cost_sheet(sheet_df)
        elif any(keyword in normalized_name for keyword in ["product", "sku", "item", "상품"]):
            if not product_costs:
                product_costs = parse_product_sheet(sheet_df)

    if not monthly_data and sheets:
        first_sheet = next(iter(sheets.values()))
        monthly_data = parse_monthly_sheet(first_sheet)
        if not forecast_data:
            forecast_data = parse_forecast_sheet(first_sheet)

    if not cost_items and product_costs:
        total_cost = sum(item.get("totalCost", 0) for item in product_costs)
        cost_items = [{"label": "제품 원가+수수료+물류", "value": total_cost}]

    if not forecast_data["q3"]["revenue"] and not forecast_data["q4"]["revenue"]:
        forecast_data = {
            "q3": {"revenue": 0.0, "adSpend": 0.0, "profit": 0.0},
            "q4": {"revenue": 0.0, "adSpend": 0.0, "profit": 0.0},
        }

    if not monthly_data:
        raise ValueError("엑셀에서 월별 요약 데이터를 찾을 수 없습니다. 'Month', 'Revenue', 'Ad Spend' 컬럼이 있는 시트를 확인하세요.")

    return {
        "monthlyData": monthly_data,
        "forecastData": forecast_data,
        "costItems": cost_items,
        "productCosts": product_costs,
    }
