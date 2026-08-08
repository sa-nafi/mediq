import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { FileText, FileSearch, Search, Calendar, User, AlignLeft } from 'lucide-react';
import { doctorApi } from '@/api/doctor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function DoctorMedicalRecordsPage() {
  const [page, setPage] = useState(1);
  const [patientIdFilter, setPatientIdFilter] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  // Parse the filter to number or undefined
  const filterId = patientIdFilter.trim() !== '' ? parseInt(patientIdFilter) : undefined;

  const { data: recordsData, isLoading } = useQuery({
    queryKey: ['doctor', 'medical-records', page, filterId],
    queryFn: () => doctorApi.getMedicalRecords({ page, limit: 10, patient_id: filterId || undefined }),
  });

  const { data: selectedRecordDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['doctor', 'medical-record', selectedRecordId],
    queryFn: () => doctorApi.getMedicalRecordById(selectedRecordId!),
    enabled: !!selectedRecordId,
  });

  const records = recordsData?.data || [];
  const totalPages = recordsData?.total_pages || 1;

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatientIdFilter(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Medical Records</h1>
          <p className="text-muted mt-0.5 text-sm">View patient medical records.</p>
        </div>
        
        <div className="flex items-center gap-2 max-w-sm w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="number"
              placeholder="Filter by Patient ID..."
              value={patientIdFilter}
              onChange={handleFilterChange}
              className="w-full bg-surface border border-border-light rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
            />
          </div>
          {patientIdFilter && (
            <Button variant="outline" size="sm" onClick={() => { setPatientIdFilter(''); setPage(1); }} className="shrink-0 rounded-lg">
              Clear
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-sm">
          <p className="text-muted text-sm font-medium">Loading records...</p>
        </div>
      ) : records.length > 0 ? (
        <div className="space-y-3">
          {records.map((record: any) => (
            <div 
              key={record.record_id} 
              className="bg-surface rounded-xl p-5 shadow-sm border border-border-light hover:border-secondary/50 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelectedRecordId(record.record_id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Patient: {record.patient_first_name} {record.patient_last_name}</h3>
                    <p className="text-xs text-muted font-medium">{dayjs(record.record_date).format('MMMM D, YYYY')}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-3 border border-border-light group-hover:bg-secondary/5 transition-colors">
                  <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Diagnosis</span>
                  <p className="text-sm font-medium text-foreground mt-1 whitespace-pre-wrap line-clamp-2">{record.diagnosis || 'None'}</p>
                </div>
                <div className="bg-background rounded-lg p-3 border border-border-light group-hover:bg-secondary/5 transition-colors">
                  <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Treatment</span>
                  <p className="text-sm font-medium text-foreground mt-1 whitespace-pre-wrap line-clamp-2">{record.treatment || 'None'}</p>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-muted font-medium">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center bg-surface border border-border-light rounded-2xl shadow-sm">
          <FileSearch className="h-12 w-12 text-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">No records found</h3>
          <p className="text-muted mt-1 text-sm">
            {patientIdFilter ? `No records found for patient ID ${patientIdFilter}.` : 'No medical records are available yet.'}
          </p>
        </div>
      )}

      <Dialog open={!!selectedRecordId} onOpenChange={(open) => !open && setSelectedRecordId(null)}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-border-light rounded-2xl">
          {isLoadingDetail || !selectedRecordDetail ? (
            <div className="p-8 flex flex-col items-center justify-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent"></div>
              <p className="text-sm font-medium text-muted">Loading record details...</p>
            </div>
          ) : (
            <>
              <div className="bg-secondary/5 p-6 border-b border-border-light">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-secondary text-white rounded-lg flex items-center justify-center shadow-md">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-extrabold text-foreground">
                        Medical Record
                      </DialogTitle>
                      <p className="text-xs font-semibold text-muted flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {dayjs(selectedRecordDetail.record_date).format('MMMM D, YYYY [at] h:mm A')}
                      </p>
                    </div>
                  </div>
                </DialogHeader>
              </div>
              
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background border border-border-light rounded-xl p-3 flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted tracking-wider mb-0.5">Patient ID: {selectedRecordDetail.patient_id}</p>
                      <p className="text-sm font-bold text-foreground">{selectedRecordDetail.patient_first_name} {selectedRecordDetail.patient_last_name}</p>
                    </div>
                  </div>
                  
                  {selectedRecordDetail.doctor && (
                    <div className="bg-background border border-border-light rounded-xl p-3 flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted tracking-wider mb-0.5">Doctor</p>
                        <p className="text-sm font-bold text-foreground">Dr. {selectedRecordDetail.doctor.first_name} {selectedRecordDetail.doctor.last_name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                  {selectedRecordDetail.diagnosis && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                        <AlignLeft className="h-3.5 w-3.5 text-secondary" />
                        Diagnosis
                      </h4>
                      <div className="bg-surface border border-border-light rounded-xl p-4">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{selectedRecordDetail.diagnosis}</p>
                      </div>
                    </div>
                  )}

                  {selectedRecordDetail.treatment && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                        <AlignLeft className="h-3.5 w-3.5 text-secondary" />
                        Treatment
                      </h4>
                      <div className="bg-surface border border-border-light rounded-xl p-4">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{selectedRecordDetail.treatment}</p>
                      </div>
                    </div>
                  )}

                  {selectedRecordDetail.notes && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-amber-500" />
                        Additional Notes
                      </h4>
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{selectedRecordDetail.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 border-t border-border-light bg-surface/50 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedRecordId(null)} className="rounded-xl font-bold">
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
