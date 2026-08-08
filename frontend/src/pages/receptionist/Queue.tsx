import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ListOrdered, CheckCircle, Clock3, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { receptionistApi } from '@/api/receptionist';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function ReceptionistQueuePage() {
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{ id: number; status: string } | null>(null);
  const [doctorName, setDoctorName] = useState('');

  const { data: appointmentsData, isLoading, error } = useQuery({
    queryKey: ['receptionist', 'appointments', 'scheduled'],
    queryFn: () => receptionistApi.getAppointments({
      status: 'scheduled',
      limit: 100 // fetch all for queue view
    }),
  });

  const today = dayjs().startOf('day');

  // Filter for today and sort by serial number
  const queue = (appointmentsData?.data || [])
    .filter((apt: any) => dayjs(apt.appointment_date).isSame(today, 'day'))
    .filter((apt: any) => {
      if (!doctorName) return true;
      const docFullName = `${apt.doctor?.first_name || ''} ${apt.doctor?.last_name || ''}`.toLowerCase();
      return docFullName.includes(doctorName.toLowerCase());
    })
    .sort((a: any, b: any) => a.serial_number - b.serial_number);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => receptionistApi.updateAppointmentStatus(id, status),
    onSuccess: () => {
      toast.success('Queue updated');
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] });
      setConfirmAction(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update queue');
    }
  });

  const handleStatusChange = (id: number, status: string) => {
    setConfirmAction({ id, status });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Today's Queue</h1>
          <p className="text-muted mt-0.5 text-sm">Manage the active queue for today's appointments.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input 
          type="text" 
          placeholder="Filter by doctor name..." 
          className="flex-1 max-w-sm bg-surface border border-border-light rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
        />
        {doctorName && (
          <Button variant="outline" onClick={() => setDoctorName('')} className="h-[38px] px-4 rounded-xl border-border-light text-muted hover:text-foreground hover:bg-surface">
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-sm">
          <p className="text-muted text-sm font-medium">Loading queue...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-red-600 gap-2 shadow-sm">
          <AlertTriangle className="h-8 w-8 opacity-80" />
          <p className="text-base font-bold">Failed to load the queue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.length > 0 ? (
            queue.map((apt: any, index: number) => (
              <div
                key={apt.appointment_id}
                className={`bg-surface rounded-xl p-4 shadow-sm border flex flex-col md:flex-row gap-4 md:items-center justify-between hover:border-secondary/30 transition-colors group ${index === 0 ? 'border-secondary/50 shadow-md ring-1 ring-secondary/20' : 'border-border-light'}`}
              >
                <div className="flex gap-4">
                  <div className={`hidden sm:flex h-12 w-12 items-center justify-center rounded-xl border font-bold text-lg ${index === 0 ? 'bg-secondary text-white border-secondary shadow-sm' : 'bg-secondary/10 border-secondary/20 text-secondary'}`}>
                    #{apt.serial_number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-foreground">
                        {apt.patient?.first_name} {apt.patient?.last_name}
                      </span>
                      {index === 0 && (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-white bg-emerald-500 px-2 py-0.5 rounded shadow-sm">
                          Next in line
                        </span>
                      )}
                    </div>

                    <div className="text-[13px] text-muted flex flex-wrap items-center gap-3 mt-1.5 font-medium">
                      <div className="flex items-center gap-1.5 bg-background border border-border-light px-2 py-0.5 rounded">
                        <Clock3 className="h-3.5 w-3.5" />
                        {dayjs(apt.appointment_date).format('h:mm A')}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 rounded-lg h-9 px-4"
                    onClick={() => handleStatusChange(apt.appointment_id, 'completed')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Complete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 rounded-lg h-9 px-4"
                    onClick={() => handleStatusChange(apt.appointment_id, 'no_show')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1.5" /> No-show
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center bg-surface border border-border-light rounded-2xl shadow-sm">
              <ListOrdered className="h-12 w-12 text-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">Queue is empty</h3>
              <p className="text-muted mt-1 text-sm">There are no more scheduled appointments for today.</p>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Update Queue Status"
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
