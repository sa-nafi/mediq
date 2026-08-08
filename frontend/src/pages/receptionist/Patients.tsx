import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Users, Search, Phone, User as UserIcon } from 'lucide-react';

import { receptionistApi } from '@/api/receptionist';
import { Button } from '@/components/ui/button';

export function ReceptionistPatientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: patientsData, isLoading, error } = useQuery({
    queryKey: ['receptionist', 'patients', page, search],
    queryFn: () => receptionistApi.getPatients({ 
      page, 
      limit: 10,
      search: search || undefined
    }),
  });

  const patients = patientsData?.data || [];
  const totalPages = patientsData?.total_pages || 1;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Patients</h1>
          <p className="text-muted mt-0.5 text-sm">View patient directory and basic details.</p>
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
                      <div className="px-2 py-0.5 rounded bg-background border border-border-light">
                        DOB: {dayjs(patient.date_of_birth).format('MMM D, YYYY')}
                      </div>
                      <div className="px-2 py-0.5 rounded bg-background border border-border-light capitalize">
                        {patient.gender}
                      </div>
                    </div>
                  </div>
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
    </div>
  );
}
