import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Intercepteur pour les réponses
api.interceptors.response.use(response => {
  const newToken = response.headers['authorization']?.split(' ')[1];
  if (newToken) {
    localStorage.setItem('token', newToken);
  }
  return response;
}, error => {
  if (error.response?.status === 401 || error.response?.status === 403) {
    localStorage.removeItem('token');
    window.location.href = '/connexion';
  }
  return Promise.reject(error);
});

export default api;
