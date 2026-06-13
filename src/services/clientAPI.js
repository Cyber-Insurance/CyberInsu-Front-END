import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const clientAPI = {
  getDossier: () => api.get('/client/dossier'),

  getQuestionnaire: () => api.get('/client/questionnaire'),
  evaluateQuestionnaire: (reponses) =>
    api.post('/client/questionnaire/evaluate', { reponses }),
  soumettreQuestionnaire: (reponses) =>
    api.post('/client/questionnaire/soumettre', { reponses }),

  getDocuments: () => api.get('/client/documents'),
  uploadDocument: (file, typeDoc = 'autre') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type_doc', typeDoc);
    return api.post('/client/documents', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getDevis: () => api.get('/client/devis'),
};
