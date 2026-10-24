import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dj_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dj_token');
      localStorage.removeItem('dj_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Scans
export const scansApi = {
  getAll: (params) => api.get('/scans', { params }),
  getById: (id) => api.get(`/scans/${id}`),
  create: (data) => api.post('/scans', data),
  delete: (id) => api.delete(`/scans/${id}`),
  getStats: () => api.get('/scans/stats'),
};

// Cleanup Plans
export const cleanupApi = {
  getAll: (params) => api.get('/cleanup-plans', { params }),
  create: (data) => api.post('/cleanup-plans', data),
  getById: (id) => api.get(`/cleanup-plans/${id}`),
  update: (id, data) => api.patch(`/cleanup-plans/${id}`, data),
  delete: (id) => api.delete(`/cleanup-plans/${id}`),
};

// Activity
export const activityApi = {
  getAll: (params) => api.get('/activity', { params }),
};

// AI
export const aiApi = {
  getStatus: () => api.get('/ai/status'),
  analyzeFiles: (files) => api.post('/ai/analyze', { files }),
  suggestOrganization: (files) => api.post('/ai/suggest-organization', { files }),
};

// Settings
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.patch('/settings', data),
};
