#!/usr/bin/env python3
"""Build the executive ROI transition budget plan as a dependency-free XLSX."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "2026_09-2027_03_광고예산_ROI_흑자전환계획.xlsx"

NON_AD_RATIO = 13559 / 72904.18
ACTUAL_TOTAL_REVENUE = 72904.18
ACTUAL_AD_SPEND = 135103.52
ACTUAL_AD_BALANCE = ACTUAL_TOTAL_REVENUE - ACTUAL_AD_SPEND
CONFIRMED_SETTLEMENT_THROUGH_JUNE = 19620.79
CONFIRMED_AD_SPEND_THROUGH_JUNE = 65852.86
CONFIRMED_CASH_AFTER_ADS_THROUGH_JUNE = (
    CONFIRMED_SETTLEMENT_THROUGH_JUNE - CONFIRMED_AD_SPEND_THROUGH_JUNE
)

PLAN = [
    ("2026-09", 32000, 24000, 8000, 1.2, "ROI 1.2 이상일 때 예비액 집행"),
    ("2026-10", 30000, 23000, 7000, 1.5, "9월 목표 달성 광고 중심 재배분"),
    ("2026-11", 28000, 22000, 6000, 1.8, "상품별 기여이익 플러스 광고만 증액"),
    ("2026-12", 26000, 20000, 6000, 2.1, "ROI 2.0 미만 광고 즉시 감액"),
    ("2027-01", 24000, 19000, 5000, 2.5, "주간 ROI 2.5 이상 유지"),
    ("2027-02", 22000, 18000, 4000, 2.8, "월 마감 원가 입력 후 회계 손익 확인"),
    ("2027-03", 22000, 18000, 4000, 3.0, "대표 목표 ROI 3.0 정착"),
]


def col_name(index: int) -> str:
    result = ""
    while index:
        index, rem = divmod(index - 1, 26)
        result = chr(65 + rem) + result
    return result


def cell(ref: str, value=None, style: int = 0, formula: str | None = None) -> str:
    attrs = f'r="{ref}"'
    if style:
        attrs += f' s="{style}"'
    if formula is not None:
        cached = "" if value is None else str(value)
        return f"<c {attrs}><f>{escape(formula)}</f><v>{cached}</v></c>"
    if value is None:
        return f"<c {attrs}/>"
    if isinstance(value, (int, float)):
        return f"<c {attrs}><v>{value}</v></c>"
    return f'<c {attrs} t="inlineStr"><is><t>{escape(str(value))}</t></is></c>'


def row_xml(row_num: int, values: list, styles: list[int] | None = None,
            formulas: dict[int, tuple[str, float]] | None = None, height: float | None = None) -> str:
    styles = styles or [0] * len(values)
    formulas = formulas or {}
    attrs = f'r="{row_num}"'
    if height:
        attrs += f' ht="{height}" customHeight="1"'
    cells = []
    for idx, value in enumerate(values, start=1):
        ref = f"{col_name(idx)}{row_num}"
        if idx in formulas:
            formula, cached = formulas[idx]
            cells.append(cell(ref, cached, styles[idx - 1], formula))
        else:
            cells.append(cell(ref, value, styles[idx - 1]))
    return f"<row {attrs}>{''.join(cells)}</row>"


def worksheet(rows: list[str], widths: list[float], merges: list[str] | None = None,
              freeze: str | None = None, autofilter: str | None = None,
              conditional: str = "") -> str:
    cols = "".join(
        f'<col min="{i}" max="{i}" width="{width}" customWidth="1"/>'
        for i, width in enumerate(widths, start=1)
    )
    pane = f'<pane ySplit="{int(freeze[1:]) - 1}" topLeftCell="{freeze}" activePane="bottomLeft" state="frozen"/>' if freeze else ""
    sheet_views = f'<sheetViews><sheetView workbookViewId="0">{pane}</sheetView></sheetViews>'
    merge_xml = ""
    if merges:
        merge_xml = f'<mergeCells count="{len(merges)}">' + "".join(f'<mergeCell ref="{m}"/>' for m in merges) + "</mergeCells>"
    filter_xml = f'<autoFilter ref="{autofilter}"/>' if autofilter else ""
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'{sheet_views}<sheetFormatPr defaultRowHeight="18"/><cols>{cols}</cols>'
        f'<sheetData>{"".join(rows)}</sheetData>{filter_xml}{merge_xml}{conditional}'
        '<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>'
        '</worksheet>'
    )


def styles_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="3">
    <numFmt numFmtId="164" formatCode="$#,##0.00;[Red]-$#,##0.00"/>
    <numFmt numFmtId="165" formatCode="0.0x"/>
    <numFmt numFmtId="166" formatCode="0.0%"/>
  </numFmts>
  <fonts count="5">
    <font><sz val="10"/><name val="Arial"/><color rgb="FF172033"/></font>
    <font><b/><sz val="16"/><name val="Arial"/><color rgb="FFFFFFFF"/></font>
    <font><b/><sz val="10"/><name val="Arial"/><color rgb="FFFFFFFF"/></font>
    <font><b/><sz val="11"/><name val="Arial"/><color rgb="FF172033"/></font>
    <font><b/><sz val="10"/><name val="Arial"/><color rgb="FF0F766E"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF173B72"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFECFDF5"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF7ED"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD9E2EC"/></left><right style="thin"><color rgb="FFD9E2EC"/></right><top style="thin"><color rgb="FFD9E2EC"/></top><bottom style="thin"><color rgb="FFD9E2EC"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="12">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="4" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="6" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="3" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
  </cellXfs>
  <dxfs count="1"><dxf><font><color rgb="FFB91C1C"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/><bgColor indexed="64"/></patternFill></fill></dxf></dxfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>'''


def build_summary() -> str:
    rows = [
        row_xml(1, ["광고예산·ROI 흑자 전환 계획", "", "", "", "", ""], [1, 1, 1, 1, 1, 1], height=30),
        row_xml(3, ["확정 집계 기간", "2025-11~2026-08-17", "누적 Total Revenue", ACTUAL_TOTAL_REVENUE, "누적 광고비", ACTUAL_AD_SPEND], [3, 7, 3, 4, 3, 4], height=24),
        row_xml(4, ["정확한 누적 광고수지", ACTUAL_AD_BALANCE, "정확한 누적 ROI", ACTUAL_TOTAL_REVENUE / ACTUAL_AD_SPEND, "회계상 누적 순손실", "원가원장 필요"], [3, 11, 3, 5, 3, 9], height=24),
        row_xml(6, ["경영 결론", "", "", "", "", ""], [2, 2, 2, 2, 2, 2], height=24),
        row_xml(7, ["월 추정흑자 목표", "2026년 10월", "누적 광고수지 회복", "2026년 12월", "ROI 3.0 목표", "2027년 3월"], [3, 10, 3, 10, 3, 10], height=28),
        row_xml(9, ["9월 예산 제안", "", "", "", "", ""], [2, 2, 2, 2, 2, 2], height=24),
        row_xml(10, ["최대 승인액", 32000, "우선 집행액", 24000, "조건부 예비액", 8000], [3, 11, 3, 11, 3, 11], height=26),
        row_xml(11, ["예비액 집행 조건", "월 누적 ROI 1.2 이상이며 상품별 기여이익이 플러스일 때만 집행", "", "", "", ""], [3, 9, 9, 9, 9, 9], height=34),
        row_xml(13, ["주의", "", "", "", "", ""], [2, 2, 2, 2, 2, 2], height=24),
        row_xml(14, ["ROI 정의", "본 계획의 ROI는 Total Revenue ÷ 광고비입니다. TikTok Campaign 화면의 귀속 Gross Revenue ÷ Cost와 다를 수 있습니다.", "", "", "", ""], [3, 9, 9, 9, 9, 9], height=42),
        row_xml(15, ["손익 성격", "제품 원가·수수료 등 비광고비는 현재 확인 매출 대비 18.6%를 적용한 추정치입니다. 회계 마감 후 교체해야 합니다.", "", "", "", ""], [3, 9, 9, 9, 9, 9], height=42),
    ]
    return worksheet(rows, [20, 24, 24, 24, 23, 24], ["A1:F1", "A6:F6", "A9:F9", "B11:F11", "A13:F13", "B14:F14", "B15:F15"])


def build_monthly_plan() -> str:
    headers = ["월", "최대 승인액", "우선 집행액", "조건부 예비액", "목표 ROI", "매출 목표", "비광고비 추정", "예상 월손익", "월 광고수지", "누적 광고수지", "상태", "집행 조건"]
    rows = [
        row_xml(1, ["2026.09~2027.03 월별 실행 계획", "", "", "", "", "", "", "", "", "", "", ""], [1] * 12, height=30),
        row_xml(2, ["시작 누적 광고수지", ACTUAL_AD_BALANCE, "비광고비율", NON_AD_RATIO, "ROI 정의", "Total Revenue ÷ 광고비", "회계 누적손익", "원가원장 입력 전 확정 불가", "", "", "", ""], [3, 11, 3, 6, 3, 7, 3, 9, 0, 0, 0, 0], height=24),
        row_xml(4, headers, [2] * len(headers), height=34),
    ]
    cumulative_ad_balance = ACTUAL_AD_BALANCE
    for offset, (month, max_budget, initial, reserve, roi, gate) in enumerate(PLAN, start=5):
        revenue = max_budget * roi
        non_ad = revenue * NON_AD_RATIO
        monthly_profit = revenue - max_budget - non_ad
        monthly_ad_balance = revenue - max_budget
        cumulative_ad_balance += monthly_ad_balance
        prev_cum = "$B$2" if offset == 5 else f"J{offset - 1}"
        formulas = {
            4: (f"B{offset}-C{offset}", reserve),
            6: (f"B{offset}*E{offset}", revenue),
            7: (f"F{offset}*$D$2", non_ad),
            8: (f"F{offset}-B{offset}-G{offset}", monthly_profit),
            9: (f"F{offset}-B{offset}", monthly_ad_balance),
            10: (f"{prev_cum}+I{offset}", cumulative_ad_balance),
        }
        status = "광고수지 회복" if cumulative_ad_balance >= 0 else ("월 추정흑자" if monthly_profit >= 0 else "전환 단계")
        values = [month, max_budget, initial, reserve, roi, revenue, non_ad, monthly_profit, monthly_ad_balance, cumulative_ad_balance, status, gate]
        styles = [7, 4, 4, 4, 5, 4, 4, 4, 4, 8 if cumulative_ad_balance >= 0 else 4, 10 if cumulative_ad_balance >= 0 else 7, 7]
        rows.append(row_xml(offset, values, styles, formulas, height=28))
    conditional = (
        '<conditionalFormatting sqref="H5:J11">'
        '<cfRule type="cellIs" dxfId="0" priority="1" operator="lessThan"><formula>0</formula></cfRule>'
        '</conditionalFormatting>'
    )
    return worksheet(rows, [13, 16, 16, 16, 13, 16, 17, 17, 17, 17, 16, 34], ["A1:L1"], "A5", "A4:L11", conditional)


def build_gates() -> str:
    data = [
        ("주간 예산", "월 최대 승인액을 4주로 나눠 집행", "주간 상한 초과 금지", "초과분 다음 주 차감"),
        ("ROI", "월별 목표 ROI의 90% 이상", "2주 연속 미달", "해당 광고 예산 20% 감액"),
        ("손익", "상품별 기여이익 플러스", "기여이익 마이너스", "증액 금지·가격/수수료 재검토"),
        ("예비액", "목표 ROI 달성 + 기여이익 플러스", "둘 중 하나라도 미달", "예비액 미집행"),
        ("증액", "7일 ROI 목표 초과 및 주문 증가", "일시적 1일 급등", "3일 이상 재검증 후 최대 10% 증액"),
        ("중단", "ROI 1.0 미만 7일 지속", "매출만 있고 마진 없음", "광고 중단 후 소재·상품 교체"),
    ]
    rows = [
        row_xml(1, ["광고비 집행 기준", "", "", ""], [1, 1, 1, 1], height=30),
        row_xml(3, ["관리 항목", "통과 기준", "경고 기준", "조치"], [2, 2, 2, 2], height=30),
    ]
    for idx, values in enumerate(data, start=4):
        rows.append(row_xml(idx, list(values), [3, 7, 9, 7], height=38))
    rows.extend([
        row_xml(11, ["대표 보고 문구", "", "", ""], [2, 2, 2, 2], height=24),
        row_xml(12, ["", "9월 광고비는 최대 $32,000으로 승인받되 $24,000만 우선 집행합니다. 목표 ROI와 상품별 기여이익을 충족할 때만 예비액 $8,000을 단계적으로 사용합니다. 누적 광고수지는 2026년 12월 회복, ROI 3.0은 2027년 3월을 목표로 합니다. 회계상 누적 순손실은 원가원장 입력 후 확정합니다.", "", ""], [0, 9, 9, 9], height=68),
    ])
    return worksheet(rows, [16, 39, 30, 36], ["A1:D1", "A11:D11", "B12:D12"], "A4")


def build_sources() -> str:
    data = [
        ("정산 매출", "income_20260817172713(UTC-7).xlsx", "2026-08-01~08-17", "$25,439.99 Total Revenue"),
        ("광고비", "ads.tiktok.csv", "2026-08-01~08-18", "$35,235.56 Cost"),
        ("누적 Total Revenue", "월별 Finance 원본 + 8월 income 원본", "2025-11~2026-08-17", "$72,904.18"),
        ("누적 광고비", "월별 Campaign 원본 + ads.tiktok.csv", "2025-11~2026-08-17", "$135,103.52"),
        ("정확한 누적 광고수지", "Total Revenue - 광고비", "2025-11~2026-08-17", "-$62,199.34 · 누적 ROI 0.54x"),
        ("비광고비율", "Admin 비용 스냅샷", "현재 계획 가정", "$13,559 ÷ $72,904.18 = 18.598%"),
        ("확인된 정산현금", "월별 Finance Reports", "2025-11~2026-06", "$19,620.79 정산액 - $65,852.86 광고비 = -$46,232.07"),
    ]
    rows = [
        row_xml(1, ["가정 및 출처", "", "", ""], [1, 1, 1, 1], height=30),
        row_xml(3, ["항목", "원본", "적용 기간", "값·설명"], [2, 2, 2, 2], height=30),
    ]
    for idx, values in enumerate(data, start=4):
        rows.append(row_xml(idx, list(values), [3, 7, 7, 7], height=36))
    rows.extend([
        row_xml(12, ["검증 제한", "", "", ""], [2, 2, 2, 2], height=24),
        row_xml(13, ["", "누적 광고수지 -$62,199.34는 Total Revenue와 광고비 원본을 동일 종료일로 맞춘 정확한 값입니다. 회계상 순손실과는 다릅니다.", "", ""], [0, 9, 9, 9], height=42),
        row_xml(14, ["", "회계상 누적 순손실을 확정하려면 7월 정산액 원본과 월별 실제 제품 원가·외부 시딩·물류·기타 운영비 원장이 필요합니다.", "", ""], [0, 9, 9, 9], height=42),
    ])
    return worksheet(rows, [18, 45, 23, 48], ["A1:D1", "A12:D12", "B13:D13", "B14:D14"])


def build_xlsx() -> None:
    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>'''
    root_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>'''
    workbook = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView activeTab="0"/></bookViews>
  <sheets>
    <sheet name="요약" sheetId="1" r:id="rId1"/>
    <sheet name="월별 계획" sheetId="2" r:id="rId2"/>
    <sheet name="집행 기준" sheetId="3" r:id="rId3"/>
    <sheet name="가정 및 출처" sheetId="4" r:id="rId4"/>
  </sheets>
  <calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/>
</workbook>'''
    workbook_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    core = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>광고예산 ROI 흑자 전환 계획</dc:title><dc:creator>Serena Project</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>'''
    app = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Excel</Application></Properties>'''

    with ZipFile(OUTPUT, "w", ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr("_rels/.rels", root_rels)
        archive.writestr("docProps/core.xml", core)
        archive.writestr("docProps/app.xml", app)
        archive.writestr("xl/workbook.xml", workbook)
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
        archive.writestr("xl/styles.xml", styles_xml())
        archive.writestr("xl/worksheets/sheet1.xml", build_summary())
        archive.writestr("xl/worksheets/sheet2.xml", build_monthly_plan())
        archive.writestr("xl/worksheets/sheet3.xml", build_gates())
        archive.writestr("xl/worksheets/sheet4.xml", build_sources())

    print(OUTPUT)


if __name__ == "__main__":
    build_xlsx()
