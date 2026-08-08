import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Calendar, Clock, XCircle, CheckCircle, Clock3 } from 'lucide-react';
import { toast } from 'sonner';

import { patientApi } from '@/api/patient';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function PatientAppointmentsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['patient', 'appointments'],
    queryFn: () => patientApi.getAppointments(),
  });

  const cancelMutation = useMutation({
    mutationFn: patientApi.cancelAppointment,
    onSuccess: () => {
      toast.success('Appointment cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] });
      setConfirmCancelId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    }
  });

  const handleCancel = (id: number) => {
    setConfirmCancelId(id);
  };

  const filteredAppointments = (appointments as any)?.data?.filter((apt: any) => {
    if (filter === 'upcoming') {
      return apt.status === 'scheduled' && dayjs(apt.appointment_date).isAfter(dayjs().subtract(1, 'day'));
    }
    if (filter === 'past') {
      return apt.status === 'completed' || apt.status === 'cancelled' || dayjs(apt.appointment_date).isBefore(dayjs(), 'day');
    }
    return true;
  }).sort((a: any, b: any) => dayjs(b.appointment_date).diff(dayjs(a.appointment_date))) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My Appointments</h1>
          <p className="text-muted mt-0.5 text-sm">View and manage your appointments.</p>
        </div>
      </div>

      <div className="flex gap-2 bg-surface p-1 rounded-xl w-fit border border-border-light shadow-sm">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === 'upcoming' ? 'bg-secondary text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === 'past' ? 'bg-secondary text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
        >
          Past
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === 'all' ? 'bg-secondary text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
        >
          All
        </button>
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
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((apt: any) => (
              <div key={apt.appointment_id} className="bg-surface rounded-xl p-4 shadow-sm border border-border-light flex flex-col md:flex-row gap-4 md:items-center justify-between hover:border-secondary/30 transition-colors group">
                
                <div className="flex gap-4">
                  <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 border border-secondary/20 group-hover:scale-105 transition-transform">
                    <Calendar className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-foreground">Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}</span>
                      
                      {apt.status === 'scheduled' && <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"><Clock3 className="w-3 h-3"/> Scheduled</span>}
                      {apt.status === 'completed' && <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"><CheckCircle className="w-3 h-3"/> Completed</span>}
                      {apt.status === 'cancelled' && <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200"><XCircle className="w-3 h-3"/> Cancelled</span>}
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
                      <div className="flex items-center gap-1.5 bg-secondary/5 border border-secondary/20 px-2 py-0.5 rounded text-secondary font-bold uppercase tracking-wider text-[10px]">
                        {apt.type}
                      </div>
                    </div>
                    {apt.notes && (
                      <p className="text-[13px] text-foreground/80 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-100 italic">"{apt.notes}"</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {apt.status === 'scheduled' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-lg h-9 px-4"
                      onClick={() => handleCancel(apt.appointment_id)}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>

              </div>
            ))
          ) : (
            <div className="py-12 text-center bg-surface border border-border-light rounded-2xl shadow-sm">
              <Calendar className="h-12 w-12 text-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">No appointments found</h3>
              <p className="text-muted mt-1 text-sm">You have no {filter} appointments.</p>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmCancelId !== null}
        onOpenChange={(open) => !open && setConfirmCancelId(null)}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this appointment?"
        confirmText="Cancel Appointment"
        variant="destructive"
        onConfirm={() => confirmCancelId && cancelMutation.mutate(confirmCancelId)}
        isPending={cancelMutation.isPending}
      />
    </div>
  );
}
