import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, XCircle, Clock3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { toast } from 'sonner';

import { receptionistApi } from '@/api/receptionist';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function ReceptionistDashboard() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [confirmAction, setConfirmAction] = useState<{ id: number; status: string } | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['receptionist', 'profile', user?.id],
    queryFn: () => receptionistApi.getProfile(),
    enabled: !!user?.id,
  });

  const { data: scheduledData, isLoading: isLoadingScheduled } = useQuery({
    queryKey: ['receptionist', 'appointments', 'scheduled_in_queue'],
    queryFn: () => receptionistApi.getAppointments({ status: 'scheduled,in_queue', limit: 100 }),
  });

  const { data: completedData, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ['receptionist', 'appointments', 'completed'],
    queryFn: () => receptionistApi.getAppointments({ status: 'completed', limit: 100 }),
  });

  const { data: cancelledData, isLoading: isLoadingCancelled } = useQuery({
    queryKey: ['receptionist', 'appointments', 'cancelled'],
    queryFn: () => receptionistApi.getAppointments({ status: 'cancelled', limit: 100 }),
  });

  const isLoading = isLoadingScheduled || isLoadingCompleted || isLoadingCancelled;

  const today = dayjs().startOf('day');

  // Filter for today
  const todayScheduled = (scheduledData?.data || []).filter((apt: any) => dayjs(apt.appointment_date).isSame(today, 'day'));
  const todayCompleted = (completedData?.data || []).filter((apt: any) => dayjs(apt.appointment_date).isSame(today, 'day'));
  const todayCancelled = (cancelledData?.data || []).filter((apt: any) => dayjs(apt.appointment_date).isSame(today, 'day'));

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => receptionistApi.updateAppointmentStatus(id, status),
    onSuccess: () => {
      toast.success('Appointment status updated');
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] });
      setConfirmAction(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });

  const handleStatusChange = (id: number, status: string) => {
    setConfirmAction({ id, status });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {profile?.first_name ? `Welcome, ${profile.first_name}` : 'Good morning, Receptionist'}
          </h1>
          <p className="text-muted mt-0.5 text-sm">Here is today's operational overview.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-sm">
          <p className="text-muted">Loading dashboard...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light flex items-center gap-4 hover:border-secondary/30 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-0.5">Today's Appointments</p>
                <h3 className="text-xl font-extrabold text-primary">{todayScheduled.length + todayCompleted.length + todayCancelled.length}</h3>
              </div>
            </div>

            <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light flex items-center gap-4 hover:border-emerald-200 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-0.5">Completed</p>
                <h3 className="text-xl font-extrabold text-primary">{todayCompleted.length}</h3>
              </div>
            </div>

            <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light flex items-center gap-4 hover:border-red-200 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-0.5">Cancelled</p>
                <h3 className="text-xl font-extrabold text-primary">{todayCancelled.length}</h3>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border-light bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" /> Today's Scheduled Appointments
              </h2>
              <Link to="/receptionist/queue" className="text-xs text-secondary hover:underline font-bold uppercase tracking-wider">View Queue</Link>
            </div>

            <div className="space-y-3">
              {todayScheduled.length > 0 ? (
                todayScheduled.sort((a: any, b: any) => a.serial_number - b.serial_number).map((apt: any) => (
                  <div key={apt.appointment_id} className="bg-background rounded-xl p-4 shadow-sm border border-border-light flex flex-col md:flex-row gap-4 md:items-center justify-between hover:border-secondary/30 transition-colors group">
                    <div className="flex gap-4">
                      <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 border border-secondary/20 font-bold text-secondary text-lg">
                        #{apt.serial_number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-bold text-foreground">{apt.patient?.first_name} {apt.patient?.last_name}</span>
                          <span className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                            apt.status === 'in_queue' 
                              ? 'text-indigo-700 bg-indigo-50 border-indigo-200' 
                              : 'text-blue-700 bg-blue-50 border-blue-200'
                          }`}>
                            {apt.status === 'in_queue' ? 'In Queue' : 'Scheduled'}
                          </span>
                        </div>

                        <div className="text-[13px] text-muted flex flex-wrap items-center gap-3 mt-1.5 font-medium">
                          <div className="flex items-center gap-1.5 bg-secondary/5 border border-secondary/20 px-2 py-0.5 rounded text-secondary font-bold uppercase tracking-wider text-[10px]">
                            Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}
                          </div>
                          <div className="flex items-center gap-1.5 bg-secondary/5 border border-secondary/20 px-2 py-0.5 rounded text-secondary font-bold uppercase tracking-wider text-[10px]">
                            {apt.type}
                          </div>
                          {apt.notes && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
                              "{apt.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 rounded-lg h-9 px-4"
                        onClick={() => handleStatusChange(apt.appointment_id, 'completed')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Complete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 rounded-lg h-9 px-4"
                        onClick={() => handleStatusChange(apt.appointment_id, 'no_show')}
                        disabled={updateStatusMutation.isPending}
                      >
                        No-show
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-background rounded-xl border border-border-light">
                  <p className="text-muted text-sm">No scheduled appointments for today.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Update Status"
        description={`Are you sure you want to mark this appointment as ${confirmAction?.status.replace('_', '-')}?`}
        variant={confirmAction?.status === 'cancelled' || confirmAction?.status === 'no_show' ? 'destructive' : 'default'}
        onConfirm={() => {
          if (confirmAction) {
            updateStatusMutation.mutate(confirmAction);
          }
        }}
        isPending={updateStatusMutation.isPending}
      />
    </div>
  );
}
