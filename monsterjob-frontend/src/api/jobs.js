import apiClient from './client';

export const getAllJobs = async () => {
  const response = await apiClient.get('/api/jobs');
  return response.data;
};

export const getRecommendations = async (creatureId) => {
  const response = await apiClient.get(`/api/jobs/recommendations/${creatureId}`);
  return response.data;
};
