async function handleResponse(response) {
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(detail.detail || `요청 실패 (${response.status})`);
  }
  return response.json();
}

export function getData(resource) {
  return fetch(`/api/data/${resource}`).then(handleResponse);
}

export function saveData(resource, value) {
  return fetch(`/api/data/${resource}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  }).then(handleResponse);
}

export function resetData(resource) {
  return fetch(`/api/data/${resource}/reset`, { method: 'POST' }).then(handleResponse);
}
