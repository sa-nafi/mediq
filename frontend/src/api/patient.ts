import { apiClient } from '@/lib/axios';

export const patientApi = {
  // Appointments
  getAppointments: async (params?: { status?: string; sort?: string; limit?: number; page?: number }) => {
    const res = await apiClient.get('/appointments', { params });
    // Return the full paginated response so callers can access total_count
    return res.data;
  },
  getAppointmentById: async (id: number) => {
    const res = await apiClient.get(`/appointments/${id}`);
    return res.data;
  },
  bookAppointment: async (data: { doctor_id: number; appointment_date: string; type: string }) => {
    const res = await apiClient.post('/appointments', data);
    return res.data;
  },
  cancelAppointment: async (id: number) => {
    const res = await apiClient.put(`/appointments/${id}/cancel`);
    return res.data;
  },

  // Profile
  getProfile: async () => {
    const res = await apiClient.get('/patients/me');
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await apiClient.put('/patients/me', data);
    return res.data;
  },

  // Doctors
  getDoctors: async (params?: { limit?: number; page?: number; offset?: number }) => {
    const res = await apiClient.get('/doctors', { params });
    return res.data.data || res.data;
  },
  getDoctorSchedules: async (doctorId: number) => {
    const res = await apiClient.get(`/doctors/${doctorId}/schedules`);
    return res.data;
  },
  getDoctorAvailability: async (doctorId: number, date: string) => {
    const res = await apiClient.get(`/doctors/${doctorId}/availability`);
    const availableDates = res.data.available_dates || [];
    return availableDates.includes(date);
  },

  // Records & Tests
  getMedicalRecords: async (params?: { limit?: number; page?: number }) => {
    const res = await apiClient.get('/medical-records', { params });
    return res.data; // Now returns paginated object { data: [], total_count, ... }
  },
  getTests: async (params?: { limit?: number; page?: number }) => {
    const res = await apiClient.get('/medical-tests', { params });
    return res.data; // Returns paginated object { data: [], total_count, page, limit, total_pages }
  },
  getMedicalRecordById: async (id: number) => {
    const res = await apiClient.get(`/medical-records/${id}`);
    return res.data;
  },
  getTestById: async (id: number) => {
    const res = await apiClient.get(`/medical-tests/${id}`);
    return res.data;
  },

  // Prescriptions
  getPrescriptions: async (params?: { limit?: number; page?: number }) => {
    const res = await apiClient.get('/prescriptions', { params });
    return res.data; // Returns paginated object { data: [], total_count, page, limit, total_pages }
  },
  getPrescriptionById: async (id: number) => {
    const res = await apiClient.get(`/prescriptions/${id}`);
    return res.data;
  },
};
