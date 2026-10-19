const jsonHeaders = { 'Content-Type': 'application/json' };

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: options.body ? jsonHeaders : undefined,
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const api = {
  config: () => requestJson('/api/config'),
  products: (query = '') => requestJson(`/api/products${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  login: (email, password) => requestJson('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  mode: (mode) => requestJson('/api/mode', { method: 'POST', body: JSON.stringify({ mode }) })
};