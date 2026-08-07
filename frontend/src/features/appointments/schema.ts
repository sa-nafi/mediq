import { z } from 'zod';

export const appointmentSchema = z.object({
  patientName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number is too long')
    .regex(/^[+]?[\d\s-]+$/, 'Please enter a valid phone number'),
  preferredDate: z
    .string()
    .min(1, 'Please select a preferred date'),
  preferredTime: z
    .string()
    .min(1, 'Please select a preferred time'),
  service: z
    .string()
    .min(1, 'Please select a service or test'),
  message: z
    .string()
    .max(500, 'Message is too long')
    .optional(),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

export const serviceOptions = [
  'Complete Health Checkup',
  'Blood Test (CBC)',
  'Diabetes Screening',
  'Lipid Profile',
  'Thyroid Profile',
  'Liver Function Test',
  'Kidney Function Test',
  'Heart Health Package',
  "Women's Wellness",
  "Men's Wellness",
  'Senior Health Checkup',
  'Chest X-Ray',
  'Abdominal Ultrasound',
  'ECG',
  'Other',
] as const;

export const timeSlots = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
] as const;
