import api from './api';

export const assureurAPI = {
  getStats: () => api.get('/assureur/stats'),
  getDossiers: (params) => api.get('/assureur/dossiers', { params }),
  getDossier: (id) => api.get(`/assureur/dossiers/${id}`),
  getScore: (dossierId) => api.get(`/assureur/dossiers/${dossierId}/score`),
  getDevis: (params) => api.get('/assureur/devis', { params }),
  validerDevis: (id) => api.put(`/assureur/devis/${id}/valider`),
  rejeterDevis: (id, motif) => api.put(`/assureur/devis/${id}/rejeter`, { motif }),
};
