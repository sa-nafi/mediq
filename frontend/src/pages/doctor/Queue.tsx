import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, ChevronRight, Stethoscope } from 'lucide-react';
import { doctorApi } from '@/api/doctor';
import { Button } from '@/components/ui/button';

export function DoctorQueuePage() {
  const navigate = useNavigate();
  const today = dayjs().format('YYYY-MM-DD');
  
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['doctor', 'queue', today],
    queryFn: () => doctorApi.getQueue({ date: today, limit: 100 }), // Get all today's appointments
  });

  const appointments = appointmentsData?.data || [];
  
  // Sort by serial number, putting in_queue first, then scheduled
  const sortedAppointments = [...appointments].sort((a: any, b: any) => {
    // 1. in_queue always comes before anything else
    if (a.status === 'in_queue' && b.status !== 'in_queue') return -1;
    if (a.status !== 'in_queue' && b.status === 'in_queue') return 1;
    
    // 2. scheduled comes next
    if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
    if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
    
    // 3. Otherwise sort by serial
    return a.serial_number - b.serial_number;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Today's Queue</h1>
          <p className="text-muted mt-0.5 text-sm">{dayjs().format('dddd, MMMM D, YYYY')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-sm">
          <p className="text-muted text-sm font-medium">Loading queue...</p>
        </div>
      ) : sortedAppointments.length > 0 ? (
        <div className="space-y-3">
          {sortedAppointments.map((apt: any) => (
            <div key={apt.appointment_id} className="bg-background rounded-xl p-4 shadow-sm border border-border-light flex flex-col md:flex-row gap-4 md:items-center justify-between hover:border-secondary/30 transition-colors group">
                <div className="flex gap-4">
                  <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 border border-secondary/20 font-bold text-secondary text-lg">
                    #{apt.serial_number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-foreground">{apt.patient?.first_name} {apt.patient?.last_name}</span>
                      <span className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                        apt.status === 'completed' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                        apt.status === 'in_queue' ? 'text-indigo-700 bg-indigo-50 border-indigo-200' : 
                        apt.status === 'no_show' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                        apt.status === 'cancelled' ? 'text-red-700 bg-red-50 border-red-200' :
                        'text-blue-700 bg-blue-50 border-blue-200'
                      }`}>
                        {apt.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                        {apt.status === 'completed' ? 'Completed' :
                         apt.status === 'in_queue' ? 'In Queue' : 
                         apt.status === 'no_show' ? 'No-Show' :
                         apt.status === 'cancelled' ? 'Cancelled' :
                         'Scheduled'}
                      </span>
                    </div>

                    <div className="text-[13px] text-muted flex flex-wrap items-center gap-3 mt-1.5 font-medium">
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
                {(apt.status === 'scheduled' || apt.status === 'in_queue') ? (
                  <Button
                    onClick={() => navigate(`/doctor/queue/${apt.appointment_id}`)}
                    className="gap-2 px-6 rounded-xl font-bold bg-secondary hover:bg-secondary/90 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                  >
                    <Stethoscope className="h-4 w-4" />
                    Consult
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/doctor/queue/${apt.appointment_id}`)}
                    className="gap-2 px-4 rounded-xl border-border-light"
                  >
                    View Record
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-surface border border-border-light rounded-2xl shadow-sm">
          <Users className="h-12 w-12 text-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">No appointments today</h3>
          <p className="text-muted mt-1 text-sm">Enjoy your free time!</p>
        </div>
      )}
    </div>
  );
}
