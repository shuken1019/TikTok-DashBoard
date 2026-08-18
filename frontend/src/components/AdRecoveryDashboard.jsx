import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { AD_RECOVERY_CURRENT, AD_RECOVERY_PLAN, buildAdRecoveryScenario } from '../data/adRecovery';
import '../recovery.css';

Chart.register(...registerables);

const SCENARIOS = [1, 0.9, 0.8, 0.7];
const usd = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(value);
const exactUsd = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(value);
const signedUsd = (value) => `${value >= 0 ? '+' : '-'}${usd(Math.abs(value))}`;
const monthLabel = (value) => {
  const [year, month] = value.split('-');
  return `${year}.${month}`;
};

export default function AdRecoveryDashboard() {
  const [attainment, setAttainment] = useState(1);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const scenario = useMemo(() => buildAdRecoveryScenario(attainment), [attainment]);

  useEffect(() => {
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: ['2026.08', ...scenario.rows.map((row) => monthLabel(row.month))],
        datasets: [
          {
            label: '현재 실적',
            data: [AD_RECOVERY_CURRENT.balance, null, null, null, null, null, null, null],
            borderColor: '#991b1b', backgroundColor: '#991b1b', pointRadius: 6, borderWidth: 3,
          },
          {
            label: `회수 계획 (${Math.round(attainment * 100)}%)`,
            data: [AD_RECOVERY_CURRENT.balance, ...scenario.rows.map((row) => row.cumulative)],
            borderColor: '#2563eb', backgroundColor: '#2563eb', borderDash: [7, 5], borderWidth: 3,
            tension: 0, pointRadius: 5, pointBorderWidth: 2, pointBorderColor: '#fff',
            pointBackgroundColor: [
              AD_RECOVERY_CURRENT.balance,
              ...scenario.rows.map((row) => row.cumulative),
            ].map((value) => value >= 0 ? '#047857' : '#b91c1c'),
          },
          {
            label: '손실 회수선', data: Array(8).fill(0), borderColor: '#475569',
            backgroundColor: '#475569', borderWidth: 2, pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${signedUsd(ctx.raw || 0)}` } },
        },
        scales: {
          y: {
            ticks: { callback: (value) => `${value < 0 ? '-' : ''}$${Math.abs(value / 1000).toFixed(0)}k` },
            grid: { color: (ctx) => ctx.tick.value === 0 ? '#475569' : 'rgba(148,163,184,.22)', lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1 },
          },
          x: { grid: { display: false } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [scenario, attainment]);

  const september = AD_RECOVERY_PLAN[0];
  return (
    <section className="ad-recovery-dashboard" aria-labelledby="adRecoveryTitle">
      <div className="recovery-heading">
        <div>
          <span className="recovery-kicker">광고 투자 회수 계획</span>
          <h2 id="adRecoveryTitle">누적 광고 차이 회수</h2>
          <p>Total Revenue와 동일 종료일의 광고비만 비교합니다.</p>
        </div>
        <span className="recovery-source">기준일 {AD_RECOVERY_CURRENT.through}</span>
      </div>

      <div className="recovery-kpis">
        <article><span>현재 광고 차이</span><strong className="negative">-{exactUsd(Math.abs(AD_RECOVERY_CURRENT.balance))}</strong><small>매출 {exactUsd(AD_RECOVERY_CURRENT.revenue)} − 광고비 {exactUsd(AD_RECOVERY_CURRENT.adSpend)}</small></article>
        <article><span>현재 광고 ROI</span><strong>{AD_RECOVERY_CURRENT.roi.toFixed(2)}x</strong><small>목표 3.00x · 2027년 3월</small></article>
        <article><span>관리 목표</span><strong>2027년 1월</strong><small>100% 달성 시 계산상 {buildAdRecoveryScenario(1).recovery.label}</small></article>
        <article><span>운영 마감선</span><strong>2027년 2월</strong><small>80% 달성 시 {buildAdRecoveryScenario(.8).recovery.label}</small></article>
      </div>

      <div className="recovery-scenarios" aria-label="매출 목표 달성률">
        <div><strong>매출 목표 달성률</strong><small>광고 상한은 전액 사용한다고 가정</small></div>
        {SCENARIOS.map((value) => {
          const result = buildAdRecoveryScenario(value);
          return <button type="button" key={value} className={attainment === value ? 'active' : ''} onClick={() => setAttainment(value)}>
            <b>{Math.round(value * 100)}%</b><span>{result.recovery?.label || '3월 이후'}</span>
          </button>;
        })}
      </div>

      <div className="recovery-main-grid">
        <article className="recovery-chart-card">
          <div className="recovery-card-title"><div><h3>누적 광고 차이</h3><p>0선을 넘는 시점이 광고비 회수 완료 시점입니다.</p></div><strong>{scenario.recovery?.label || '계획 기간 이후'}</strong></div>
          <div className="recovery-chart-wrap"><canvas ref={canvasRef} /></div>
        </article>
        <aside className="recovery-operation-card">
          <span>9월 운영 기준</span>
          <h3>처음부터 $32k를 모두 쓰지 않습니다</h3>
          <dl>
            <div><dt>광고 상한</dt><dd>{usd(september.adCap)}</dd></div>
            <div><dt>초기 집행</dt><dd>{usd(september.initialBudget)}</dd></div>
            <div><dt>보류 예산</dt><dd>{usd(september.reserve)}</dd></div>
            <div><dt>해제 조건</dt><dd>ROI 1.20x 이상</dd></div>
          </dl>
          <p>7일 연속 ROI 1.0x 미만이면 증액을 중단하고, 상품별 기여이익이 확인된 캠페인에만 보류 예산을 풉니다.</p>
        </aside>
      </div>

      <div className="recovery-table-wrap">
        <table className="recovery-table">
          <thead><tr><th>월</th><th>목표 매출</th><th>광고 상한</th><th>목표 ROI</th><th>{Math.round(attainment * 100)}% 매출</th><th>월 회수액</th><th>누적 광고 차이</th><th>상태</th></tr></thead>
          <tbody>{scenario.rows.map((row) => <tr key={row.month}>
            <td>{monthLabel(row.month)}</td><td>{usd(row.revenue)}</td><td>{usd(row.adCap)}</td><td>{row.roi.toFixed(2)}x</td><td>{usd(row.realizedRevenue)}</td>
            <td className={row.monthlyRecovery >= 0 ? 'positive' : 'negative'}>{signedUsd(row.monthlyRecovery)}</td>
            <td className={row.cumulative >= 0 ? 'positive' : 'negative'}>{signedUsd(row.cumulative)}</td>
            <td><span className={`recovery-status ${row.cumulative >= 0 ? 'done' : 'pending'}`}>{row.cumulative >= 0 ? '회수 완료' : '회수 중'}</span></td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="recovery-caveat"><strong>계산 범위:</strong> 이 수치는 Total Revenue − 광고비의 누적 차이입니다. 제품 원가·수수료·물류비·시딩비를 포함한 회계상 순손실이 아닙니다. 실적은 8/17 종료일 정렬본, 계획은 2026.09~2027.03 광고예산·ROI 플랜 기준입니다.</p>
    </section>
  );
}
