import apiClient from './client';

export const getServerTime = async () => {
  const response = await apiClient.get('/api/game/time');
  return response.data;
};

export const calculateOfflineEarnings = async () => {
  const response = await apiClient.post('/api/game/offline-earnings');
  return response.data;
};
