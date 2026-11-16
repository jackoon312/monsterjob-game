import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

// Attach the stored token to every request automatically, so individual
// API calls don't need to remember to add the Authorization header themselves.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('monsterjob_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever returns 401 (expired/invalid token), clear the stored
// token so the app falls back to the login screen instead of looping on
// broken requests.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('monsterjob_token');
      localStorage.removeItem('monsterjob_user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
