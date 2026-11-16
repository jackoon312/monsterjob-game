import apiClient from './client';

export const register = async (username, email, password) => {
  const response = await apiClient.post('/api/auth/register', { username, email, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await apiClient.post('/api/auth/login', { email, password });
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
};
