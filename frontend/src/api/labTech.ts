import { apiClient } from '@/lib/axios';

export const labTechApi = {
  // Profile
  getProfile: async () => {
    const res = await apiClient.get('/employees/me');
    return res.data;
  },

  // Medical Tests
  getMedicalTests: async (params?: { limit?: number; page?: number; status?: string }) => {
    const res = await apiClient.get('/medical-tests', { params });
    return res.data;
  },
  getMedicalTestById: async (id: number) => {
    const res = await apiClient.get(`/medical-tests/${id}`);
    return res.data;
  },
  updateMedicalTestStatus: async (id: number, data: { status: string; result?: string }) => {
    const res = await apiClient.put(`/medical-tests/${id}`, data);
    return res.data;
  },
};
