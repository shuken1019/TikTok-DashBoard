# 대표 보고용 Campaign 데이터 QA

검증일: 2026-07-26  
최신 원본: `Campaign overview data 20260701 - 20260727.xlsx`  
공식 대조 화면: TikTok Campaign Overview, 2026-07-01–2026-07-27

## 결론

대표 보고 화면의 7월 Campaign KPI는 공식 Overview 카드와 일치한다.

| KPI | 대표 보고 표시값 | 검증 결과 |
|---|---:|---|
| Gross revenue | $19,210.96 | 일별 27행 합계와 공식 카드 일치 |
| Cost | $34,164.02 | 공식 카드 일치 |
| SKU 주문 | 1,068건 | 일별 27행 합계와 공식 카드 일치 |
| Cost per order | $31.99 | $34,164.02 ÷ 1,068 재계산 |
| Campaign ROI | 0.56x | $19,210.96 ÷ $34,164.02 = 0.5623x |

## Cost 차이 처리

- XLSX Cost 27행 합계: $34,163.14
- 공식 Overview Cost 카드: $34,164.02
- 차이: +$0.88

화면 총계는 공식 카드 값을 사용한다. 2026-07-27 행에는 XLSX 원본
`sourceCost = $1,159.26`, 총계 차이 `overviewAdjustment = $0.88`,
집계용 `cost = $1,160.14`를 각각 보존해 숫자 변경 경로를 추적할 수 있다.

## 결합 데이터 검산

- 일별 행: 390일 (2025-07-03–2026-07-27)
- 중복 날짜: 0건
- Cost: $100,480.97
- SKU 주문: 2,724건
- Gross revenue: $55,259.58
- ROI: 0.5500x
- 13개 월별 집계와 390개 일별 집계 차이: 전 항목 $0.00 / 0건

## 대표 보고에서 제외한 값

`Monthly Finance`의 GMV $37,967.08과 배부 비용·총비용·순이익은 최신 일별
원본과 일치하지 않거나 실제 비용 원본이 없는 계획 모델이다. 메인 대표 보고 KPI에서는
제외했고 Admin에서 `대표보고 비사용`으로 표시했다.

Shop Analytics의 검증된 별도 합계는 266일, GMV $31,437.66, 주문 2,610건이다.
이는 Campaign 귀속 Gross revenue와 정의·기간이 다르므로 합산하지 않는다.

## 실행 확인

- 최신 XLSX 행 수·날짜·합계 assertion 통과
- 일별 390행 ↔ 월별 13행 reconciliation 통과
- 정적 JavaScript 문법 검사 통과
- 정적 HTML 내부 링크 18개 파일 검사: 누락 0건
- React/Vite production build 통과
- 메인 대시보드·Campaign 상세·데이터센터 Chrome 렌더링 확인
