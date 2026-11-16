import apiClient from './client';

export const getAllAchievements = async () => {
  const response = await apiClient.get('/api/achievements/all');
  return response.data;
};

export const getMyAchievements = async () => {
  const response = await apiClient.get('/api/achievements');
  return response.data;
};

export const checkAchievement = async (achievementId) => {
  const response = await apiClient.post(`/api/achievements/${achievementId}/check`);
  return response.data;
};
