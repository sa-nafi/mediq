import { Link } from 'react-router-dom';
import { Calendar, Activity, Pill, Clock, AlertCircle, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { patientApi } from '@/api/patient';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

export function PatientDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: profile } = useQuery({
    queryKey: ['patient', 'profile', user?.id],
    queryFn: () => patientApi.getProfile(),
    enabled: !!user?.id,
  });
  const { data: upcomingData, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['patient', 'appointments', 'upcoming_count'],
    queryFn: () => patientApi.getAppointments({ status: 'scheduled,in_queue', limit: 1 }),
  });

  const { data: completedData, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ['patient', 'appointments', 'completed_count'],
    queryFn: () => patientApi.getAppointments({ status: 'completed', limit: 1 }),
  });

  const { data: nextAppointmentData, isLoading: isLoadingNext, error } = useQuery({
    queryKey: ['patient', 'appointments', 'next'],
    queryFn: () => patientApi.getAppointments({ status: 'scheduled,in_queue', sort: 'asc', limit: 1 }),
  });

  const upcomingCount = upcomingData?.total_count || 0;
  const completedCount = completedData?.total_count || 0;
  const nextAppointment = nextAppointmentData?.data?.[0];
  const isLoading = isLoadingUpcoming || isLoadingCompleted || isLoadingNext;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {profile?.first_name ? `Welcome, ${profile.first_name}` : 'Welcome to your Portal'}
          </h1>
          <p className="text-muted mt-0.5 text-sm">Here is a summary of your health information.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-sm">
          <p className="text-muted">Loading your dashboard...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-red-600 gap-2 shadow-sm">
          <AlertCircle className="h-6 w-6" />
          <p>We couldn't load your information right now.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light flex items-center gap-4 hover:border-secondary/30 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <Calendar className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-0.5">Upcoming</p>
                <h3 className="text-xl font-extrabold text-primary">{upcomingCount}</h3>
              </div>
            </div>
            
            <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light flex items-center gap-4 hover:border-emerald-200 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Clock className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-0.5">Completed Visits</p>
                <h3 className="text-xl font-extrabold text-primary">{completedCount}</h3>
              </div>
            </div>

            <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light flex items-center gap-4 hover:border-amber-200 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Activity className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-0.5">Quick Actions</p>
                <Link to="/patient/doctors" className="text-sm font-bold text-secondary hover:underline">Book New &rarr;</Link>
              </div>
            </div>
          </div>

          {/* Upcoming Appointment Widget */}
          <div className="col-span-1 md:col-span-2 rounded-2xl border border-border-light bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Next Appointment
              </h2>
              <Link to="/patient/appointments" className="text-xs text-secondary hover:underline font-bold uppercase tracking-wider">View all</Link>
            </div>
            
            {nextAppointment ? (
              <div className="rounded-xl bg-background border border-border-light p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-secondary/30 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider border border-secondary/20">
                      {nextAppointment.type}
                    </span>
                    <span className="text-xs font-medium text-muted bg-surface px-2 py-0.5 rounded border border-border-light">
                      {dayjs(nextAppointment.appointment_date).format('MMMM D, YYYY')}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground text-sm">Dr. {nextAppointment.doctor?.first_name} {nextAppointment.doctor?.last_name}</h3>
                  <p className="text-[11px] font-medium text-muted mt-0.5">Serial No. {nextAppointment.serial_number}</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-lg text-xs" asChild>
                  <Link to="/patient/appointments">Details</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 bg-background rounded-xl border border-border-light">
                <p className="text-muted text-sm mb-3">No upcoming appointments scheduled.</p>
                <Button variant="accent" size="sm" className="rounded-lg" asChild>
                  <Link to="/patient/doctors">Book an Appointment</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Shortcuts */}
          <div className="col-span-1 rounded-2xl border border-border-light bg-surface p-5 shadow-sm flex flex-col">
            <h2 className="text-base font-extrabold text-foreground mb-4">Shortcuts</h2>
            <div className="flex flex-col gap-2 flex-1 justify-center">
              <Link to="/patient/records" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-background transition-colors border border-transparent hover:border-border-light hover:shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm text-foreground/80">Medical Records</span>
              </Link>
              <Link to="/patient/medical-tests" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-background transition-colors border border-transparent hover:border-border-light hover:shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-50 text-purple-600 shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm text-foreground/80">Test Results</span>
              </Link>
              <Link to="/patient/prescriptions" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-background transition-colors border border-transparent hover:border-border-light hover:shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-50 text-rose-600 shrink-0">
                  <Pill className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm text-foreground/80">Prescriptions</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
