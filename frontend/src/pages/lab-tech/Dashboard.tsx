import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Activity, Beaker, Play, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { labTechApi } from '@/api/labTech';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function LabTechDashboard() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('in_progress');
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [resultInput, setResultInput] = useState('');

  // Fetch all for chips (could be optimized, but using available endpoint)
  const { data: allTestsData } = useQuery({
    queryKey: ['labTech', 'medical-tests', 'all'],
    queryFn: () => labTechApi.getMedicalTests({ limit: 1000 }), // Get a large batch for dashboard counts
  });

  const { data: testsData, isLoading } = useQuery({
    queryKey: ['labTech', 'medical-tests', page, statusFilter],
    queryFn: () => labTechApi.getMedicalTests({ page, limit: 10, status: statusFilter || undefined }),
  });

  const { data: selectedTestDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['labTech', 'medical-test', selectedTestId],
    queryFn: () => labTechApi.getMedicalTestById(selectedTestId!),
    enabled: !!selectedTestId,
  });

  const updateTestMutation = useMutation({
    mutationFn: (data: { id: number; status: string; result?: string }) => 
      labTechApi.updateMedicalTestStatus(data.id, { status: data.status, result: data.result }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['labTech', 'medical-tests'] });
      queryClient.invalidateQueries({ queryKey: ['labTech', 'medical-test', variables.id] });
      toast.success(variables.status === 'in_progress' ? `Test #${variables.id} is now in progress.` : `Test #${variables.id} completed successfully.`);
      if (variables.status === 'completed') {
        setSelectedTestId(null);
        setResultInput('');
      }
    },
    onError: () => {
      toast.error('Failed to update test.');
    }
  });

  const tests = testsData?.data || [];
  const totalPages = testsData?.total_pages || 1;

  // Calculate counts for chips
  const counts = useMemo(() => {
    const all = allTestsData?.data || [];
    return {
      incomplete: all.filter((t: any) => t.status === 'ordered').length,
      inProgress: all.filter((t: any) => t.status === 'in_progress').length,
      completed: all.filter((t: any) => t.status === 'completed').length,
    };
  }, [allTestsData]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
      case 'in_progress': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-amber-700 bg-amber-50 border-amber-200';
    }
  };

  const handleStart = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    updateTestMutation.mutate({ id, status: 'in_progress' });
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultInput.trim() || !selectedTestId) return;
    updateTestMutation.mutate({ id: selectedTestId, status: 'completed', result: resultInput.trim() });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Lab Dashboard</h1>
        <p className="text-muted mt-0.5 text-sm">Manage and complete assigned diagnostic tests.</p>
      </div>

      {/* Dashboard Chips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light flex items-center gap-4 hover:border-blue-200 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-0.5">In Progress</p>
            <h3 className="text-xl font-extrabold text-primary">{counts.inProgress}</h3>
          </div>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light flex items-center gap-4 hover:border-amber-200 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-0.5">Incomplete</p>
            <h3 className="text-xl font-extrabold text-primary">{counts.incomplete}</h3>
          </div>
        </div>
        <div className="rounded-xl bg-surface p-4 shadow-sm border border-border-light flex items-center gap-4 hover:border-emerald-200 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-0.5">Completed</p>
            <h3 className="text-xl font-extrabold text-primary">{counts.completed}</h3>
          </div>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border-light">
        <h2 className="text-xl font-bold text-foreground">Lab Tests</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant={statusFilter === 'in_progress' ? 'default' : 'outline'} onClick={() => { setStatusFilter('in_progress'); setPage(1); }} size="sm" className="rounded-lg">In Progress</Button>
          <Button variant={statusFilter === 'ordered' ? 'default' : 'outline'} onClick={() => { setStatusFilter('ordered'); setPage(1); }} size="sm" className="rounded-lg">Incomplete</Button>
          <Button variant={statusFilter === 'completed' ? 'default' : 'outline'} onClick={() => { setStatusFilter('completed'); setPage(1); }} size="sm" className="rounded-lg">Completed</Button>
          <Button variant={statusFilter === '' ? 'default' : 'outline'} onClick={() => { setStatusFilter(''); setPage(1); }} size="sm" className="rounded-lg">All</Button>
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
                    <Beaker className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      Test #{test.test_id}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(test.status)}`}>
                        {test.status === 'ordered' ? 'incomplete' : test.status}
                      </span>
                    </h3>
                    <p className="text-xs text-muted font-medium mt-0.5">
                      Patient: {test.patient_first_name} {test.patient_last_name} &bull; Ordered: {dayjs(test.ordered_date).format('MMM D, YYYY')} {test.doctor_first_name && `by Dr. ${test.doctor_first_name} ${test.doctor_last_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {test.status === 'ordered' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-lg bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800"
                      onClick={(e) => handleStart(e, test.test_id)}
                      disabled={updateTestMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-1" /> Start
                    </Button>
                  )}
                </div>
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
          <h3 className="text-lg font-bold text-foreground">No lab tests found</h3>
          <p className="text-muted mt-1 text-sm">There are no tests matching your current filter.</p>
        </div>
      )}

      {/* Test Detail / Result Dialog */}
      <Dialog open={!!selectedTestId} onOpenChange={(open) => {
        if (!open) {
          setSelectedTestId(null);
          setResultInput('');
        }
      }}>
        <DialogContent className="sm:max-w-[750px] w-[95vw] p-0 overflow-hidden border-border-light rounded-2xl">
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
                        Test #{selectedTestDetail.test_id}: {selectedTestDetail.test_name}
                      </DialogTitle>
                      <p className="text-xs font-semibold text-muted mt-1">
                        Ordered on {dayjs(selectedTestDetail.ordered_date).format('MMMM D, YYYY')} by Dr. {selectedTestDetail.doctor_first_name} {selectedTestDetail.doctor_last_name}
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
                      {selectedTestDetail.status === 'ordered' ? 'incomplete' : selectedTestDetail.status}
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

                {selectedTestDetail.status === 'completed' && selectedTestDetail.result ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 text-emerald-500" />
                        Results
                      </h4>
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 min-h-[200px]">
                        <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">{selectedTestDetail.result}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form id="result-form" onSubmit={handleComplete} className="space-y-3">
                    <label className="text-sm font-bold text-foreground block">
                      Result / Details
                    </label>
                    <textarea 
                      className="flex min-h-[350px] w-full rounded-xl border border-input bg-surface px-4 py-4 text-base leading-relaxed shadow-inner placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-y"
                      placeholder="Enter the comprehensive medical test results, observations, and notes here..."
                      value={resultInput}
                      onChange={(e) => setResultInput(e.target.value)}
                      required
                      disabled={selectedTestDetail.status === 'cancelled'}
                    />
                  </form>
                )}
              </div>
              
              <div className="p-4 border-t border-border-light bg-surface/50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setSelectedTestId(null)} className="rounded-xl font-bold">
                  {selectedTestDetail.status === 'completed' || selectedTestDetail.status === 'cancelled' ? 'Close' : 'Cancel'}
                </Button>
                {selectedTestDetail.status !== 'completed' && selectedTestDetail.status !== 'cancelled' && (
                  <Button 
                    type="submit" 
                    form="result-form" 
                    className="rounded-xl font-bold"
                    disabled={updateTestMutation.isPending || !resultInput.trim()}
                  >
                    Complete Test
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
