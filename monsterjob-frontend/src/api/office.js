import apiClient from './client';

export const getOffice = async () => {
  const response = await apiClient.get('/api/office');
  return response.data;
};

export const getOfficeStatus = async () => {
  const response = await apiClient.get('/api/office/status');
  return response.data;
};

export const startOrFinalizeUpgrade = async () => {
  const response = await apiClient.put('/api/office/upgrade');
  return response.data;
};

export const cancelUpgrade = async () => {
  const response = await apiClient.delete('/api/office/upgrade');
  return response.data;
};
