# 2026-07-27 데이터 업데이트 감사 기록

## 대표 보고에 사용할 기준

| 영역 | 실제 원본 기간 | 검증된 핵심 값 | 사용 기준 |
|---|---|---:|---|
| Shop Analytics | 2026-07-01–07-26 | GMV $9,861.16 · 주문 1,089건 | 파일명은 7/27이지만 내부 마지막 행은 7/26 |
| Campaign Overview | 2026-07-01–07-27 | Gross revenue $19,210.96 · Cost $34,164.02 · ROI 0.56x | 공식 Overview 카드 총계 우선 |
| Affiliate Core Metrics | 2026-07-01–07-25 | 귀속 GMV $7,007.76 · 수수료 $2,282.78 · ROI 3.07x | Affiliate 상단 KPI |
| Affiliate 상세 목록 | 2026-07-01–07-24 | 귀속 GMV $6,758.68 · 수수료 $2,212.34 | Creator·Video·LIVE·Product 상세 |

## Shop Analytics 검증

- 새 파일의 26개 일별 행을 모두 읽어 17개 저장 지표를 `Total value` 행과 대조했다.
- 7월 합계는 GMV $9,861.16, 주문 1,089건, 고객 1,070명, 판매 아이템 1,128개다.
- 기존 2025-11-01–2026-06-30 데이터와 합친 전체 268일 합계는 GMV $32,621.48, 주문 2,731건이다.
- 7/26에는 GMV $265.11과 주문 28건이 있으나 세금, 배송비, 세금 포함 GMV가 원본에서 `-`다. 따라서 7/26 손익은 확정값으로 사용하지 않는다.

## Affiliate 상세 검증

- Creator 상세: 6,272행, GMV $6,758.68, 주문 799건, 아이템 817개, 수수료 $2,212.34.
- Video 상세: 1,510행, GMV $6,566.57, 주문 781건, 수수료 $2,156.49.
- LIVE 상세: 108행, GMV $36.20, 주문 3건, 수수료 $15.00.
- Product 상세: 42행, GMV $6,758.68, 주문 799건, 아이템 817개, 수수료 $2,212.34.
- 채널 합계 `Video $6,566.57 + LIVE $36.20 + showcase $155.91`는 Creator/Product 상세 GMV $6,758.68과 일치한다.
- Core는 상세보다 하루 더 길어 GMV $249.08, 수수료 $70.44가 더 크다. 차이는 오류가 아니라 종료일 차이다.
- 이름에 `(1)`이 붙은 Product 파일과 원본 Product 파일은 SHA-256이 동일한 완전 중복 파일이라 한 번만 집계했다.

## 아직 필요한 자료

1. Shop의 7/27 일별 행까지 필요하면 7/27이 실제 포함된 새 Shop Analytics export.
2. 7/26 손익을 확정하려면 세금·배송비·세금 포함 GMV가 채워진 Shop 재다운로드.
3. Affiliate Core와 상세를 완전히 같은 기간으로 맞추려면 Creator·Video·LIVE·Product 상세 목록의 7/25 포함본.
4. 7/26–7/27 Affiliate 성과까지 보고하려면 Core와 네 가지 상세 목록의 동일 종료일 export.

## 재검증 명령

```bash
python3 scripts/import_shop_analytics.py
python3 scripts/import_campaign_daily.py
python3 scripts/verify_20260727_sources.py
```
