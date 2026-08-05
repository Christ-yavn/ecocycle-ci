import axios from 'axios';

// Le backend expose ses routes sous le préfixe /api/v1
const API_URL = import.meta.env.VITE_API_URL || 'https://ecoloop-backend-7a6w.onrender.com/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ecoloop_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercepteur pour gérer les erreurs globales (ex: token expiré)
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    // Si l'utilisateur est déconnecté (token invalide/expiré)
    localStorage.removeItem('ecoloop_token');
    // On pourrait rediriger vers /login
  }
  return Promise.reject(error);
});
