import { useEffect, useState } from 'react';
import { getData, resetData, saveData } from '../api';

function emptyRow(columns) {
  const row = {};
  columns.forEach((col) => {
    row[col.field] = col.type === 'checkbox' ? false : col.type === 'number' ? 0 : '';
  });
  return row;
}

function FieldInput({ col, value, onChange }) {
  if (col.type === 'checkbox') {
    return <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />;
  }
  return (
    <input
      type={col.type}
      step={col.step}
      min={col.type === 'number' ? 0 : undefined}
      value={value}
      onChange={(event) => onChange(col.type === 'number' ? Number(event.target.value) : event.target.value)}
    />
  );
}

function EditableTable({ resource, columns, title, subtitle, searchable = false }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [newRow, setNewRow] = useState(() => emptyRow(columns));
  const [search, setSearch] = useState('');

  useEffect(() => {
    getData(resource).then((value) => {
      setData(value);
      setLoading(false);
    });
  }, [resource]);

  function persist(nextData) {
    setData(nextData);
    saveData(resource, nextData);
  }

  function startEdit(index) {
    setEditingIndex(index);
    setEditRow({ ...data[index] });
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditRow(null);
  }

  function saveEdit() {
    persist(data.map((item, index) => (index === editingIndex ? editRow : item)));
    setEditingIndex(null);
    setEditRow(null);
  }

  function deleteRow(index) {
    if (!window.confirm('이 항목을 삭제할까요?')) return;
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditRow(null);
    }
    persist(data.filter((_, i) => i !== index));
  }

  function addRow() {
    persist([...data, newRow]);
    setNewRow(emptyRow(columns));
  }

  function handleResetClick() {
    if (!window.confirm('이 항목의 모든 변경사항을 기본값으로 되돌릴까요?')) return;
    resetData(resource).then(setData);
  }

  if (loading) return null;

  const term = search.trim().toLowerCase();
  const filtered = searchable && term
    ? data.filter((item) => columns.some((col) => col.type !== 'checkbox' && String(item[col.field] ?? '').toLowerCase().includes(term)))
    : data;

  return (
    <section className="card admin-section" style={{ marginTop: 20 }}>
      <div className="chart-title"><div><h2>{title}</h2><small>{data.length}개 항목</small></div></div>
      {subtitle && <p className="page-note">{subtitle}</p>}

      <div className="add-form">
        {columns.map((col) => (
          <label key={col.field} className={col.type === 'checkbox' ? 'checkbox-field' : undefined}>
            {col.type === 'checkbox' ? (
              <>
                <FieldInput col={col} value={newRow[col.field]} onChange={(value) => setNewRow({ ...newRow, [col.field]: value })} />
                {col.label}
              </>
            ) : (
              <>
                {col.label}
                <FieldInput col={col} value={newRow[col.field]} onChange={(value) => setNewRow({ ...newRow, [col.field]: value })} />
              </>
            )}
          </label>
        ))}
      </div>
      <div className="control-row">
        <button type="button" onClick={addRow}>+ 추가</button>
        <button type="button" style={{ background: 'var(--danger)' }} onClick={handleResetClick}>기본값으로 초기화</button>
      </div>

      {searchable && (
        <div className="control-row">
          <label>검색<input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="검색어 입력" /></label>
        </div>
      )}

      <table className="table admin-table" style={{ marginTop: 16 }}>
        <thead>
          <tr>{columns.map((col) => <th key={col.field}>{col.label}</th>)}<th>작업</th></tr>
        </thead>
        <tbody>
          {filtered.map((item) => {
            const trueIndex = data.indexOf(item);
            const isEditing = editingIndex === trueIndex;
            return (
              <tr key={trueIndex}>
                {columns.map((col) => (
                  <td key={col.field}>
                    {isEditing ? (
                      <FieldInput col={col} value={editRow[col.field]} onChange={(value) => setEditRow({ ...editRow, [col.field]: value })} />
                    ) : col.type === 'checkbox' ? (
                      item[col.field] ? '예' : '-'
                    ) : (
                      String(item[col.field])
                    )}
                  </td>
                ))}
                <td className="row-actions">
                  {isEditing ? (
                    <>
                      <button type="button" className="save-btn" onClick={saveEdit}>저장</button>
                      <button type="button" className="cancel-btn" onClick={cancelEdit}>취소</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="edit-btn" onClick={() => startEdit(trueIndex)}>수정</button>
                      <button type="button" className="delete-btn" onClick={() => deleteRow(trueIndex)}>삭제</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default EditableTable;
