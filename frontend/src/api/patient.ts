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
  getDoctors: async () => {
    const res = await apiClient.get('/doctors');
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
  getMedicalRecords: async () => {
    const res = await apiClient.get('/medical-records');
    return res.data.data || res.data; // medical records is currently not paginated, so res.data will be the array
  },
  getTests: async () => {
    const res = await apiClient.get('/medical-tests');
    return res.data.data || res.data;
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
  getPrescriptions: async () => {
    const res = await apiClient.get('/prescriptions');
    return res.data.data || res.data;
  },
  getPrescriptionById: async (id: number) => {
    const res = await apiClient.get(`/prescriptions/${id}`);
    return res.data;
  },

  // Medicines
  getMedicines: async (search?: string) => {
    const url = search ? `/medicines?search=${encodeURIComponent(search)}` : '/medicines';
    const res = await apiClient.get(url);
    return res.data.data || res.data;
  },
  getMedicineById: async (id: number) => {
    const res = await apiClient.get(`/medicines/${id}`);
    return res.data;
  },
};
