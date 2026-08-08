import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Calendar, Clock, XCircle, CheckCircle, Clock3, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { receptionistApi } from '@/api/receptionist';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useDebounce } from '@/hooks/use-debounce';

export function ReceptionistAppointmentsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'all'>('scheduled');
  const [page, setPage] = useState(1);
  const [patientName, setPatientName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [date, setDate] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ id: number; status?: string; type: 'status' | 'cancel' } | null>(null);

  const debouncedPatientName = useDebounce(patientName, 500);
  const debouncedDoctorName = useDebounce(doctorName, 500);

  const { data: appointmentsData, isLoading, error } = useQuery({
    queryKey: ['receptionist', 'appointments', filter, page, debouncedPatientName, debouncedDoctorName, date],
    queryFn: () => receptionistApi.getAppointments({
      status: filter === 'all' ? undefined : filter,
      page,
      limit: 10,
      patient_name: debouncedPatientName || undefined,
      doctor_name: debouncedDoctorName || undefined,
      date: date || undefined
    }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => receptionistApi.updateAppointmentStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] });
      setConfirmAction(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: receptionistApi.cancelAppointment,
    onSuccess: () => {
      toast.success('Appointment cancelled');
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] });
      setConfirmAction(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    }
  });

  const handleStatusChange = (id: number, status: string) => {
    setConfirmAction({ id, status, type: 'status' });
  };

  const handleCancel = (id: number) => {
    setConfirmAction({ id, type: 'cancel' });
  };

  const appointments = appointmentsData?.data || [];
  const totalPages = appointmentsData?.total_pages || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"><Clock3 className="w-3 h-3" /> Scheduled</span>;
      case 'completed':
        return <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'cancelled':
        return <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200"><XCircle className="w-3 h-3" /> Cancelled</span>;
      case 'no_show':
        return <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"><AlertTriangle className="w-3 h-3" /> No-show</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Appointments</h1>
          <p className="text-muted mt-0.5 text-sm">Manage all patient appointments.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-surface p-1 rounded-xl w-fit border border-border-light shadow-sm">
        {['scheduled', 'completed', 'cancelled', 'no_show', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f as any); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${filter === f ? 'bg-secondary text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
          >
            {f.replace('_', '-')}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <input 
          type="text" 
          placeholder="Filter by patient name..." 
          className="flex-1 min-w-[200px] bg-surface border border-border-light rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
          value={patientName}
          onChange={(e) => { setPatientName(e.target.value); setPage(1); }}
        />
        <input 
          type="text" 
          placeholder="Filter by doctor name..." 
          className="flex-1 min-w-[200px] bg-surface border border-border-light rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
          value={doctorName}
          onChange={(e) => { setDoctorName(e.target.value); setPage(1); }}
        />
        <input 
          type="date" 
          className="flex-1 min-w-[200px] bg-surface border border-border-light rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
          value={date}
          onChange={(e) => { setDate(e.target.value); setPage(1); }}
        />
        {(patientName || doctorName || date) && (
          <Button variant="outline" onClick={() => { setPatientName(''); setDoctorName(''); setDate(''); setPage(1); }} className="h-[38px] px-4 rounded-xl border-border-light text-muted hover:text-foreground hover:bg-surface">
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-sm">
          <p className="text-muted text-sm font-medium">Loading appointments...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-red-600 gap-2 shadow-sm">
          <XCircle className="h-8 w-8 opacity-80" />
          <p className="text-base font-bold">Failed to load appointments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.length > 0 ? (
            appointments.map((apt: any) => (
              <div key={apt.appointment_id} className="bg-surface rounded-xl p-4 shadow-sm border border-border-light flex flex-col md:flex-row gap-4 md:items-center justify-between hover:border-secondary/30 transition-colors group">

                <div className="flex gap-4">
                  <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 border border-secondary/20 group-hover:scale-105 transition-transform">
                    <Calendar className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-foreground">{apt.patient?.first_name} {apt.patient?.last_name}</span>
                      {getStatusBadge(apt.status)}
                    </div>

                    <div className="text-[13px] text-muted flex flex-wrap items-center gap-3 mt-1.5 font-medium">
                      <div className="flex items-center gap-1.5 bg-background border border-border-light px-2 py-0.5 rounded">
                        <Calendar className="h-3.5 w-3.5" />
                        {dayjs(apt.appointment_date).format('MMMM D, YYYY')}
                      </div>
                      <div className="flex items-center gap-1.5 bg-background border border-border-light px-2 py-0.5 rounded">
                        <Clock className="h-3.5 w-3.5" />
                        Serial: {apt.serial_number}
                      </div>
                      <div className="flex items-center gap-1.5 bg-background border border-border-light px-2 py-0.5 rounded">
                        Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}
                      </div>
                      <div className="flex items-center gap-1.5 bg-secondary/5 border border-secondary/20 px-2 py-0.5 rounded text-secondary font-bold uppercase tracking-wider text-[10px]">
                        {apt.type}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {apt.status === 'scheduled' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 rounded-lg h-9 px-3"
                        onClick={() => handleStatusChange(apt.appointment_id, 'completed')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Complete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 rounded-lg h-9 px-3"
                        onClick={() => handleStatusChange(apt.appointment_id, 'no_show')}
                        disabled={updateStatusMutation.isPending}
                      >
                        No-show
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-lg h-9 px-3"
                        onClick={() => handleCancel(apt.appointment_id)}
                        disabled={cancelMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center bg-surface border border-border-light rounded-2xl shadow-sm">
              <Calendar className="h-12 w-12 text-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">No appointments found</h3>
              <p className="text-muted mt-1 text-sm">No appointments matching the selected filter.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted font-medium">Page {page} of {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.type === 'cancel' ? 'Cancel Appointment' : 'Update Status'}
        description={
          confirmAction?.type === 'cancel'
            ? 'Are you sure you want to cancel this appointment?'
            : `Are you sure you want to mark this appointment as ${confirmAction?.status?.replace('_', '-')}?`
        }
        confirmText={confirmAction?.type === 'cancel' ? 'Cancel Appointment' : 'Confirm'}
        variant={confirmAction?.type === 'cancel' ? 'destructive' : 'default'}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.type === 'cancel') {
            cancelMutation.mutate(confirmAction.id);
          } else if (confirmAction.status) {
            updateStatusMutation.mutate({ id: confirmAction.id, status: confirmAction.status });
          }
        }}
        isPending={updateStatusMutation.isPending || cancelMutation.isPending}
      />
    </div>
  );
}
