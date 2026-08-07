import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Calendar as CalendarIcon, Edit3, Shield, Droplet } from 'lucide-react';
import dayjs from 'dayjs';

import { patientApi } from '@/api/patient';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function PatientProfilePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['patient', 'profile', user?.id],
    queryFn: () => patientApi.getProfile(),
    enabled: !!user?.id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => patientApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['patient', 'profile'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
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
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My Profile</h1>
          <p className="text-muted mt-0.5 text-sm">Manage your personal and medical information.</p>
        </div>
        {!isEditing && (
          <Button 
            variant="accent" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5 rounded-lg px-4"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="bg-surface/80 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-sm relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-bl from-primary/5 via-secondary/5 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative border-b border-border-light/50 bg-gradient-to-br from-white/40 to-transparent p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="h-20 w-20 rounded-full bg-background flex items-center justify-center text-primary border-4 border-white shadow-md relative z-10 transition-transform duration-500 group-hover:scale-105">
                <User className="h-8 w-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border-2 border-white z-20">
                Active
              </div>
            </div>
            
            <div className="text-center sm:text-left flex-1 pb-1">
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                {profile.first_name} {profile.last_name}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                  Patient ID: #{profile.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 relative z-10">
          {isEditing ? (
            <div className="bg-white rounded-2xl p-5 border border-primary/10 shadow-sm animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 mb-4 border-b border-border-light pb-3">
                <Edit3 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Edit Information</h3>
              </div>
              <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground">First Name</label>
                    <Input {...register('first_name')} className="rounded-lg bg-surface border-border-light focus-visible:ring-primary/20 h-10 text-sm" placeholder="e.g. John" />
                    {errors.first_name && <p className="text-[10px] text-red-500 font-medium">{errors.first_name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground">Last Name</label>
                    <Input {...register('last_name')} className="rounded-lg bg-surface border-border-light focus-visible:ring-primary/20 h-10 text-sm" placeholder="e.g. Doe" />
                    {errors.last_name && <p className="text-[10px] text-red-500 font-medium">{errors.last_name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground">Phone Number</label>
                    <Input {...register('phone')} className="rounded-lg bg-surface border-border-light focus-visible:ring-primary/20 h-10 text-sm" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-foreground">Address</label>
                    <Input {...register('address')} className="rounded-lg bg-surface border-border-light focus-visible:ring-primary/20 h-10 text-sm" placeholder="123 Main St, City, State, ZIP" />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border-light mt-4">
                  <Button type="submit" variant="accent" size="sm" disabled={updateMutation.isPending} className="rounded-lg px-6 shadow-sm">
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    reset();
                    setIsEditing(false);
                  }} className="rounded-lg px-6">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information Section */}
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
                    value={profile.user?.email} 
                    readOnly 
                    colorClass="text-blue-600 bg-blue-50 border-blue-100" 
                  />
                  <InfoCard 
                    icon={<Phone className="h-4 w-4" />} 
                    label="Phone Number" 
                    value={profile.phone || 'Not provided'} 
                    colorClass="text-green-600 bg-green-50 border-green-100" 
                  />
                  <InfoCard 
                    icon={<MapPin className="h-4 w-4" />} 
                    label="Physical Address" 
                    value={profile.address || 'Not provided'} 
                    colorClass="text-orange-600 bg-orange-50 border-orange-100" 
                  />
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Medical Profile</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoCard 
                    icon={<CalendarIcon className="h-4 w-4" />} 
                    label="Date of Birth" 
                    value={dayjs(profile.date_of_birth).format('MMMM D, YYYY')} 
                    colorClass="text-purple-600 bg-purple-50 border-purple-100" 
                    className="sm:col-span-2"
                  />
                  <InfoCard 
                    icon={<User className="h-4 w-4" />} 
                    label="Gender" 
                    value={profile.gender === 'M' ? 'Male' : profile.gender === 'F' ? 'Female' : 'Other'} 
                    colorClass="text-pink-600 bg-pink-50 border-pink-100" 
                  />
                  <InfoCard 
                    icon={<Droplet className="h-4 w-4" />} 
                    label="Blood Type" 
                    value={profile.blood_type || 'Unknown'} 
                    colorClass="text-red-600 bg-red-50 border-red-100" 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, readOnly, colorClass, className = '' }: { icon: React.ReactNode, label: string, value: string | undefined, readOnly?: boolean, colorClass: string, className?: string }) {
  return (
    <div className={`p-3 rounded-xl border border-border-light bg-white hover:border-primary/30 hover:shadow-sm transition-all group relative overflow-hidden ${className}`}>
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
