import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { Users, Clock, CheckCircle } from 'lucide-react';
import { doctorApi } from '@/api/doctor';

export function DoctorDashboard() {
  const today = dayjs().format('YYYY-MM-DD');
  
  const { data: profileData } = useQuery({
    queryKey: ['doctor', 'profile'],
    queryFn: () => doctorApi.getProfile(),
  });

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['doctor', 'queue', today],
    queryFn: () => doctorApi.getQueue({ date: today, limit: 100 }),
  });

  const appointments = appointmentsData?.data || [];
  const scheduled = appointments.filter((a: any) => a.status === 'scheduled' || a.status === 'in_queue');
  const completed = appointments.filter((a: any) => a.status === 'completed');

  const stats = [
    {
      title: "Today's Total Patients",
      value: appointments.length.toString(),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Completed',
      value: completed.length.toString(),
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Waiting in Queue',
      value: scheduled.length.toString(),
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {profileData ? `Welcome, Dr. ${profileData.last_name}` : 'Doctor Dashboard'}
          </h1>
          <p className="text-muted mt-0.5 text-sm">Here's your schedule for today.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface border border-border-light rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="rounded-xl bg-surface p-4 shadow-sm border border-border-light flex items-center gap-4 hover:border-secondary/30 transition-colors">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-0.5">{stat.title}</p>
                  <h3 className="text-xl font-extrabold text-primary">{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border-light bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Upcoming Patients
              </h2>
              <Link to="/doctor/queue" className="text-xs text-secondary hover:underline font-bold uppercase tracking-wider">View Queue</Link>
            </div>
            
            <div className="space-y-3">
              {scheduled.length > 0 ? (
                scheduled.sort((a: any, b: any) => a.serial_number - b.serial_number).map((apt: any) => (
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
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-background rounded-xl border border-border-light">
                  <p className="text-muted text-sm">No waiting patients! You've cleared your queue for today.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
