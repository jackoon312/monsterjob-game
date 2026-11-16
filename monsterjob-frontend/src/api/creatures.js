import apiClient from './client';

export const getAllSpecies = async () => {
  const response = await apiClient.get('/api/creatures/species');
  return response.data;
};

export const getMyCreatures = async () => {
  const response = await apiClient.get('/api/creatures');
  return response.data;
};

export const catchCreature = async (creatureSpeciesId, nickname) => {
  const response = await apiClient.post('/api/creatures', { creatureSpeciesId, nickname });
  return response.data;
};

export const releaseCreature = async (creatureId) => {
  const response = await apiClient.delete(`/api/creatures/${creatureId}`);
  return response.data;
};
