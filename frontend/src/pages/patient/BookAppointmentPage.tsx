import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, ArrowLeft } from 'lucide-react';

import { patientApi } from '@/api/patient';
import { Button } from '@/components/ui/button';

export function BookAppointmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const doctorId = Number(id);

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [appointmentType, setAppointmentType] = useState('new');
  
  // Fetch doctors to get doctor details
  const { data: doctors } = useQuery({
    queryKey: ['patient', 'doctors'],
    queryFn: () => patientApi.getDoctors(),
  });
  
  const doctor = (doctors as any[])?.find((d: any) => d.doctor_id === doctorId);

  // Fetch doctor schedules
  const { data: schedules, isLoading: loadingSchedules } = useQuery({
    queryKey: ['patient', 'doctorSchedules', doctorId],
    queryFn: () => patientApi.getDoctorSchedules(doctorId),
    enabled: !!doctorId,
  });

  // Fetch availability for the selected date
  const { data: availability, isLoading: loadingAvailability } = useQuery({
    queryKey: ['patient', 'doctorAvailability', doctorId, selectedDate],
    queryFn: () => patientApi.getDoctorAvailability(doctorId, selectedDate),
    enabled: !!doctorId && !!selectedDate,
  });

  const bookMutation = useMutation({
    mutationFn: patientApi.bookAppointment,
    onSuccess: () => {
      toast.success('Appointment booked successfully!');
      queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] });
      navigate('/patient/appointments');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    },
  });

  const handleBook = () => {
    bookMutation.mutate({
      doctor_id: doctorId,
      appointment_date: selectedDate,
      type: appointmentType,
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
          <h1 className="text-2xl font-bold text-foreground">Doctor Details & Booking</h1>
          <p className="text-muted mt-1">View profile and book an appointment</p>
        </div>
      </div>

      {/* Doctor Profile Section */}
      <div className="bg-surface border border-border-light rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <div className="h-24 w-24 rounded-full bg-secondary/10 flex-shrink-0 flex items-center justify-center text-secondary">
          <span className="text-3xl font-bold">{doctor.first_name[0]}{doctor.last_name[0]}</span>
        </div>
        <div className="flex-1 space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Dr. {doctor.first_name} {doctor.last_name}</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{doctor.department?.name}</span>
            {doctor.specialization && (
              <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">{doctor.specialization}</span>
            )}
          </div>
          <p className="text-sm text-muted max-w-2xl mt-2">{doctor.qualifications}</p>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border-light text-sm">
            <div>
              <span className="text-muted">Consultation Fee:</span>
              <span className="font-bold text-foreground ml-2">${doctor.consultation_fee}</span>
            </div>
            <div>
              <span className="text-muted">License:</span>
              <span className="font-medium text-foreground ml-2">{doctor.license_number}</span>
            </div>
          </div>
        </div>
      </div>

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

      <div className="bg-surface border border-border-light rounded-3xl p-6 shadow-sm space-y-8">
        
        {/* Step 1: Date Selection */}
        <section>
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-secondary" />
            1. Select Date
          </h2>
          <input 
            type="date" 
            min={dayjs().format('YYYY-MM-DD')}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto bg-background rounded-xl border border-input px-4 py-2 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </section>

        {/* Step 2: Availability */}
        <section>
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-secondary" />
            2. Availability
          </h2>
          <div className="bg-background rounded-xl p-4 border border-border-light">
            {loadingAvailability ? (
              <p className="text-muted">Checking availability...</p>
            ) : availability ? (
              <div className="space-y-2">
                <p className="text-emerald-600 font-medium">Doctor is available on this date.</p>
                <p className="text-xs text-muted mt-2">Note: Exact time is determined by serial number assigned after booking.</p>
              </div>
            ) : (
              <p className="text-red-500 font-medium">Doctor is not available on this date.</p>
            )}
          </div>
        </section>

        {/* Step 3: Appointment Type */}
        <section>
          <h2 className="text-lg font-bold text-primary mb-4">
            3. Appointment Type
          </h2>
          <div className="flex gap-4">
            {['new', 'follow-up', 'report'].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="appointmentType" 
                  value={type} 
                  checked={appointmentType === type}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  className="text-secondary focus:ring-secondary"
                />
                <span className="capitalize text-foreground">{type.replace('-', ' ')}</span>
              </label>
            ))}
          </div>
        </section>

        <hr className="border-border-light" />

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-border-light">
          <Button size="lg" onClick={handleBook} disabled={bookMutation.isPending || !availability}>
            {bookMutation.isPending ? 'Booking...' : 'Confirm Appointment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
