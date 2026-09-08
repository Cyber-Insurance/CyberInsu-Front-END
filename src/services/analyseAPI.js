import api from './api';

export const analyseAPI = {
  // Disponibilité du service et fournisseur actif (mock / anthropic / openai)
  getStatus: () => api.get('/analyse/status'),

  // Déclenche l'analyse d'un document — traitement en tâche de fond
  lancer: (idDocument) => api.post(`/analyse/documents/${idDocument}`),

  // État et résultat d'un document (endpoint de polling)
  getAnalyseDocument: (idDocument) => api.get(`/analyse/documents/${idDocument}`),

  // Analyses d'un dossier + score documentaire consolidé
  getAnalysesDossier: (idDossier) => api.get(`/analyse/dossiers/${idDossier}`),

  // Supervision (admin) : appels, tokens, latence
  getStats: () => api.get('/analyse/stats'),
};

export default analyseAPI;
