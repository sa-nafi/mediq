import type { LucideIcon } from 'lucide-react';
import {
  Droplets,
  ScanLine,
  HeartPulse,
  Microscope,
  ShieldCheck,
  Baby,
  Dumbbell,
  Activity,
  Stethoscope,
  FlaskConical,
} from 'lucide-react';

export interface DiagnosticService {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const diagnosticServices: DiagnosticService[] = [
  {
    id: 'blood-tests',
    title: 'Blood Tests',
    description: 'Comprehensive blood analysis including CBC, metabolic panels, and specialized markers.',
    icon: Droplets,
    color: 'text-red-500',
  },
  {
    id: 'imaging-radiology',
    title: 'Imaging & Radiology',
    description: 'Advanced imaging services including X-ray, ultrasound, and diagnostic scans.',
    icon: ScanLine,
    color: 'text-blue-500',
  },
  {
    id: 'cardiac-diagnostics',
    title: 'Cardiac Diagnostics',
    description: 'Heart health assessments including ECG, echo, and stress testing.',
    icon: HeartPulse,
    color: 'text-pink-500',
  },
  {
    id: 'pathology',
    title: 'Pathology',
    description: 'Tissue analysis, biopsies, and histopathological examinations.',
    icon: Microscope,
    color: 'text-purple-500',
  },
  {
    id: 'health-checkups',
    title: 'Health Checkups',
    description: 'Complete wellness packages for preventive health monitoring.',
    icon: ShieldCheck,
    color: 'text-emerald-500',
  },
  {
    id: 'womens-health',
    title: "Women's Health",
    description: 'Specialized diagnostics for reproductive and hormonal health.',
    icon: Baby,
    color: 'text-rose-400',
  },
  {
    id: 'mens-health',
    title: "Men's Health",
    description: 'Targeted tests for prostate, testosterone, and male wellness.',
    icon: Dumbbell,
    color: 'text-sky-500',
  },
  {
    id: 'diabetes-screening',
    title: 'Diabetes Screening',
    description: 'Blood sugar, HbA1c, and comprehensive diabetes risk assessments.',
    icon: Activity,
    color: 'text-amber-500',
  },
  {
    id: 'preventive-health',
    title: 'Preventive Health',
    description: 'Proactive health screenings to detect risks early.',
    icon: Stethoscope,
    color: 'text-teal-500',
  },
  {
    id: 'specialized-diagnostics',
    title: 'Specialized Diagnostics',
    description: 'Advanced laboratory tests for specific clinical requirements.',
    icon: FlaskConical,
    color: 'text-indigo-500',
  },
];
