import { apiClient } from '@/lib/axios';

export const doctorApi = {
  // Profile
  getProfile: async () => {
    const res = await apiClient.get('/employees/me');
    return res.data;
  },

  // Queue & Appointments
  getQueue: async (params?: { date?: string; status?: string; limit?: number; page?: number }) => {
    const res = await apiClient.get('/appointments', { params });
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

  // Patients (Read-only for consultation)
  getPatientById: async (id: number) => {
    const res = await apiClient.get(`/patients/${id}`);
    return res.data;
  },

  // Medical Records
  getMedicalRecords: async (params?: { patient_id?: number; consultation_appointment_id?: number; limit?: number; page?: number }) => {
    const res = await apiClient.get('/medical-records', { params });
    return res.data;
  },
  getMedicalRecordById: async (id: number) => {
    const res = await apiClient.get(`/medical-records/${id}`);
    return res.data;
  },
  createMedicalRecord: async (data: { patient_id: number; appointment_id?: number; diagnosis?: string; treatment?: string; notes?: string }) => {
    const res = await apiClient.post('/medical-records', data);
    return res.data;
  },

  // Prescriptions
  getPrescriptions: async (params?: { doctor_id?: number; patient_id?: number; consultation_appointment_id?: number; limit?: number; page?: number }) => {
    const res = await apiClient.get('/prescriptions', { params });
    return res.data;
  },
  getPrescriptionById: async (id: number) => {
    const res = await apiClient.get(`/prescriptions/${id}`);
    return res.data;
  },
  createPrescription: async (data: { record_id: number; appointment_id?: number; instructions?: string; items: any[] }) => {
    const res = await apiClient.post('/prescriptions', data);
    return res.data;
  },

  // Medical Tests
  getMedicalTests: async (params?: { limit?: number; page?: number; status?: string; patient_id?: number; consultation_appointment_id?: number }) => {
    const res = await apiClient.get('/medical-tests', { params });
    return res.data;
  },
  getMedicalTestById: async (id: number) => {
    const res = await apiClient.get(`/medical-tests/${id}`);
    return res.data;
  },
  orderMedicalTest: async (data: { record_id: number; patient_id: number; appointment_id?: number; test_name: string; test_date?: string; test_details?: string }) => {
    const res = await apiClient.post('/medical-tests', data);
    return res.data;
  },

  // Medicines (for Autocomplete)
  getMedicines: async (params?: { search?: string; limit?: number; page?: number }) => {
    const res = await apiClient.get('/medicines', { params });
    return res.data;
  },
};
