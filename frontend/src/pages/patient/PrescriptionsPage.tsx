import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Pill, AlertCircle, FileStack, ExternalLink, Clock, Printer, Download, Stethoscope, ChevronRight } from 'lucide-react';
import { patientApi } from '@/api/patient';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function PatientPrescriptionsPage() {
  const { data: prescriptions, isLoading, error } = useQuery({
    queryKey: ['patient', 'prescriptions'],
    queryFn: patientApi.getPrescriptions,
  });

  const [selectedRxId, setSelectedRxId] = useState<number | null>(null);

  // Use a separate query to fetch the detail of the selected prescription
  const { data: rxDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['patient', 'prescription', selectedRxId],
    queryFn: () => patientApi.getPrescriptionById(selectedRxId!),
    enabled: !!selectedRxId,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Prescriptions</h1>
          <p className="text-muted mt-0.5 text-sm">View your current and past medication prescriptions.</p>
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
          <p className="text-base font-bold">Failed to load prescriptions.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-1 rounded-lg">Try Again</Button>
        </div>
      ) : prescriptions && prescriptions.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 print:hidden">
          {prescriptions.map((rx: any) => (
            <div 
              key={rx.prescription_id} 
              className="bg-surface rounded-xl p-4 shadow-sm border border-border-light flex items-center justify-between cursor-pointer hover:border-rose-200 hover:shadow transition-all group"
              onClick={() => setSelectedRxId(rx.prescription_id)}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 group-hover:scale-105 group-hover:bg-rose-100 transition-all duration-300">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base mb-0.5">Prescription #{rx.prescription_id}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                    <span className="inline-flex items-center font-medium bg-background px-2 py-0.5 rounded border border-border-light">
                      {dayjs(rx.prescription_date).format('MMM D, YYYY')}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-foreground/80">
                      <Stethoscope className="h-3 w-3" />
                      Dr. {rx.doctor_first_name} {rx.doctor_last_name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-rose-600 font-semibold text-xs mr-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                View Details <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-surface border border-border-light rounded-2xl shadow-sm print:hidden">
          <FileStack className="h-12 w-12 text-muted/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground">No Prescriptions</h3>
          <p className="text-muted mt-2 text-sm max-w-sm mx-auto">
            You don't have any prescriptions in the system yet.
          </p>
        </div>
      )}

      {/* Screen Modal for Details */}
      <Dialog open={!!selectedRxId} onOpenChange={(open) => !open && setSelectedRxId(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 overflow-hidden border-none shadow-xl print:hidden">
          {isLoadingDetail ? (
            <div className="p-12 text-center text-muted flex flex-col items-center justify-center">
              <Pill className="h-8 w-8 animate-bounce text-rose-300 mb-3" />
              <p className="text-sm">Loading prescription details...</p>
            </div>
          ) : rxDetail ? (
            <>
              <div className="bg-gradient-to-br from-rose-50 to-white px-6 py-6 border-b border-border-light relative overflow-hidden">
                <div className="absolute -right-4 -top-10 opacity-5 pointer-events-none">
                  <Pill className="h-32 w-32" />
                </div>
                <DialogHeader className="relative z-10">
                  <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-foreground">
                    <div className="h-8 w-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center shadow-sm">
                      <Pill className="h-4 w-4" />
                    </div>
                    Prescription #{rxDetail.prescription_id}
                  </DialogTitle>
                  <DialogDescription className="text-sm font-medium mt-1.5 flex items-center gap-2 text-muted">
                    Issued on {dayjs(rxDetail.prescription_date).format('MMMM D, YYYY')}
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <div className="p-6 space-y-6 bg-surface">
                <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-0.5">Prescribed by</p>
                      <p className="text-base font-bold text-foreground">
                        Dr. {rxDetail.doctor_first_name} {rxDetail.doctor_last_name}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex gap-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200">
                    <Printer className="h-3.5 w-3.5" /> Export / Print
                  </Button>
                </div>

                {rxDetail.instructions && (
                  <div>
                    <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> General Instructions
                    </h4>
                    <p className="text-sm text-foreground bg-amber-50 p-4 rounded-xl border border-amber-100/60 leading-relaxed shadow-sm">
                      {rxDetail.instructions}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5" /> Prescribed Medications
                  </h4>
                  <div className="space-y-3">
                    {rxDetail.items?.map((item: any) => (
                      <div key={item.prescription_item_id} className="bg-white rounded-xl p-4 border border-border-light shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-extrabold text-foreground text-base">{item.medicine_name}</h5>
                            {item.medicine_info_link && (
                              <a 
                                href={item.medicine_info_link} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 hover:bg-primary hover:text-white transition-colors ml-1"
                                title="View Medicine Info"
                              >
                                Info <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                          <p className="text-[13px] font-medium text-muted bg-background inline-block px-2.5 py-0.5 rounded border border-border-light">{item.dosage}</p>
                        </div>
                        <div className="flex items-center gap-6 text-sm bg-background p-2.5 rounded-lg border border-border-light shrink-0">
                          <div className="text-center">
                            <p className="text-[9px] text-muted font-bold uppercase tracking-wider mb-0.5">Quantity</p>
                            <p className="font-bold text-foreground text-sm">
                              {item.quantity}
                            </p>
                          </div>
                          <div className="w-px h-6 bg-border-light" />
                          <div className="text-center">
                            <p className="text-[9px] text-muted font-bold uppercase tracking-wider mb-0.5">Duration</p>
                            <p className="font-bold text-foreground flex items-center justify-center gap-1 text-sm">
                              <Clock className="h-3.5 w-3.5 text-muted" />
                              {item.duration_days} days
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-border-light bg-background flex justify-between items-center sm:hidden">
                 <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 rounded-lg">
                    <Printer className="h-4 w-4" /> Print
                 </Button>
                 <Button size="sm" onClick={() => setSelectedRxId(null)} className="rounded-lg px-6">Close</Button>
              </div>
              <div className="px-6 py-4 border-t border-border-light bg-background justify-end items-center hidden sm:flex">
                <Button size="sm" onClick={() => setSelectedRxId(null)} className="rounded-lg px-6 shadow-sm">Close</Button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-red-500 text-sm font-bold bg-red-50">Failed to load prescription details.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden Print Layout */}
      {rxDetail && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] text-black bg-white p-6">
          <div className="max-w-4xl mx-auto text-sm">
            {/* Print Header */}
            <div className="flex justify-between items-end border-b-2 border-black pb-3 mb-4">
              <div>
                <h1 className="text-2xl font-black text-black tracking-tight mb-1">Noor Healthcare</h1>
                <p className="text-gray-700 text-xs">123 Health Ave, Medical District</p>
                <p className="text-gray-700 text-xs">+1 (555) 123-4567 | noorhealth.com</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-black mb-1">Prescription</h2>
                <p className="text-gray-700 text-xs">Ref: #{rxDetail.prescription_id}</p>
                <p className="text-gray-700 text-xs">Date: {dayjs(rxDetail.prescription_date).format('MMMM D, YYYY')}</p>
              </div>
            </div>

            {/* Print Patient & Doctor Info */}
            <div className="flex justify-between items-start border-b border-gray-300 pb-3 mb-4">
              <div className="w-1/2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Patient Information</p>
                <p className="text-base font-bold text-black">{rxDetail.patient_first_name} {rxDetail.patient_last_name}</p>
                <p className="text-xs text-gray-700 mt-1">Patient ID: #{rxDetail.patient_id}</p>
                {rxDetail.diagnosis && (
                  <p className="text-xs text-gray-700 mt-1"><span className="font-semibold">Diagnosis:</span> {rxDetail.diagnosis}</p>
                )}
              </div>
              <div className="w-1/2 text-right">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Prescribing Physician</p>
                <p className="text-base font-bold text-black">Dr. {rxDetail.doctor_first_name} {rxDetail.doctor_last_name}</p>
              </div>
            </div>

            {/* Print Instructions */}
            {rxDetail.instructions && (
              <div className="mb-4">
                <h3 className="text-[10px] font-bold text-black uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">General Instructions</h3>
                <p className="text-black text-xs leading-relaxed">{rxDetail.instructions}</p>
              </div>
            )}

            {/* Print Medications */}
            <div className="mb-6">
              <h3 className="text-[10px] font-bold text-black uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">Rx / Medications</h3>
              <div className="space-y-3">
                {rxDetail.items?.map((item: any, index: number) => (
                  <div key={item.prescription_item_id} className="flex justify-between items-start border-b border-dashed border-gray-200 pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-black mb-0.5">{index + 1}. {item.medicine_name}</h4>
                      <p className="text-gray-800 text-xs">Sig: {item.dosage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-black font-bold text-sm mb-0.5">Dispense: {item.quantity}</p>
                      <p className="text-gray-600 text-xs">For {item.duration_days} days</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Print Signature Footer */}
            <div className="mt-10 pt-4 flex justify-end">
              <div className="text-center w-48">
                <div className="border-b border-black mb-1 h-8"></div>
                <p className="font-bold text-black text-xs">Signature</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Dr. {rxDetail.doctor_first_name} {rxDetail.doctor_last_name}</p>
              </div>
            </div>
            
            <div className="mt-6 text-center text-[10px] text-gray-400 font-medium">
              This is a digitally generated prescription.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
