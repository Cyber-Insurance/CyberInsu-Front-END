import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isAuthRoute = err.config?.url?.includes('/auth/');
      if (!isAuthRoute) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyMfa: (data) => api.post('/auth/verify-mfa', data),
  setupMfa: () => api.post('/auth/setup-mfa'),
  confirmMfa: (data) => api.post('/auth/confirm-mfa', data),
  disableMfa: (data) => api.post('/auth/disable-mfa', data),
  me: () => api.get('/auth/me'),
};

export default api;
