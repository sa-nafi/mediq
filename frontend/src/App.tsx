import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { PublicLayout } from '@/layouts/PublicLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { PatientPortal } from '@/pages/PatientPortal';
import { StaffPortal } from '@/pages/StaffPortal';
import { ServicesPage } from '@/pages/ServicesPage';
import { TestsPage } from '@/pages/TestsPage';
import { DoctorsPage } from '@/pages/DoctorsPage';
import { DoctorDetailsPage } from '@/pages/DoctorDetailsPage';
import { HealthLibraryPage } from '@/pages/HealthLibraryPage';
import { AboutPage } from '@/pages/AboutPage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/doctors/:id" element={<DoctorDetailsPage />} />
            <Route path="/health-library" element={<HealthLibraryPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/patient" element={<PatientPortal />} />
            <Route path="/staff" element={<StaffPortal />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
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
