/* RouteForge API client. Change API_BASE if your backend runs on another host/port. */
(() => {
  const API_BASE = window.ROUTEFORGE_API_URL || 'https://routeforge-backend2-0.onrender.com/api';
  async function request(path, options = {}) {
    const token = localStorage.getItem('routeforge_token');
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch (_error) {
      throw new Error('Cannot connect to RouteForge API. Start the backend and make sure MongoDB is running.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
  }
  window.RouteForgeAPI = {
    base: API_BASE,
    request,
    async signup(payload) { const data = await request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }); saveSession(data); return data; },
    async login(payload) { const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }); saveSession(data); return data; },
    async me() { return request('/auth/me'); },
    async getUsers() { const d = await request('/admin/users'); d.users = (d.users || []).map(normalizeRecord); return d; },
    async updateUser(id, payload) { return request(`/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) }); },
    async deleteUser(id) { return request(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
    async updateProfile(payload) { return request('/auth/me', { method: 'PUT', body: JSON.stringify(payload) }); },
    async getRoutes(all = false) { const d = await request(`/routes${all ? '?all=true' : ''}`); d.routes = (d.routes || []).map(normalizeRecord); return d; },
    async createRoute(route) { return request('/routes', { method: 'POST', body: JSON.stringify(route) }); },
    async updateRoute(id, route) { return request(`/routes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(route) }); },
    async deleteRoute(id) { return request(`/routes/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
    async getVehicles(all = false) { const d = await request(`/vehicles${all ? '?all=true' : ''}`); d.vehicles = (d.vehicles || []).map(normalizeRecord); return d; },
    async createVehicle(vehicle) { return request('/vehicles', { method: 'POST', body: JSON.stringify(vehicle) }); },
    async updateVehicle(id, vehicle) { return request(`/vehicles/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(vehicle) }); },
    async deleteVehicle(id) { return request(`/vehicles/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
  };
  function normalizeRecord(item) { if (!item) return item; const out = { ...item, id: String(item._id || item.id || ''), userId: String(item.userId?._id || item.userId || '') }; delete out.__v; return out; }
  function saveSession(data) {
    localStorage.setItem('routeforge_token', data.token);
    localStorage.setItem('routeforge_api_user', JSON.stringify(data.user));
    localStorage.setItem('routeforge_current_user', data.user.id);
  }
})();
