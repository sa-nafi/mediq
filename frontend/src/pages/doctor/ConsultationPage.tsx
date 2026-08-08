import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { CheckCircle, ChevronLeft, FileText, Pill, Stethoscope, Beaker, ClipboardList, Loader2, Calendar, User, AlignLeft, Activity, ExternalLink, Clock, Printer, AlertCircle } from 'lucide-react';
import { doctorApi } from '@/api/doctor';
import { Button } from '@/components/ui/button';
import { MedicalRecordForm } from '@/components/doctor/MedicalRecordForm';
import { PrescriptionForm, type PrescriptionState } from '@/components/doctor/PrescriptionForm';
import { MedicalTestForm, type MedicalTestItem } from '@/components/doctor/MedicalTestForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ConsultationPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'record' | 'rx' | 'tests'>('record');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unified State
  const [recordState, setRecordState] = useState({ diagnosis: '', treatment: '', notes: '' });
  const [rxState, setRxState] = useState<PrescriptionState>({ instructions: '', items: [] });
  const [testsState, setTestsState] = useState<MedicalTestItem[]>([]);

  // Dialog states
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<number | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  // Filter state
  const [historyFilter, setHistoryFilter] = useState<'all' | 'record' | 'prescription' | 'test'>('all');

  const handlePrint = () => {
    window.print();
  };

  const aptId = parseInt(appointmentId || '0');

  const { data: appointment, isLoading: aptLoading } = useQuery({
    queryKey: ['doctor', 'appointment', aptId],
    queryFn: () => doctorApi.getAppointmentById(aptId),
    enabled: !!aptId,
  });

  const patientId = appointment?.patient_id;

  // History Queries
  const { data: historyRecordsData } = useQuery({
    queryKey: ['doctor', 'history-records', patientId],
    queryFn: () => doctorApi.getMedicalRecords({ patient_id: patientId, consultation_appointment_id: parseInt(appointmentId || '0'), limit: 10 }),
    enabled: !!patientId && !!appointmentId,
  });

  const { data: historyRxData } = useQuery({
    queryKey: ['doctor', 'history-rx', patientId],
    queryFn: () => doctorApi.getPrescriptions({ patient_id: patientId, consultation_appointment_id: parseInt(appointmentId || '0'), limit: 10 }),
    enabled: !!patientId && !!appointmentId,
  });

  const { data: historyTestsData } = useQuery({
    queryKey: ['doctor', 'history-tests', patientId],
    queryFn: () => doctorApi.getMedicalTests({ patient_id: patientId, consultation_appointment_id: parseInt(appointmentId || '0'), limit: 10 }),
    enabled: !!patientId && !!appointmentId,
  });

  const { data: selectedRecordDetail, isLoading: isLoadingRecord } = useQuery({
    queryKey: ['doctor', 'medical-record', selectedRecordId],
    queryFn: () => doctorApi.getMedicalRecordById(selectedRecordId!),
    enabled: !!selectedRecordId,
  });

  const { data: selectedPrescriptionDetail, isLoading: isLoadingPrescription } = useQuery({
    queryKey: ['doctor', 'prescription', selectedPrescriptionId],
    queryFn: () => doctorApi.getPrescriptionById(selectedPrescriptionId!),
    enabled: !!selectedPrescriptionId,
  });

  const { data: selectedTestDetail, isLoading: isLoadingTest } = useQuery({
    queryKey: ['doctor', 'medical-test', selectedTestId],
    queryFn: () => doctorApi.getMedicalTestById(selectedTestId!),
    enabled: !!selectedTestId,
  });

  const historyItems = useMemo(() => {
    if (!historyRecordsData && !historyRxData && !historyTestsData) return [];

    const items: any[] = [];
    
    (historyRecordsData?.data || []).forEach((r: any) => {
      items.push({ type: 'record', date: dayjs(r.record_date), data: r });
    });
    
    (historyRxData?.data || []).forEach((r: any) => {
      items.push({ type: 'prescription', date: dayjs(r.prescription_date), data: r });
    });
    
    (historyTestsData?.data || []).forEach((r: any) => {
      items.push({ type: 'test', date: dayjs(r.test_date), data: r });
    });

    return items.sort((a, b) => b.date.valueOf() - a.date.valueOf());
  }, [historyRecordsData, historyRxData, historyTestsData]);

  const filteredHistoryItems = useMemo(() => {
    if (historyFilter === 'all') return historyItems;
    return historyItems.filter(item => item.type === historyFilter);
  }, [historyItems, historyFilter]);

  const handleComplete = async () => {
    if (!recordState.diagnosis.trim()) {
      toast.error('Diagnosis is required in Medical Record to complete consultation');
      setActiveTab('record');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 1. Create medical record
      const recordData = await doctorApi.createMedicalRecord({
        patient_id: patientId,
        appointment_id: aptId,
        diagnosis: recordState.diagnosis,
        treatment: recordState.treatment || undefined,
        notes: recordState.notes || undefined,
      });

      const recordId = recordData.record_id;

      // 2. Create prescription
      if (rxState.items.length > 0) {
        await doctorApi.createPrescription({
          record_id: recordId,
          appointment_id: aptId,
          instructions: rxState.instructions || undefined,
          items: rxState.items.map(i => ({
            medicine_id: i.medicine_id,
            dosage: i.dosage,
            quantity: i.quantity,
            duration_days: i.duration_days
          }))
        });
      }

      // 3. Order medical tests
      if (testsState.length > 0) {
        for (const test of testsState) {
          await doctorApi.orderMedicalTest({
            patient_id: patientId,
            record_id: recordId,
            appointment_id: aptId,
            test_name: test.test_name,
            test_details: test.test_details || undefined,
          });
        }
      }

      // 4. Update appointment status
      await doctorApi.updateAppointmentStatus(aptId, 'completed');

      toast.success('Consultation completed successfully');
      queryClient.invalidateQueries({ queryKey: ['doctor', 'queue'] });
      navigate('/doctor/queue');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete consultation');
      setIsSubmitting(false);
    }
  };

  if (aptLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent"></div>
          <p className="text-sm font-medium text-muted">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="py-16 text-center">
        <h3 className="text-lg font-bold">Appointment not found</h3>
        <Button variant="link" onClick={() => navigate('/doctor/queue')}>Go back to Queue</Button>
      </div>
    );
  }

  const patient = appointment.patient;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/doctor/queue')} className="h-9 w-9 rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              Consultation
              <span className="text-xs font-bold px-2 py-1 bg-secondary/10 text-secondary rounded-lg uppercase tracking-wider border border-secondary/20">
                Serial: {appointment.serial_number}
              </span>
            </h1>
            <p className="text-muted mt-0.5 text-sm font-medium">
              {patient?.first_name} {patient?.last_name} • {appointment.type}
            </p>
          </div>
        </div>
        <Button 
          onClick={handleComplete}
          disabled={isSubmitting || appointment.status === 'completed'}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          {appointment.status === 'completed' ? 'Completed' : 'Complete Appointment'}
        </Button>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left Pane: Patient History Timeline */}
        <div className="w-[35%] xl:w-[30%] flex flex-col bg-surface border border-border-light rounded-2xl shadow-sm overflow-hidden shrink-0">
          <div className="p-4 border-b border-border-light bg-secondary/5 shrink-0 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-secondary" />
              <h2 className="font-bold text-foreground">Patient History</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Button size="sm" variant={historyFilter === 'all' ? 'default' : 'outline'} onClick={() => setHistoryFilter('all')} className="h-7 text-[10px] rounded-full px-3">All</Button>
              <Button size="sm" variant={historyFilter === 'record' ? 'default' : 'outline'} onClick={() => setHistoryFilter('record')} className="h-7 text-[10px] rounded-full px-3 gap-1"><FileText className="h-3 w-3" /> Records</Button>
              <Button size="sm" variant={historyFilter === 'prescription' ? 'default' : 'outline'} onClick={() => setHistoryFilter('prescription')} className="h-7 text-[10px] rounded-full px-3 gap-1"><Pill className="h-3 w-3" /> Rx</Button>
              <Button size="sm" variant={historyFilter === 'test' ? 'default' : 'outline'} onClick={() => setHistoryFilter('test')} className="h-7 text-[10px] rounded-full px-3 gap-1"><Beaker className="h-3 w-3" /> Tests</Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredHistoryItems.length > 0 ? (
              filteredHistoryItems.map((item, idx) => (
                <div 
                  key={`${item.type}-${idx}`} 
                  className="bg-background border border-border-light rounded-xl p-4 shadow-sm relative overflow-hidden cursor-pointer hover:border-secondary/50 hover:shadow-md transition-all group"
                  onClick={() => {
                    if (item.type === 'record') setSelectedRecordId(item.data.record_id);
                    else if (item.type === 'prescription') setSelectedPrescriptionId(item.data.prescription_id);
                    else if (item.type === 'test') setSelectedTestId(item.data.test_id);
                  }}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    item.type === 'record' ? 'bg-blue-400' : 
                    item.type === 'prescription' ? 'bg-rose-400' : 'bg-amber-400'
                  }`} />
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-muted bg-surface border border-border-light px-2 py-1 rounded">
                      {item.date.format('MMM D, YYYY')}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted uppercase">
                      {item.type === 'record' && <FileText className="h-3 w-3 text-blue-500" />}
                      {item.type === 'prescription' && <Pill className="h-3 w-3 text-rose-500" />}
                      {item.type === 'test' && <Beaker className="h-3 w-3 text-amber-500" />}
                      {item.type}
                    </div>
                  </div>

                  <div className="mt-3">
                    {item.type === 'record' && (
                      <div className="bg-surface rounded-lg p-2 border border-border-light group-hover:bg-secondary/5 transition-colors">
                        <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Diagnosis</span>
                        <p className="text-sm font-medium text-foreground mt-1 truncate">{item.data.diagnosis || 'None'}</p>
                      </div>
                    )}

                    {item.type === 'prescription' && (
                      <div className="bg-surface rounded-lg p-2 border border-border-light group-hover:bg-secondary/5 transition-colors">
                        <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Prescribed by</span>
                        <p className="text-sm font-medium text-foreground mt-1 truncate">Dr. {item.data.doctor_first_name} {item.data.doctor_last_name}</p>
                      </div>
                    )}

                    {item.type === 'test' && (
                      <div className="flex items-center justify-between bg-surface rounded-lg p-2 border border-border-light group-hover:bg-secondary/5 transition-colors">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Test Name</span>
                          <p className="text-sm font-medium text-foreground mt-1 truncate">{item.data.test_name}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          item.data.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.data.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <FileText className="h-10 w-10 text-muted/30 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">No history</p>
                <p className="text-xs text-muted mt-1">This patient has no previous records.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Current Consultation Form */}
        <div className="flex-1 flex flex-col bg-surface border border-border-light rounded-2xl shadow-sm overflow-hidden min-h-0">
          <div className="flex border-b border-border-light shrink-0">
            <button
              className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'record' ? 'border-secondary text-secondary bg-secondary/5' : 'border-transparent text-muted hover:bg-surface/50'
              }`}
              onClick={() => setActiveTab('record')}
            >
              <Stethoscope className="h-4 w-4" />
              1. Medical Record
              {recordState.diagnosis && <CheckCircle className="h-4 w-4 text-emerald-500" />}
            </button>
            <button
              className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'rx' ? 'border-secondary text-secondary bg-secondary/5' : 'border-transparent text-muted hover:bg-surface/50'
              }`}
              onClick={() => setActiveTab('rx')}
            >
              <Pill className="h-4 w-4" />
              2. Prescription
              {rxState.items.length > 0 && <span className="bg-secondary text-white text-[10px] px-1.5 py-0.5 rounded-full">{rxState.items.length}</span>}
            </button>
            <button
              className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'tests' ? 'border-secondary text-secondary bg-secondary/5' : 'border-transparent text-muted hover:bg-surface/50'
              }`}
              onClick={() => setActiveTab('tests')}
            >
              <Beaker className="h-4 w-4" />
              3. Order Tests
              {testsState.length > 0 && <span className="bg-secondary text-white text-[10px] px-1.5 py-0.5 rounded-full">{testsState.length}</span>}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              {activeTab === 'record' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-foreground">Medical Record</h2>
                    <p className="text-sm text-muted">Record the diagnosis and treatment for this visit.</p>
                  </div>
                  <MedicalRecordForm 
                    value={recordState}
                    onChange={setRecordState}
                  />
                </div>
              )}
              
              {activeTab === 'rx' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-foreground">Write Prescription</h2>
                    <p className="text-sm text-muted">Add medicines for the patient.</p>
                  </div>
                  <PrescriptionForm 
                    value={rxState}
                    onChange={setRxState}
                  />
                </div>
              )}
              
              {activeTab === 'tests' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-foreground">Order Medical Tests</h2>
                    <p className="text-sm text-muted">Order lab tests for the patient.</p>
                  </div>
                  <MedicalTestForm 
                    value={testsState}
                    onChange={setTestsState}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Record Dialog */}
      <Dialog open={!!selectedRecordId} onOpenChange={(open) => !open && setSelectedRecordId(null)}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-border-light rounded-2xl">
          {isLoadingRecord || !selectedRecordDetail ? (
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

      {/* Prescription Dialog */}
      <Dialog open={!!selectedPrescriptionId} onOpenChange={(open) => !open && setSelectedPrescriptionId(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 overflow-hidden border-none shadow-xl print:hidden">
          {isLoadingPrescription || !selectedPrescriptionDetail ? (
            <div className="p-12 text-center text-muted flex flex-col items-center justify-center">
              <Pill className="h-8 w-8 animate-bounce text-rose-300 mb-3" />
              <p className="text-sm">Loading prescription details...</p>
            </div>
          ) : (
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
                    Prescription #{selectedPrescriptionDetail.prescription_id}
                  </DialogTitle>
                  <DialogDescription className="text-sm font-medium mt-1.5 flex items-center gap-2 text-muted">
                    Issued on {dayjs(selectedPrescriptionDetail.prescription_date).format('MMMM D, YYYY')}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-6 space-y-6 bg-surface">
                <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-0.5">Patient Details</p>
                      <p className="text-base font-bold text-foreground">
                        {selectedPrescriptionDetail.patient_first_name} {selectedPrescriptionDetail.patient_last_name}
                      </p>
                      <p className="text-xs text-muted font-medium mt-0.5">ID: {selectedPrescriptionDetail.patient_id}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex gap-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200">
                    <Printer className="h-3.5 w-3.5" /> Print
                  </Button>
                </div>

                {selectedPrescriptionDetail.instructions && (
                  <div>
                    <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> General Instructions
                    </h4>
                    <p className="text-sm text-foreground bg-amber-50 p-4 rounded-xl border border-amber-100/60 leading-relaxed shadow-sm">
                      {selectedPrescriptionDetail.instructions}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5" /> Prescribed Medications
                  </h4>
                  <div className="space-y-3">
                    {selectedPrescriptionDetail.items?.map((item: any) => (
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
                <Button size="sm" onClick={() => setSelectedPrescriptionId(null)} className="rounded-lg px-6">Close</Button>
              </div>
              <div className="px-6 py-4 border-t border-border-light bg-background justify-end items-center hidden sm:flex">
                <Button size="sm" onClick={() => setSelectedPrescriptionId(null)} className="rounded-lg px-6 shadow-sm">Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden Print Layout for Prescription */}
      {selectedPrescriptionDetail && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] text-black p-6">
          <div className="max-w-4xl mx-auto text-sm">
            <div className="flex justify-between items-end border-b-2 border-black pb-3 mb-4">
              <div>
                <h1 className="text-2xl font-black text-black tracking-tight mb-1">Noor Healthcare</h1>
                <p className="text-gray-700 text-xs">123 Health Ave, Medical District</p>
                <p className="text-gray-700 text-xs">+1 (555) 123-4567 | noorhealth.com</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-black mb-1">Prescription</h2>
                <p className="text-gray-700 text-xs">Ref: #{selectedPrescriptionDetail.prescription_id}</p>
                <p className="text-gray-700 text-xs">Date: {dayjs(selectedPrescriptionDetail.prescription_date).format('MMMM D, YYYY')}</p>
              </div>
            </div>

            <div className="flex justify-between items-start border-b border-gray-300 pb-3 mb-4">
              <div className="w-1/2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Patient Information</p>
                <p className="text-base font-bold text-black">{selectedPrescriptionDetail.patient_first_name} {selectedPrescriptionDetail.patient_last_name}</p>
                <p className="text-xs text-gray-700 mt-1">Patient ID: #{selectedPrescriptionDetail.patient_id}</p>
                {selectedPrescriptionDetail.diagnosis && (
                  <p className="text-xs text-gray-700 mt-1"><span className="font-semibold">Diagnosis:</span> {selectedPrescriptionDetail.diagnosis}</p>
                )}
              </div>
              <div className="w-1/2 text-right">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Prescribing Physician</p>
                <p className="text-base font-bold text-black">Dr. {selectedPrescriptionDetail.doctor_first_name} {selectedPrescriptionDetail.doctor_last_name}</p>
              </div>
            </div>

            {selectedPrescriptionDetail.instructions && (
              <div className="mb-4">
                <h3 className="text-[10px] font-bold text-black uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">General Instructions</h3>
                <p className="text-black text-xs leading-relaxed">{selectedPrescriptionDetail.instructions}</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-[10px] font-bold text-black uppercase tracking-widest border-b border-gray-200 pb-1 mb-2">Rx / Medications</h3>
              <div className="space-y-3">
                {selectedPrescriptionDetail.items?.map((item: any, index: number) => (
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

            <div className="mt-10 pt-4 flex justify-end">
              <div className="text-center w-48">
                <div className="border-b border-black mb-1 h-8"></div>
                <p className="font-bold text-black text-xs">Signature</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Dr. {selectedPrescriptionDetail.doctor_first_name} {selectedPrescriptionDetail.doctor_last_name}</p>
              </div>
            </div>

            <div className="mt-6 text-center text-[10px] text-gray-400 font-medium">
              This is a digitally generated prescription.
            </div>
          </div>
        </div>
      )}

      {/* Test Dialog */}
      <Dialog open={!!selectedTestId} onOpenChange={(open) => !open && setSelectedTestId(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border-light rounded-2xl">
          {isLoadingTest || !selectedTestDetail ? (
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
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      selectedTestDetail.status === 'completed' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                      selectedTestDetail.status === 'cancelled' ? 'text-red-700 bg-red-50 border-red-200' :
                      'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
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
