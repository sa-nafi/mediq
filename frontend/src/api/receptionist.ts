import { apiClient } from '@/lib/axios';

export const receptionistApi = {
  // Profile
  getProfile: async () => {
    const res = await apiClient.get('/employees/me');
    return res.data;
  },

  // Appointments
  getAppointments: async (params?: { status?: string; sort?: string; limit?: number; page?: number; date?: string; patient_name?: string; doctor_name?: string }) => {
    const res = await apiClient.get('/appointments', { params });
    // Returns paginated object { data: [], total_count, page, limit, total_pages }
    return res.data;
  },
  getAppointmentById: async (id: number) => {
    const res = await apiClient.get(`/appointments/${id}`);
    return res.data;
  },
  updateAppointmentStatus: async (id: number, status: string) => {
    const res = await apiClient.patch(`/appointments/${id}/status`, { status });
    return res.data;
  },
  cancelAppointment: async (id: number) => {
    const res = await apiClient.put(`/appointments/${id}/cancel`);
    return res.data;
  },

  // Patients
  getPatients: async (params?: { limit?: number; page?: number; search?: string }) => {
    const res = await apiClient.get('/patients', { params });
    // Returns paginated object
    return res.data;
  },
  getPatientById: async (id: number) => {
    const res = await apiClient.get(`/patients/${id}`);
    return res.data;
  },
  createWalkInPatient: async (data: { first_name: string; last_name: string; date_of_birth: string; gender?: string; phone?: string; address?: string }) => {
    const res = await apiClient.post('/patients/walk-in', data);
    return res.data;
  },
  bookAppointmentForPatient: async (data: { patient_id: number; doctor_id: number; appointment_date: string; type: string; status?: string; notes?: string }) => {
    const res = await apiClient.post('/appointments/book-for-patient', data);
    return res.data;
  },
};
