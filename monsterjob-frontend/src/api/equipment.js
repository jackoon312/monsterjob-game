import apiClient from './client';

export const getAllEquipment = async () => {
  const response = await apiClient.get('/api/equipment');
  return response.data;
};

export const getMyInventory = async () => {
  const response = await apiClient.get('/api/equipment/inventory');
  return response.data;
};

export const purchaseEquipment = async (equipmentId) => {
  const response = await apiClient.post(`/api/equipment/purchase/${equipmentId}`);
  return response.data;
};

export const getCreatureEquipment = async (creatureId) => {
  const response = await apiClient.get(`/api/creatures/${creatureId}/equipment`);
  return response.data;
};

export const equipItem = async (creatureId, slot, equipmentId) => {
  const response = await apiClient.put(`/api/creatures/${creatureId}/equipment/${slot}`, { equipmentId });
  return response.data;
};

export const unequipItem = async (creatureId, slot) => {
  const response = await apiClient.delete(`/api/creatures/${creatureId}/equipment/${slot}`);
  return response.data;
};
