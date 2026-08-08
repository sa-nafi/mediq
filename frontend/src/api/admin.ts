import { apiClient } from '@/lib/axios';

export const adminApi = {
  // Profile
  getProfile: async () => {
    const res = await apiClient.get('/employees/me');
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: { cursor?: string; limit?: number; action?: string; table?: string; user_id?: string }) => {
    const res = await apiClient.get('/admin/audit-logs', { params });
    // Returns { data: [], next_cursor }
    return res.data;
  },
  getAuditLogById: async (id: number) => {
    const res = await apiClient.get(`/admin/audit-logs/${id}`);
    return res.data;
  },

  // Employees (Receptionists, Lab Techs)
  getEmployees: async (params?: { role?: string; search?: string; limit?: number; page?: number }) => {
    const res = await apiClient.get('/employees', { params });
    return res.data;
  },
  updateEmployee: async (id: number, data: any) => {
    const res = await apiClient.put(`/employees/${id}`, data);
    return res.data;
  },
  deleteEmployee: async (id: number) => {
    const res = await apiClient.delete(`/employees/${id}`);
    return res.data;
  },

  // Doctors
  getDoctors: async (params?: { department_id?: number; search?: string; limit?: number; page?: number }) => {
    const res = await apiClient.get('/doctors', { params });
    return res.data;
  },
  updateDoctor: async (id: number, data: any) => {
    const res = await apiClient.put(`/doctors/${id}`, data);
    return res.data;
  },
  deleteDoctor: async (id: number) => {
    const res = await apiClient.delete(`/doctors/${id}`);
    return res.data;
  },

  // Patients
  getPatients: async (params?: { search?: string; limit?: number; page?: number }) => {
    const res = await apiClient.get('/patients', { params });
    return res.data;
  },
  updatePatient: async (id: number, data: any) => {
    const res = await apiClient.put(`/patients/${id}`, data);
    return res.data;
  },
};
