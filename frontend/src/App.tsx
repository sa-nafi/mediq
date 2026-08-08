import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query-client';

import { useAuthStore } from '@/store/auth-store';

import { PublicLayout } from '@/layouts/PublicLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ServicesPage } from '@/pages/ServicesPage';
import { TestsPage } from '@/pages/TestsPage';
import { DoctorsPage } from '@/pages/DoctorsPage';
import { DoctorDetailsPage } from '@/pages/DoctorDetailsPage';
import { HealthLibraryPage } from '@/pages/HealthLibraryPage';
import { AboutPage } from '@/pages/AboutPage';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PatientLayout } from '@/layouts/PatientLayout';
import { PatientDashboard } from '@/pages/patient/Dashboard';
import { PatientDoctorsPage } from '@/pages/patient/DoctorsPage';
import { BookAppointmentPage } from '@/pages/patient/BookAppointmentPage';
import { PatientAppointmentsPage } from '@/pages/patient/Appointments';
import { PatientProfilePage } from '@/pages/patient/ProfilePage';
import { PatientMedicalRecordsPage } from '@/pages/patient/MedicalRecordsPage';
import { PatientPrescriptionsPage } from '@/pages/patient/PrescriptionsPage';
import { PatientTestsPage } from '@/pages/patient/MedicalTestsPage';
import { StaffPortal } from '@/pages/StaffPortal';

import { ReceptionistLayout } from '@/layouts/ReceptionistLayout';
import { ReceptionistDashboard } from '@/pages/receptionist/Dashboard';
import { ReceptionistAppointmentsPage } from '@/pages/receptionist/Appointments';
import { ReceptionistPatientsPage } from '@/pages/receptionist/Patients';
import { ReceptionistQueuePage } from '@/pages/receptionist/Queue';
import { ReceptionistProfilePage } from '@/pages/receptionist/ProfilePage';
import { ReceptionistDoctorsPage } from '@/pages/receptionist/DoctorsPage';
import { ReceptionistBookAppointmentPage } from '@/pages/receptionist/BookAppointmentPage';

import { DoctorLayout } from '@/layouts/DoctorLayout';
import { DoctorDashboard } from '@/pages/doctor/Dashboard';
import { DoctorQueuePage } from '@/pages/doctor/Queue';
import { ConsultationPage } from '@/pages/doctor/ConsultationPage';
import { DoctorPrescriptionsPage } from '@/pages/doctor/PrescriptionsPage';
import { DoctorMedicalRecordsPage } from '@/pages/doctor/MedicalRecordsPage';
import { DoctorMedicalTestsPage } from '@/pages/doctor/MedicalTestsPage';
import { DoctorProfilePage } from '@/pages/doctor/ProfilePage';

import { LabTechLayout } from '@/layouts/LabTechLayout';
import { LabTechDashboard } from '@/pages/lab-tech/Dashboard';
import { LabTechProfilePage } from '@/pages/lab-tech/ProfilePage';


export default function App() {
  const { init, isInitialized } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent"></div>
          <p className="text-sm font-medium text-muted">Loading MediQ...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with Navbar & Footer */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/doctors/:id" element={<DoctorDetailsPage />} />
            <Route path="/health-library" element={<HealthLibraryPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Patient Routes - Protected */}
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route element={<PatientLayout />}>
              <Route path="/patient" element={<PatientDashboard />} />
              <Route path="/patient/doctors" element={<PatientDoctorsPage />} />
              <Route path="/patient/book/:id" element={<BookAppointmentPage />} />
              <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
              <Route path="/patient/profile" element={<PatientProfilePage />} />
              <Route path="/patient/records" element={<PatientMedicalRecordsPage />} />
              <Route path="/patient/prescriptions" element={<PatientPrescriptionsPage />} />
              <Route path="/patient/medical-tests" element={<PatientTestsPage />} />
            </Route>
          </Route>

          {/* Staff Routes - Protected */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'lab_tech']} />}>
            <Route path="/staff" element={<StaffPortal />} />
          </Route>

          {/* Receptionist Routes - Protected */}
          <Route element={<ProtectedRoute allowedRoles={['receptionist', 'admin']} />}>
            <Route element={<ReceptionistLayout />}>
              <Route path="/receptionist" element={<ReceptionistDashboard />} />
              <Route path="/receptionist/appointments" element={<ReceptionistAppointmentsPage />} />
              <Route path="/receptionist/patients" element={<ReceptionistPatientsPage />} />
              <Route path="/receptionist/queue" element={<ReceptionistQueuePage />} />
              <Route path="/receptionist/profile" element={<ReceptionistProfilePage />} />
              <Route path="/receptionist/doctors" element={<ReceptionistDoctorsPage />} />
              <Route path="/receptionist/book/:id" element={<ReceptionistBookAppointmentPage />} />
            </Route>
          </Route>

          {/* Doctor Routes - Protected */}
          <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route element={<DoctorLayout />}>
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/doctor/queue" element={<DoctorQueuePage />} />
              <Route path="/doctor/queue/:appointmentId" element={<ConsultationPage />} />
              <Route path="/doctor/prescriptions" element={<DoctorPrescriptionsPage />} />
              <Route path="/doctor/medical-records" element={<DoctorMedicalRecordsPage />} />
              <Route path="/doctor/medical-tests" element={<DoctorMedicalTestsPage />} />
              <Route path="/doctor/profile" element={<DoctorProfilePage />} />
            </Route>
          </Route>

          {/* Lab Tech Routes - Protected */}
          <Route element={<ProtectedRoute allowedRoles={['lab_tech', 'admin']} />}>
            <Route element={<LabTechLayout />}>
              <Route path="/lab-tech" element={<LabTechDashboard />} />
              <Route path="/lab-tech/profile" element={<LabTechProfilePage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '1rem',
            fontFamily: 'var(--font-sans)',
          },
        }}
      />
    </QueryClientProvider>
  );
}
