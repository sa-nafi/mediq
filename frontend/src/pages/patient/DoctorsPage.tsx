import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { patientApi } from '@/api/patient';
import { Button } from '@/components/ui/button';

interface Doctor {
  id: string;
  doctor_id: number;
  first_name: string;
  last_name: string;
  department_name?: string;
  specialization?: string;
  qualifications?: string;
  consultation_fee: number;
}

export function PatientDoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: doctors, isLoading, error } = useQuery<Doctor[]>({
    queryKey: ['patient', 'doctors'],
    queryFn: () => patientApi.getDoctors(),
  });

  const filteredDoctors = doctors?.filter((doc: Doctor) =>
    `${doc.first_name} ${doc.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Find a Doctor</h1>
          <p className="text-muted mt-0.5 text-sm">Browse our medical specialists and book an appointment.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface rounded-xl h-10 pl-9 pr-4 text-sm shadow-sm border border-border-light focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary transition-colors"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-sm">
          <p className="text-muted text-sm font-medium">Loading doctors...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-red-600 shadow-sm gap-2">
          <p className="font-bold">Failed to load doctors.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-1 rounded-lg">Try Again</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doc: Doctor) => (
              <div key={doc.id} className="bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-secondary/30 transition-all hover:-translate-y-1 border border-border-light flex flex-col group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-5 flex-1 flex flex-col items-center text-center relative z-10">
                  <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center mb-3 text-secondary border border-white shadow-sm group-hover:scale-105 transition-transform">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Dr. {doc.first_name} {doc.last_name}</h3>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider bg-secondary/10 px-2 py-0.5 rounded mt-1.5">{doc.department_name}</p>

                  {doc.specialization && (
                    <p className="text-xs font-semibold text-foreground/80 mt-2 bg-background border border-border-light px-2 py-1 rounded">{doc.specialization}</p>
                  )}

                  <p className="text-xs text-muted mt-3 line-clamp-2 flex-1 px-2 leading-relaxed">
                    {doc.qualifications}
                  </p>

                  <div className="mt-4 flex items-center justify-between w-full border-t border-border-light pt-4 px-2">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Consultation Fee</span>
                    <span className="font-extrabold text-primary">${doc.consultation_fee}</span>
                  </div>

                  <div className="mt-4 w-full">
                    <Button variant="accent" className="w-full rounded-xl" size="sm" asChild>
                      <Link to={`/patient/book/${doc.doctor_id}`}>Book Appointment</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted bg-surface rounded-2xl border border-border-light shadow-sm">
              <Search className="h-10 w-10 text-muted/30 mx-auto mb-3" />
              <p className="font-medium text-foreground">No doctors found</p>
              <p className="text-sm mt-1">Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
