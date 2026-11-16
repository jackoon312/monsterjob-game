import apiClient from './client';

export const createAssignment = async (creatureId, jobId) => {
  const response = await apiClient.post('/api/assignments', { creatureId, jobId });
  return response.data;
};

export const getActiveAssignments = async () => {
  const response = await apiClient.get('/api/assignments');
  return response.data;
};

export const completeAssignment = async (assignmentId) => {
  const response = await apiClient.put(`/api/assignments/${assignmentId}`);
  return response.data;
};

export const cancelAssignment = async (assignmentId) => {
  const response = await apiClient.delete(`/api/assignments/${assignmentId}`);
  return response.data;
};
