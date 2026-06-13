import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const courtierAPI = {
  getStats: () => api.get('/courtier/stats'),

  getDossiers: (params) => api.get('/courtier/dossiers', { params }),
  getDossier: (id) => api.get(`/courtier/dossiers/${id}`),
  createDossier: (data) => api.post('/courtier/dossiers', data),
  soumettreDossier: (id) => api.put(`/courtier/dossiers/${id}/soumettre`),
  demanderDevis: (id) => api.post(`/courtier/dossiers/${id}/demander-devis`),

  getClients: () => api.get('/courtier/clients'),
  inviterClient: (data) => api.post('/courtier/clients/inviter', data),
};
