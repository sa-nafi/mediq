import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Activity, Beaker } from 'lucide-react';
import { doctorApi } from '@/api/doctor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function DoctorMedicalTestsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  const { data: testsData, isLoading } = useQuery({
    queryKey: ['doctor', 'medical-tests', page, statusFilter],
    queryFn: () => doctorApi.getMedicalTests({ page, limit: 10, status: statusFilter || undefined }),
  });

  const { data: selectedTestDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['doctor', 'medical-test', selectedTestId],
    queryFn: () => doctorApi.getMedicalTestById(selectedTestId!),
    enabled: !!selectedTestId,
  });

  const tests = testsData?.data || [];
  const totalPages = testsData?.total_pages || 1;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-amber-700 bg-amber-50 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Medical Tests</h1>
          <p className="text-muted mt-0.5 text-sm">View ordered medical tests.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={statusFilter === '' ? 'default' : 'outline'} onClick={() => { setStatusFilter(''); setPage(1); }} size="sm" className="rounded-lg">All</Button>
          <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} onClick={() => { setStatusFilter('pending'); setPage(1); }} size="sm" className="rounded-lg">Pending</Button>
          <Button variant={statusFilter === 'completed' ? 'default' : 'outline'} onClick={() => { setStatusFilter('completed'); setPage(1); }} size="sm" className="rounded-lg">Completed</Button>
          <Button variant={statusFilter === 'cancelled' ? 'default' : 'outline'} onClick={() => { setStatusFilter('cancelled'); setPage(1); }} size="sm" className="rounded-lg">Cancelled</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-sm">
          <p className="text-muted text-sm font-medium">Loading tests...</p>
        </div>
      ) : tests.length > 0 ? (
        <div className="space-y-3">
          {tests.map((test: any) => (
            <div 
              key={test.test_id} 
              className="bg-surface rounded-xl p-5 shadow-sm border border-border-light hover:border-secondary/50 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelectedTestId(test.test_id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Patient: {test.patient_first_name} {test.patient_last_name}</h3>
                    <p className="text-xs text-muted font-medium">{dayjs(test.test_date).format('MMMM D, YYYY')}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(test.status)}`}>
                  {test.status}
                </span>
              </div>
              
              <div className="mt-4 bg-background rounded-lg p-3 border border-border-light group-hover:bg-secondary/5 transition-colors">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Test Name</span>
                <p className="text-sm font-bold text-foreground mt-1">{test.test_name}</p>
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
          <Beaker className="h-12 w-12 text-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">No tests found</h3>
          <p className="text-muted mt-1 text-sm">No medical tests have been ordered.</p>
        </div>
      )}

      <Dialog open={!!selectedTestId} onOpenChange={(open) => !open && setSelectedTestId(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border-light rounded-2xl">
          {isLoadingDetail || !selectedTestDetail ? (
            <div className="p-8 flex flex-col items-center justify-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent"></div>
              <p className="text-sm font-medium text-muted">Loading test details...</p>
            </div>
          ) : (
            <>
              <div className="bg-secondary/5 p-6 border-b border-border-light">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 bg-secondary text-white rounded-lg flex items-center justify-center shadow-md">
                      <Beaker className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-extrabold text-foreground">
                        {selectedTestDetail.test_name}
                      </DialogTitle>
                      <p className="text-xs font-semibold text-muted">
                        Ordered on {dayjs(selectedTestDetail.test_date).format('MMMM D, YYYY')}
                      </p>
                    </div>
                  </div>
                </DialogHeader>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-center bg-background border border-border-light rounded-xl p-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted tracking-wider mb-0.5">Patient</p>
                    <p className="text-sm font-bold text-foreground">{selectedTestDetail.patient_first_name} {selectedTestDetail.patient_last_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted tracking-wider mb-0.5">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(selectedTestDetail.status)}`}>
                      {selectedTestDetail.status}
                    </span>
                  </div>
                </div>

                {selectedTestDetail.test_details && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5" />
                      Test Details
                    </h4>
                    <div className="bg-surface border border-border-light rounded-xl p-4">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTestDetail.test_details}</p>
                    </div>
                  </div>
                )}

                {selectedTestDetail.status === 'completed' && selectedTestDetail.result && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-emerald-500" />
                        Results
                      </h4>
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTestDetail.result}</p>
                      </div>
                    </div>
                    
                    {(selectedTestDetail.lab_tech_first_name || selectedTestDetail.completed_date) && (
                      <div className="bg-surface border border-border-light rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between">
                        {selectedTestDetail.lab_tech_first_name && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-muted tracking-wider mb-0.5">Performed By</p>
                            <p className="text-sm font-semibold text-foreground">
                              {selectedTestDetail.lab_tech_first_name} {selectedTestDetail.lab_tech_last_name}
                            </p>
                          </div>
                        )}
                        {selectedTestDetail.completed_date && (
                          <div className="sm:text-right">
                            <p className="text-[10px] uppercase font-bold text-muted tracking-wider mb-0.5">Completed On</p>
                            <p className="text-sm font-semibold text-foreground">
                              {dayjs(selectedTestDetail.completed_date).format('MMMM D, YYYY h:mm A')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-border-light bg-surface/50 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedTestId(null)} className="rounded-xl font-bold">
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
