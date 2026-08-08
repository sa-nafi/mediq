import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stethoscope, Search, Edit2, Ban, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { adminApi } from '@/api/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';

export function DoctorsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'professional'>('personal');
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    specialization: '',
    consultation_fee: 0,
    department_id: null as number | null,
  });
  
  const [deactivateId, setDeactivateId] = useState<number | null>(null);

  const { data: doctorsData, isLoading, error } = useQuery({
    queryKey: ['admin', 'doctors', page, search],
    queryFn: () => adminApi.getDoctors({ 
      page, 
      limit: 10,
      search: search || undefined
    }),
  });

  const doctors = doctorsData?.data || [];
  const totalPages = doctorsData?.total_pages || 1;

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateDoctor(selectedDoctor.doctor_id, data),
    onSuccess: () => {
      toast.success('Doctor updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      setSelectedDoctor(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update doctor');
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteDoctor(id),
    onSuccess: () => {
      toast.success('Doctor deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      setDeactivateId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate doctor');
    }
  });

  const handleEditClick = (doc: any) => {
    setSelectedDoctor(doc);
    setActiveTab('personal');
    setEditForm({
      first_name: doc.first_name,
      last_name: doc.last_name,
      phone: doc.phone || '',
      specialization: doc.specialization || '',
      consultation_fee: doc.consultation_fee ?? 0,
      department_id: doc.department_id ?? null,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      phone: editForm.phone || null,
      specialization: editForm.specialization || null,
      consultation_fee: Number(editForm.consultation_fee),
      department_id: editForm.department_id,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Manage Doctors</h1>
          <p className="text-muted mt-0.5 text-sm">View, update, or deactivate doctors.</p>
        </div>
      </div>

      <div className="flex bg-surface p-2 rounded-xl border border-border-light shadow-sm w-full max-w-md items-center">
        <Search className="w-5 h-5 text-muted ml-2" />
        <input 
          type="text" 
          placeholder="Search doctors..."
          className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-foreground"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-sm">
          <p className="text-muted text-sm font-medium">Loading doctors...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-red-600 gap-2 shadow-sm">
          <Stethoscope className="h-8 w-8 opacity-80" />
          <p className="text-base font-bold">Failed to load doctors.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {doctors.length > 0 ? (
            doctors.map((doc: any) => (
              <div key={doc.doctor_id} className="bg-surface rounded-xl p-4 shadow-sm border border-border-light flex flex-col md:flex-row gap-4 md:items-center justify-between hover:border-secondary/30 transition-colors group">
                <div className="flex gap-4 items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 group-hover:scale-105 transition-transform">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Dr. {doc.first_name} {doc.last_name}
                    </h3>
                    <div className="text-[13px] text-muted flex flex-wrap items-center gap-3 mt-1 font-medium">
                      {doc.department_name && (
                        <div className="px-2 py-0.5 rounded bg-background border border-border-light font-bold text-secondary">
                          {doc.department_name}
                        </div>
                      )}
                      {doc.specialization && (
                        <div className="px-2 py-0.5 rounded bg-background border border-border-light">
                          {doc.specialization}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {doc.email || 'N/A'}
                      </div>
                      <div>Fee: ৳{doc.consultation_fee}</div>
                      <div>{doc.phone || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => handleEditClick(doc)}>
                    <Edit2 className="h-4 w-4 mr-1.5" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => setDeactivateId(doc.doctor_id)}>
                    <Ban className="h-4 w-4 mr-1.5" /> Deactivate
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center bg-surface border border-border-light rounded-2xl shadow-sm">
              <Stethoscope className="h-12 w-12 text-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">No doctors found</h3>
              <p className="text-muted mt-1 text-sm">No doctors match your search criteria.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <span className="text-sm text-muted font-medium">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modern Redesigned Edit Doctor Dialog */}
      <Dialog open={!!selectedDoctor} onOpenChange={(open) => !open && setSelectedDoctor(null)}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden custom-scrollbar">
          <div className="bg-surface border-b border-border-light px-6 py-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Dr. {selectedDoctor?.first_name} {selectedDoctor?.last_name}
              </DialogTitle>
              <p className="text-sm text-muted flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5" /> 
                {selectedDoctor?.email || 'No email associated'} (Read-only)
              </p>
            </div>
          </div>

          <div className="px-6 py-2 border-b border-border-light bg-secondary/5 flex gap-6">
            <button 
              type="button"
              className={cn("pb-2 text-sm font-bold border-b-2 transition-colors", activeTab === 'personal' ? "border-secondary text-secondary" : "border-transparent text-muted hover:text-foreground")}
              onClick={() => setActiveTab('personal')}
            >
              Personal Info
            </button>
            <button 
              type="button"
              className={cn("pb-2 text-sm font-bold border-b-2 transition-colors", activeTab === 'professional' ? "border-secondary text-secondary" : "border-transparent text-muted hover:text-foreground")}
              onClick={() => setActiveTab('professional')}
            >
              Professional Details
            </button>
          </div>

          <form onSubmit={handleUpdate} className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {activeTab === 'personal' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300 min-h-[260px]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">First Name</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={editForm.first_name}
                      onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Last Name</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={editForm.last_name}
                      onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Phone</label>
                  <input
                    type="tel"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300 min-h-[260px]">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Specialization</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={editForm.specialization}
                    onChange={e => setEditForm({ ...editForm, specialization: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Consultation Fee (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={editForm.consultation_fee}
                    onChange={e => setEditForm({ ...editForm, consultation_fee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-border-light mt-4">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setSelectedDoctor(null)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deactivateId}
        onOpenChange={(open) => !open && setDeactivateId(null)}
        title="Deactivate Doctor"
        description="Are you sure you want to deactivate this doctor? They will lose access to the system."
        variant="destructive"
        onConfirm={() => {
          if (deactivateId) deactivateMutation.mutate(deactivateId);
        }}
        isPending={deactivateMutation.isPending}
      />
    </div>
  );
}
