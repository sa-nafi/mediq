import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, ArrowLeft, UserPlus, Search } from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce';

import { patientApi } from '@/api/patient';
import { receptionistApi } from '@/api/receptionist';
import { Button } from '@/components/ui/button';

export function ReceptionistBookAppointmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const doctorId = Number(id);

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [appointmentType, setAppointmentType] = useState('new');
  const [appointmentStatus, setAppointmentStatus] = useState(dayjs().format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') ? 'in_queue' : 'scheduled');
  const [notes, setNotes] = useState('');
  
  // Receptionist specific state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const debouncedPatientSearch = useDebounce(patientSearchQuery, 500);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isCreatingWalkIn, setIsCreatingWalkIn] = useState(false);
  
  // Walk-in form state
  const [walkInForm, setWalkInForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone: '',
    gender: 'M',
  });

  // Fetch doctor schedules
  const { data: schedules, isLoading: loadingSchedules } = useQuery({
    queryKey: ['receptionist', 'doctorSchedules', doctorId],
    queryFn: () => patientApi.getDoctorSchedules(doctorId),
    enabled: !!doctorId,
  });

  // Fetch doctors to get doctor details
  const { data: doctors } = useQuery({
    queryKey: ['patient', 'doctors'], // Reuse the same query key for simplicity
    queryFn: () => patientApi.getDoctors(),
  });
  
  const doctor = (doctors as any[])?.find((d: any) => d.doctor_id === doctorId);

  // Fetch patients for search dropdown
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['receptionist', 'patients', debouncedPatientSearch],
    queryFn: () => receptionistApi.getPatients({ search: debouncedPatientSearch, limit: 5 }),
  });
  const patients = patientsData?.data || [];

  // Fetch availability for the selected date
  const { data: availability } = useQuery({
    queryKey: ['patient', 'doctorAvailability', doctorId, selectedDate],
    queryFn: () => patientApi.getDoctorAvailability(doctorId, selectedDate),
    enabled: !!doctorId && !!selectedDate,
  });

  const createWalkInMutation = useMutation({
    mutationFn: receptionistApi.createWalkInPatient,
    onSuccess: (data) => {
      toast.success('Walk-in patient created!');
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'patients'] });
      setSelectedPatient(data.patient);
      setIsCreatingWalkIn(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create patient');
    },
  });

  const bookMutation = useMutation({
    mutationFn: receptionistApi.bookAppointmentForPatient,
    onSuccess: () => {
      toast.success('Appointment booked successfully!');
      queryClient.invalidateQueries({ queryKey: ['receptionist', 'appointments'] });
      navigate('/receptionist/appointments');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    },
  });

  const handleCreateWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    createWalkInMutation.mutate(walkInForm);
  };

  const handleBook = () => {
    if (!selectedPatient) {
      toast.error("Please select a patient");
      return;
    }
    bookMutation.mutate({
      patient_id: selectedPatient.id,
      doctor_id: Number(doctorId),
      appointment_date: selectedDate,
      type: appointmentType,
      status: appointmentStatus,
      notes: notes,
    });
  };

  if (!doctor) {
    return <div className="p-4">Loading doctor information...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Book Appointment</h1>
          <p className="text-muted mt-1">Book an appointment for a patient with Dr. {doctor.last_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Patient Selection & Doctor Info */}
        <div className="space-y-6 lg:col-span-1">


          {/* Patient Selection Card */}
          <div className="bg-surface border border-border-light rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">Patient Details</h3>
            
            {selectedPatient ? (
              <div className="space-y-4">
                <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-foreground">{selectedPatient.first_name} {selectedPatient.last_name}</h4>
                    <p className="text-xs text-muted mt-1">{selectedPatient.phone || 'No phone'} • DOB: {dayjs(selectedPatient.date_of_birth).format('MMM D, YYYY')}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)} className="text-secondary hover:text-secondary hover:bg-secondary/10">
                    Change
                  </Button>
                </div>
              </div>
            ) : !isCreatingWalkIn ? (
              <div className="space-y-4">
                <div className="flex items-center bg-background border border-border-light rounded-xl h-11 px-3 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary">
                  <Search className="h-4 w-4 text-muted flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search patient by name..."
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none outline-none ml-2 text-sm text-foreground placeholder:text-muted"
                  />
                </div>
                
                {patientSearchQuery && (
                  <div className="bg-background border border-border-light rounded-xl overflow-hidden shadow-sm">
                    {loadingPatients ? (
                      <div className="p-3 text-center text-sm text-muted">Searching...</div>
                    ) : patients.length > 0 ? (
                      <div className="divide-y divide-border-light">
                        {patients.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSelectedPatient(p);
                              setPatientSearchQuery('');
                            }}
                            className="w-full text-left p-3 hover:bg-secondary/5 transition-colors flex flex-col"
                          >
                            <span className="font-medium text-sm">{p.first_name} {p.last_name}</span>
                            <span className="text-xs text-muted">{p.phone || 'No phone'}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-sm text-muted">No patients found.</div>
                    )}
                  </div>
                )}
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-border-light"></div>
                  <span className="flex-shrink-0 mx-4 text-muted text-xs uppercase tracking-wider font-semibold">Or</span>
                  <div className="flex-grow border-t border-border-light"></div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl gap-2 border-dashed border-2" 
                  onClick={() => setIsCreatingWalkIn(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Create Walk-in Patient
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateWalkIn} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">First Name</label>
                  <input required type="text" className="w-full bg-background border border-border-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                    value={walkInForm.first_name} onChange={e => setWalkInForm({...walkInForm, first_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Last Name</label>
                  <input required type="text" className="w-full bg-background border border-border-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                    value={walkInForm.last_name} onChange={e => setWalkInForm({...walkInForm, last_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Date of Birth</label>
                  <input required type="date" className="w-full bg-background border border-border-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                    value={walkInForm.date_of_birth} onChange={e => setWalkInForm({...walkInForm, date_of_birth: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Phone</label>
                  <input type="text" className="w-full bg-background border border-border-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                    value={walkInForm.phone} onChange={e => setWalkInForm({...walkInForm, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Gender</label>
                  <select className="w-full bg-background border border-border-light rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                    value={walkInForm.gender} onChange={e => setWalkInForm({...walkInForm, gender: e.target.value})}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" className="flex-1 rounded-lg" onClick={() => setIsCreatingWalkIn(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" size="sm" className="flex-1 rounded-lg" disabled={createWalkInMutation.isPending}>
                    {createWalkInMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-surface border border-border-light rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
               <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                 <span className="text-xl font-bold">{doctor.first_name[0]}{doctor.last_name[0]}</span>
               </div>
               <div>
                 <h3 className="font-bold">Dr. {doctor.last_name}</h3>
                 <p className="text-xs text-muted">{doctor.department?.name}</p>
               </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Fee:</span>
                <span className="font-semibold">${doctor.consultation_fee}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Date, Type and Confirmation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Schedule Section */}
          <div className="bg-surface border border-border-light rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-secondary" />
              Weekly Routine Schedule
            </h2>
            
            {loadingSchedules ? (
              <p className="text-muted">Loading schedule...</p>
            ) : schedules && schedules.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {schedules.map((schedule: any) => {
                  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return (
                    <div key={schedule.schedule_id} className="bg-background rounded-xl p-3 border border-border-light">
                      <p className="font-bold text-foreground mb-1">{days[schedule.day_of_week]}</p>
                      <p className="text-sm text-muted">
                        {dayjs(schedule.start_time).format('hh:mm A')} - {dayjs(schedule.end_time).format('hh:mm A')}
                      </p>
                      <p className="text-xs text-secondary mt-1">Max Patients: {schedule.max_patients}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted">No schedule available.</p>
            )}
          </div>

          <div className="bg-surface border border-border-light rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">Booking Details</h3>
            
            <div className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2">Appointment Type</label>
                <div className="flex flex-wrap gap-2">
                  {['new', 'follow-up', 'report'].map(type => (
                    <button
                      key={type}
                      onClick={() => setAppointmentType(type)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        appointmentType === type 
                          ? 'bg-secondary text-white shadow-md' 
                          : 'bg-background border border-border-light text-muted hover:border-secondary/50'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2">Select Date</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-background border border-border-light rounded-xl h-11 px-3 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary flex-1">
                    <CalendarIcon className="h-4 w-4 text-muted flex-shrink-0" />
                    <input
                      type="date"
                      min={dayjs().format('YYYY-MM-DD')}
                      max={dayjs().add(2, 'month').format('YYYY-MM-DD')}
                      value={selectedDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setSelectedDate(newDate);
                        setAppointmentStatus(newDate === dayjs().format('YYYY-MM-DD') ? 'in_queue' : 'scheduled');
                      }}
                      className="w-full bg-transparent border-none outline-none ml-2 text-sm text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Availability Info */}
              {selectedDate && (
                <div className="bg-background border border-border-light rounded-2xl p-4 mt-4">
                  <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-secondary" />
                    Availability for {dayjs(selectedDate).format('MMM D, YYYY')}
                  </h4>
                  
                  {availability ? (
                    <div className="space-y-2">
                      <p className="text-emerald-600 font-medium">Doctor is available on this date.</p>
                      <p className="text-xs text-muted mt-2">Note: Exact time is determined by serial number assigned after booking.</p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-xl inline-block">
                      Doctor is not available on this date.
                    </p>
                  )}
                </div>
              )}

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2">Appointment Status</label>
                <div className="flex flex-wrap gap-2">
                  {['scheduled', 'in_queue'].map(status => (
                    <button
                      key={status}
                      onClick={() => setAppointmentStatus(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        appointmentStatus === status 
                          ? 'bg-secondary text-white shadow-md' 
                          : 'bg-background border border-border-light text-muted hover:border-secondary/50'
                      }`}
                    >
                      {status === 'in_queue' ? 'In Queue' : 'Scheduled'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-semibold mb-2">Additional Notes</label>
                <textarea
                  className="w-full bg-background rounded-xl border border-input px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary min-h-[100px]"
                  placeholder="Any specific symptoms or notes? (Optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border-light flex justify-end">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto rounded-xl px-8"
                onClick={handleBook}
                disabled={!availability || availability.current_booked >= availability.max_patients || bookMutation.isPending || !selectedPatient}
              >
                {bookMutation.isPending ? 'Booking...' : 'Confirm Appointment'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
