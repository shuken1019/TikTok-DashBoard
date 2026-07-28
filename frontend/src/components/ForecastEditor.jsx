import { useEffect, useState } from 'react';
import { getData, resetData, saveData } from '../api';

const FIELDS = ['revenue', 'adSpend', 'profit'];

function QuarterRow({ label, quarterValue, isEditing, draft, setDraft, onEdit, onSave, onCancel }) {
  return (
    <tr>
      <td>{label}</td>
      {FIELDS.map((field) => (
        <td key={field}>
          {isEditing ? (
            <input
              type="number"
              min="0"
              value={draft[field]}
              onChange={(event) => setDraft({ ...draft, [field]: Number(event.target.value) })}
            />
          ) : (
            quarterValue[field]
          )}
        </td>
      ))}
      <td className="row-actions">
        {isEditing ? (
          <>
            <button type="button" className="save-btn" onClick={onSave}>저장</button>
            <button type="button" className="cancel-btn" onClick={onCancel}>취소</button>
          </>
        ) : (
          <button type="button" className="edit-btn" onClick={onEdit}>수정</button>
        )}
      </td>
    </tr>
  );
}

function ForecastEditor() {
  const [data, setData] = useState({ q3: { revenue: 0, adSpend: 0, profit: 0 }, q4: { revenue: 0, adSpend: 0, profit: 0 } });
  const [loading, setLoading] = useState(true);
  const [editingQuarter, setEditingQuarter] = useState(null);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    getData('forecast').then((value) => {
      setData(value);
      setLoading(false);
    });
  }, []);

  function startEdit(quarterKey) {
    setEditingQuarter(quarterKey);
    setDraft({ ...data[quarterKey] });
  }

  function cancelEdit() {
    setEditingQuarter(null);
    setDraft(null);
  }

  function saveEdit() {
    const next = { ...data, [editingQuarter]: draft };
    setData(next);
    saveData('forecast', next);
    setEditingQuarter(null);
    setDraft(null);
  }

  function handleReset() {
    if (!window.confirm('Forecast 데이터를 기본값으로 되돌릴까요?')) return;
    resetData('forecast').then(setData);
  }

  if (loading) return null;

  return (
    <section className="card admin-section" style={{ marginTop: 20 }}>
      <div className="chart-title"><div><h2>Forecast (3Q / 4Q)</h2><small>분기별 예상 매출·광고비·순이익</small></div></div>
      <table className="table admin-table" style={{ marginTop: 16 }}>
        <thead><tr><th>분기</th><th>매출</th><th>광고비</th><th>순이익</th><th>작업</th></tr></thead>
        <tbody>
          <QuarterRow
            label="3분기"
            quarterValue={data.q3}
            isEditing={editingQuarter === 'q3'}
            draft={draft}
            setDraft={setDraft}
            onEdit={() => startEdit('q3')}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
          <QuarterRow
            label="4분기"
            quarterValue={data.q4}
            isEditing={editingQuarter === 'q4'}
            draft={draft}
            setDraft={setDraft}
            onEdit={() => startEdit('q4')}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
        </tbody>
      </table>
      <div className="control-row">
        <button type="button" style={{ background: 'var(--danger)' }} onClick={handleReset}>기본값으로 초기화</button>
      </div>
    </section>
  );
}

export default ForecastEditor;
