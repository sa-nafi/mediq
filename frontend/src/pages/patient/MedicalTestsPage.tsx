import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Activity, AlertCircle, FileStack, CheckCircle, FileText, Stethoscope, FlaskConical, ChevronRight } from 'lucide-react';
import { patientApi } from '@/api/patient';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function PatientTestsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: testsData, isLoading, error } = useQuery({
    queryKey: ['patient', 'tests', { page, limit }],
    queryFn: () => patientApi.getTests({ page, limit }),
  });

  const [selectedTest, setSelectedTest] = useState<any>(null);

  const { data: testDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['patient', 'testDetails', selectedTest?.test_id],
    queryFn: () => patientApi.getTestById(selectedTest?.test_id as number),
    enabled: !!selectedTest?.test_id,
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Medical Tests</h1>
          <p className="text-muted mt-0.5 text-sm">View your lab tests and diagnostic reports.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surface rounded-xl animate-pulse border border-border-light" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-red-600 gap-2 shadow-sm">
          <AlertCircle className="h-8 w-8 opacity-80" />
          <p className="text-base font-bold">Failed to load medical tests.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-1 rounded-lg">Try Again</Button>
        </div>
      ) : testsData?.data && testsData.data.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {testsData.data.map((test: any) => (
            <div 
              key={test.test_id} 
              className="bg-surface rounded-xl p-4 shadow-sm border border-border-light flex items-center justify-between cursor-pointer hover:border-purple-200 hover:shadow transition-all group"
              onClick={() => setSelectedTest(test)}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 group-hover:scale-105 group-hover:bg-purple-100 transition-all duration-300">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base mb-0.5">{test.test_name || 'Diagnostic Test'}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                    <span className="inline-flex items-center font-medium bg-background px-2 py-0.5 rounded border border-border-light">
                      {dayjs(test.ordered_date).format('MMM D, YYYY')}
                    </span>
                    <span className="hidden sm:inline text-muted/50">•</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      test.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                      test.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {test.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-purple-600 font-semibold text-xs mr-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                View Details <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-surface border border-border-light rounded-2xl shadow-sm">
          <FileStack className="h-12 w-12 text-muted/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground">No Medical Tests</h3>
          <p className="text-muted mt-2 text-sm max-w-sm mx-auto">
            You don't have any recent medical tests or diagnostic reports.
          </p>
        </div>
      )}

      {testsData?.total_pages > 1 && (
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
            Page {page} of {testsData.total_pages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.min(testsData.total_pages, p + 1))}
            disabled={page >= testsData.total_pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Screen Modal for Details */}
      <Dialog open={!!selectedTest} onOpenChange={(open) => !open && setSelectedTest(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 overflow-hidden border-none shadow-xl">
          {detailsLoading ? (
            <div className="p-12 text-center text-muted flex flex-col items-center justify-center">
              <Activity className="h-8 w-8 animate-bounce text-purple-300 mb-3" />
              <p className="text-sm">Loading medical test details...</p>
            </div>
          ) : testDetails ? (
            <>
              <div className="bg-gradient-to-br from-purple-50 to-white px-6 py-6 border-b border-border-light relative overflow-hidden">
                <div className="absolute -right-4 -top-10 opacity-5 pointer-events-none">
                  <Activity className="h-32 w-32" />
                </div>
                <DialogHeader className="relative z-10">
                  <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-foreground">
                    <div className="h-8 w-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                      <Activity className="h-4 w-4" />
                    </div>
                    {selectedTest.test_name || 'Diagnostic Test'}
                  </DialogTitle>
                  <DialogDescription className="text-sm font-medium mt-1.5 flex items-center gap-2 text-muted">
                    Ordered on {dayjs(selectedTest.ordered_date).format('MMMM D, YYYY')}
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <div className="p-6 space-y-6 bg-surface">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background border border-border-light rounded-xl shadow-sm gap-3">
                  <div>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-0.5">Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      testDetails.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                      testDetails.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {testDetails.status.replace('_', ' ')}
                    </span>
                  </div>
                  {testDetails.completed_date && (
                    <div className="sm:text-right">
                      <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-0.5">Completed On</p>
                      <p className="text-base font-bold text-foreground bg-surface px-3 py-1 rounded border border-border-light inline-block">
                        {dayjs(testDetails.completed_date).format('MMM D, YYYY')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {testDetails.doctor_first_name && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100 hover:shadow-sm transition-all">
                      <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-0.5">Ordered By</p>
                        <p className="text-sm font-bold text-foreground leading-tight">
                          Dr. {testDetails.doctor_first_name} {testDetails.doctor_last_name}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {testDetails.lab_tech_first_name && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100 hover:shadow-sm transition-all">
                      <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
                        <FlaskConical className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-0.5">Performed By</p>
                        <p className="text-sm font-bold text-foreground leading-tight">
                          {testDetails.lab_tech_first_name} {testDetails.lab_tech_last_name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Test Description
                  </h4>
                  <p className="text-sm text-foreground bg-background p-4 rounded-xl border border-border-light leading-relaxed">
                    {testDetails.test_details || 'No additional details provided.'}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" /> Diagnostic Results
                  </h4>
                  <div className="text-sm text-foreground bg-background p-4 rounded-xl border border-border-light whitespace-pre-wrap leading-relaxed shadow-sm">
                    {testDetails.result ? (
                      <span className="font-medium">{testDetails.result}</span>
                    ) : (
                      <span className="text-muted italic">Results are not available yet. Check back later once the test is marked as completed.</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-border-light bg-background flex justify-end items-center">
                <Button size="sm" onClick={() => setSelectedTest(null)} className="rounded-lg px-6 shadow-sm">Close</Button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-red-500 text-sm font-bold bg-red-50">Failed to load medical test details.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
