import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Users, Search, Phone, User as UserIcon, Edit2, Droplets, Calendar, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { adminApi } from '@/api/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { CustomSelect } from '@/components/ui/custom-select';
import { cn } from '@/lib/utils';

export function PatientsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'medical'>('personal');
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    blood_type: '',
  });

  const { data: patientsData, isLoading, error } = useQuery({
    queryKey: ['admin', 'patients', page, search],
    queryFn: () => adminApi.getPatients({
      page,
      limit: 10,
      search: search || undefined
    }),
  });

  const patients = patientsData?.data || [];
  const totalPages = patientsData?.total_pages || 1;

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminApi.updatePatient(selectedPatient.patient_id, data),
    onSuccess: () => {
      toast.success('Patient information updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'patients'] });
      setSelectedPatient(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update patient');
    }
  });

  const handleEditClick = (patient: any) => {
    setSelectedPatient(patient);
    setActiveTab('personal');
    setEditForm({
      first_name: patient.first_name,
      last_name: patient.last_name,
      phone: patient.phone || '',
      address: patient.address || '',
      date_of_birth: patient.date_of_birth ? dayjs(patient.date_of_birth).format('YYYY-MM-DD') : '',
      gender: patient.gender || '',
      blood_type: patient.blood_type || '',
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      first_name: editForm.first_name || null,
      last_name: editForm.last_name || null,
      phone: editForm.phone || null,
      address: editForm.address || null,
      date_of_birth: editForm.date_of_birth || null,
      gender: editForm.gender || null,
      blood_type: editForm.blood_type || null,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Manage Patients</h1>
          <p className="text-muted mt-0.5 text-sm">View and update patient information.</p>
        </div>
      </div>

      <div className="flex bg-surface p-2 rounded-xl border border-border-light shadow-sm w-full max-w-md items-center">
        <Search className="w-5 h-5 text-muted ml-2" />
        <input
          type="text"
          placeholder="Search patients..."
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
          <p className="text-muted text-sm font-medium">Loading patients...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-red-600 gap-2 shadow-sm">
          <Users className="h-8 w-8 opacity-80" />
          <p className="text-base font-bold">Failed to load patients.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.length > 0 ? (
            patients.map((patient: any) => (
              <div key={patient.patient_id} className="bg-surface rounded-xl p-4 shadow-sm border border-border-light flex flex-col md:flex-row gap-4 md:items-center justify-between hover:border-secondary/30 transition-colors group">
                <div className="flex gap-4 items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 group-hover:scale-105 transition-transform">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {patient.first_name} {patient.last_name}
                    </h3>
                    <div className="text-[13px] text-muted flex flex-wrap items-center gap-3 mt-1 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {patient.phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-background border border-border-light">
                        <Calendar className="h-3 w-3" />
                        {dayjs(patient.date_of_birth).format('MMM D, YYYY')}
                      </div>
                      {patient.gender && (
                        <div className="px-2 py-0.5 rounded bg-background border border-border-light capitalize">
                          {patient.gender}
                        </div>
                      )}
                      {patient.blood_type && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-100 text-red-700 font-bold">
                          <Droplets className="h-3 w-3" />
                          {patient.blood_type}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => handleEditClick(patient)}>
                    <Edit2 className="h-4 w-4 mr-1.5" /> Edit
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center bg-surface border border-border-light rounded-2xl shadow-sm">
              <Users className="h-12 w-12 text-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground">No patients found</h3>
              <p className="text-muted mt-1 text-sm">No patients match your search criteria.</p>
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

      {/* Modern Redesigned Edit Patient Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden custom-scrollbar">
          <div className="bg-surface border-b border-border-light px-6 py-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserIcon className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {selectedPatient?.first_name} {selectedPatient?.last_name}
              </DialogTitle>
              <p className="text-sm text-muted flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5" />
                {selectedPatient?.email || 'No email associated'} (Read-only)
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
              className={cn("pb-2 text-sm font-bold border-b-2 transition-colors", activeTab === 'contact' ? "border-secondary text-secondary" : "border-transparent text-muted hover:text-foreground")}
              onClick={() => setActiveTab('contact')}
            >
              Contact
            </button>
            <button
              type="button"
              className={cn("pb-2 text-sm font-bold border-b-2 transition-colors", activeTab === 'medical' ? "border-secondary text-secondary" : "border-transparent text-muted hover:text-foreground")}
              onClick={() => setActiveTab('medical')}
            >
              Medical Stats
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
                  <label className="text-sm font-bold text-foreground">Date of Birth</label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                    value={editForm.date_of_birth}
                    onChange={e => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                  />
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300 min-h-[260px]">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Phone</label>
                  <input
                    type="tel"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Address</label>
                  <textarea
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y min-h-[80px]"
                    value={editForm.address}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              </div>
            )}

            {activeTab === 'medical' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300 min-h-[260px]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Gender</label>
                    <CustomSelect
                      className="w-full"
                      value={editForm.gender}
                      onChange={val => setEditForm({ ...editForm, gender: val })}
                      options={[
                        { label: 'Select Gender', value: '' },
                        { label: 'Male', value: 'male' },
                        { label: 'Female', value: 'female' },
                        { label: 'Other', value: 'other' }
                      ]}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Blood Type</label>
                    <CustomSelect
                      className="w-full"
                      value={editForm.blood_type}
                      onChange={val => setEditForm({ ...editForm, blood_type: val })}
                      options={[
                        { label: 'Select Blood Type', value: '' },
                        { label: 'A+', value: 'A+' },
                        { label: 'A-', value: 'A-' },
                        { label: 'B+', value: 'B+' },
                        { label: 'B-', value: 'B-' },
                        { label: 'O+', value: 'O+' },
                        { label: 'O-', value: 'O-' },
                        { label: 'AB+', value: 'AB+' },
                        { label: 'AB-', value: 'AB-' }
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-border-light mt-4">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setSelectedPatient(null)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
