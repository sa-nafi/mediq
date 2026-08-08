import { useQuery } from '@tanstack/react-query';
import { User, Shield, Briefcase, Mail, Phone } from 'lucide-react';
import dayjs from 'dayjs';

import { useAuthStore } from '@/store/auth-store';
import { adminApi } from '@/api/admin';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin', 'profile', user?.id],
    queryFn: () => adminApi.getProfile(),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-16 w-16 bg-border-light rounded-full" />
          <div className="h-4 w-32 bg-border-light rounded-md" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center bg-red-50 p-8 rounded-3xl border border-red-100 text-red-500 shadow-sm max-w-sm mx-auto">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold">Profile Unavailable</h3>
          <p className="text-sm opacity-80 mt-2">We couldn't load your profile information. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My Profile</h1>
          <p className="text-muted mt-0.5 text-sm">View your personal and admin information.</p>
        </div>
      </div>

      <div className="bg-surface/80 backdrop-blur-xl border border-border-light rounded-2xl overflow-hidden shadow-sm relative">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-bl from-primary/5 via-secondary/5 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative border-b border-border-light/50 bg-gradient-to-br from-background/40 to-transparent p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="h-20 w-20 rounded-full bg-background flex items-center justify-center text-primary border-4 border-background shadow-md relative z-10 transition-transform duration-500 group-hover:scale-105">
                <User className="h-8 w-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border-2 border-background z-20">
                {profile.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            <div className="text-center sm:text-left flex-1 pb-1">
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                {profile.first_name} {profile.last_name}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary/10 text-secondary font-semibold text-xs border border-secondary/20 capitalize">
                  {profile.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Contact Details</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <InfoCard 
                  icon={<Mail className="h-4 w-4" />} 
                  label="Email Address" 
                  value={profile.email} 
                  readOnly 
                  colorClass="text-blue-600 bg-blue-50 border-blue-100" 
                />
                <InfoCard 
                  icon={<Phone className="h-4 w-4" />} 
                  label="Phone Number" 
                  value={profile.phone || 'Not provided'} 
                  readOnly
                  colorClass="text-green-600 bg-green-50 border-green-100" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Briefcase className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-foreground">System Details</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoCard 
                  icon={<Shield className="h-4 w-4" />} 
                  label="System Role" 
                  value={profile.role} 
                  readOnly
                  colorClass="text-pink-600 bg-pink-50 border-pink-100" 
                  className="capitalize sm:col-span-2"
                />
                <InfoCard 
                  icon={<User className="h-4 w-4" />} 
                  label="Joined Date" 
                  value={dayjs(profile.hire_date).format('MMMM D, YYYY')} 
                  readOnly
                  colorClass="text-indigo-600 bg-indigo-50 border-indigo-100" 
                  className="sm:col-span-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, readOnly, colorClass, className = '' }: { icon: React.ReactNode, label: string, value: string | undefined, readOnly?: boolean, colorClass: string, className?: string }) {
  return (
    <div className={`p-3 rounded-xl border border-border-light bg-background hover:border-primary/30 hover:shadow-sm transition-all group relative overflow-hidden ${className}`}>
      {readOnly && (
        <div className="absolute top-0 right-0 bg-muted/10 text-muted-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-bl-md uppercase tracking-wider">
          Read Only
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border ${colorClass} group-hover:scale-105 transition-transform duration-300`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">{label}</p>
          <p className="text-sm font-semibold text-foreground leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}
