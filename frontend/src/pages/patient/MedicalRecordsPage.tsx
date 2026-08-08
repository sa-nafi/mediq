import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { FileText, Stethoscope, AlertCircle, FileStack } from 'lucide-react';
import { patientApi } from '@/api/patient';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function PatientMedicalRecordsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: recordsData, isLoading, error } = useQuery({
    queryKey: ['patient', 'records', { page, limit }],
    queryFn: () => patientApi.getMedicalRecords({ page, limit }),
  });

  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Medical Records</h1>
          <p className="text-muted mt-0.5 text-sm">View your past consultation records and diagnoses.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-sm">
          <p className="text-muted">Loading records...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-red-600 gap-2 shadow-sm">
          <AlertCircle className="h-6 w-6" />
          <p>Failed to load medical records.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : recordsData?.data && recordsData.data.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {recordsData.data.map((record: any) => (
            <div 
              key={record.id} 
              className="bg-surface rounded-xl p-4 shadow-sm border border-border-light flex items-center justify-between cursor-pointer hover:border-blue-200 hover:shadow transition-all group"
              onClick={() => setSelectedRecord(record)}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 group-hover:bg-blue-100 transition-all duration-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base mb-0.5">{record.diagnosis || 'General Consultation'}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                    <span className="inline-flex items-center font-medium bg-background px-2 py-0.5 rounded border border-border-light">
                      {dayjs(record.record_date).format('MMM D, YYYY')}
                    </span>
                    <span className="hidden sm:inline text-muted/50">•</span>
                    <span className="flex items-center gap-1 font-medium text-foreground/80">
                      <Stethoscope className="h-3 w-3" />
                      Dr. {record.doctor?.first_name} {record.doctor?.last_name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-blue-600 font-semibold text-xs mr-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                View Details <svg xmlns="http://www.3000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-surface border border-border-light rounded-2xl shadow-sm">
          <FileStack className="h-12 w-12 text-muted/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground">No Medical Records</h3>
          <p className="text-muted mt-2 text-sm max-w-sm mx-auto">
            You don't have any medical records in the system yet. Records are created by doctors during your consultation.
          </p>
        </div>
      )}

      {recordsData?.total_pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm font-medium text-muted">
            Page {page} of {recordsData.total_pages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.min(recordsData.total_pages, p + 1))}
            disabled={page >= recordsData.total_pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Record Details Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        {selectedRecord && (
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 overflow-hidden border-none shadow-xl">
            <div className="bg-gradient-to-br from-blue-50 to-white px-6 py-6 border-b border-border-light relative overflow-hidden">
              <div className="absolute -right-4 -top-10 opacity-5 pointer-events-none">
                <FileText className="h-32 w-32" />
              </div>
              <DialogHeader className="relative z-10">
                <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-foreground">
                  <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  {selectedRecord.diagnosis || 'General Consultation'}
                </DialogTitle>
                <DialogDescription className="text-sm font-medium mt-1.5 flex items-center gap-2 text-muted">
                  Consultation on {dayjs(selectedRecord.record_date).format('MMMM D, YYYY')}
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-6 space-y-6 bg-surface">
              <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 shadow-sm">
                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-0.5">Consulting Doctor</p>
                  <p className="text-base font-bold text-foreground leading-tight">
                    Dr. {selectedRecord.doctor?.first_name} {selectedRecord.doctor?.last_name}
                  </p>
                  {selectedRecord.doctor?.specialization && (
                    <p className="text-xs font-medium text-foreground/80 mt-0.5">{selectedRecord.doctor?.specialization}</p>
                  )}
                </div>
              </div>

              {selectedRecord.treatment && (
                <div>
                  <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Treatment Plan
                  </h4>
                  <div className="text-sm text-foreground bg-background p-4 rounded-xl border border-border-light leading-relaxed">
                    {selectedRecord.treatment}
                  </div>
                </div>
              )}
              
              {selectedRecord.notes && (
                <div>
                  <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Doctor's Notes
                  </h4>
                  <div className="text-sm text-foreground bg-amber-50 p-4 rounded-xl border border-amber-100/60 leading-relaxed shadow-sm">
                    {selectedRecord.notes}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-border-light bg-background flex justify-end items-center">
              <Button size="sm" onClick={() => setSelectedRecord(null)} className="rounded-lg px-6 shadow-sm">Close</Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
