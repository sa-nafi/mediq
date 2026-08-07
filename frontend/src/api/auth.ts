import { apiClient } from '@/lib/axios';

export const authApi = {
  login: async (credentials: Record<string, string>) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (patientData: Record<string, any>) => {
    const response = await apiClient.post('/auth/register', patientData);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }
};
