import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Clock, User, Mail, Phone, MessageSquare, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppointmentStore } from '@/store/appointment-store';
import {
  appointmentSchema,
  type AppointmentFormData,
  serviceOptions,
  timeSlots,
} from '@/features/appointments/schema';

export function BookAppointmentModal() {
  const { isModalOpen, closeModal } = useAppointmentStore();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientName: '',
      email: '',
      phone: '',
      preferredDate: '',
      preferredTime: '',
      service: '',
      message: '',
    },
  });

  const onSubmit = async (_data: AppointmentFormData) => {
    // Simulate API call — will connect to Go backend via TanStack Query
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast.success('Appointment request submitted!', {
      description: 'We will contact you shortly to confirm your booking.',
    });
    reset();
    closeModal();
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Book an Appointment</DialogTitle>
          <DialogDescription>
            Fill in your details and we'll confirm your booking within 24 hours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 mt-4">
          {/* Patient Name */}
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-foreground mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="patientName"
              icon={<User className="h-4 w-4" />}
              placeholder="Enter your full name"
              {...register('patientName')}
            />
            {errors.patientName && (
              <p className="text-xs text-red-500 mt-1" role="alert">{errors.patientName.message}</p>
            )}
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                icon={<Mail className="h-4 w-4" />}
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1" role="alert">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <Input
                id="phone"
                type="tel"
                icon={<Phone className="h-4 w-4" />}
                placeholder="+8801712341234"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1" role="alert">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="preferredDate" className="block text-sm font-medium text-foreground mb-1.5">
                Preferred Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="preferredDate"
                type="date"
                icon={<CalendarDays className="h-4 w-4" />}
                min={getTodayDate()}
                {...register('preferredDate')}
              />
              {errors.preferredDate && (
                <p className="text-xs text-red-500 mt-1" role="alert">{errors.preferredDate.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="preferredTime" className="block text-sm font-medium text-foreground mb-1.5">
                Preferred Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted">
                  <Clock className="h-4 w-4" />
                </div>
                <select
                  id="preferredTime"
                  className="flex h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-4 py-2.5 text-sm text-foreground transition-colors focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none cursor-pointer"
                  {...register('preferredTime')}
                >
                  <option value="">Select time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              {errors.preferredTime && (
                <p className="text-xs text-red-500 mt-1" role="alert">{errors.preferredTime.message}</p>
              )}
            </div>
          </div>

          {/* Service */}
          <div>
            <label htmlFor="service" className="block text-sm font-medium text-foreground mb-1.5">
              Service / Test <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted">
                <Stethoscope className="h-4 w-4" />
              </div>
              <select
                id="service"
                className="flex h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-4 py-2.5 text-sm text-foreground transition-colors focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 appearance-none cursor-pointer"
                {...register('service')}
              >
                <option value="">Select a service</option>
                {serviceOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            {errors.service && (
              <p className="text-xs text-red-500 mt-1" role="alert">{errors.service.message}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1.5">
              Additional Notes
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute top-3 left-0 flex items-start pl-4 text-muted">
                <MessageSquare className="h-4 w-4" />
              </div>
              <textarea
                id="message"
                rows={3}
                className="flex w-full rounded-xl border border-border bg-surface pl-11 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted transition-colors focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 resize-none"
                placeholder="Any special requirements or notes..."
                {...register('message')}
              />
            </div>
            {errors.message && (
              <p className="text-xs text-red-500 mt-1" role="alert">{errors.message.message}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button type="submit" variant="accent" size="lg" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Appointment'}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
