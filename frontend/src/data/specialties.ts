export interface Specialty {
  id: string;
  name: string;
  description: string;
  icon: string; // Since we don't have SVGs yet, we can map these in the component or use lucide-react names. Let's just use string names that map to Lucide icons.
}

export const specialties: Specialty[] = [
  { id: 'cardiac-care', name: 'Cardiac Care', description: 'Heart health treatment', icon: 'Heart' },
  { id: 'dentistry', name: 'Dentistry', description: 'Dental Care Solutions', icon: 'Smile' },
  { id: 'gastrosciences', name: 'Gastrosciences', description: 'Digestive health care.', icon: 'Stethoscope' },
  { id: 'neuroscience', name: 'Neuroscience', description: 'Brain and nerve care.', icon: 'Brain' },
  { id: 'orthopaedics', name: 'Orthopaedics', description: 'Bone and joint care.', icon: 'Activity' },
  { id: 'liver-care', name: 'Liver Care', description: 'Liver Health and Transplant Care', icon: 'Thermometer' },
  { id: 'renal-care', name: 'Renal Care', description: 'Kidney health treatment', icon: 'Droplet' },
  { id: 'gynaecology', name: 'Gynaecology', description: 'Gynaecological Care Solutions', icon: 'User' },
  { id: 'paediatric-care', name: 'Paediatric Care', description: 'Child health services', icon: 'Baby' },
];
