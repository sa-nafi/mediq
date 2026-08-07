import doctorFemaleImg from '@/assets/doctor_female.jpg';
import doctorMaleImg from '@/assets/doctor_male.jpg';

export interface Doctor {
  id: string;
  name: string;
  specialtyId: string;
  specialtyName: string;
  image: string;
  qualifications: string;
  experience: string;
  about: string;
  availability: string;
  rating: number;
  reviews: number;
}

export const doctors: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr. Sarah Jenkins',
    specialtyId: 'cardiac-care',
    specialtyName: 'Cardiac Care',
    image: doctorFemaleImg,
    qualifications: 'MD, FACC, PhD in Cardiology',
    experience: '15+ Years',
    about: 'Dr. Sarah Jenkins is a renowned cardiologist specializing in interventional cardiology and advanced heart failure treatments. She is dedicated to providing compassionate, comprehensive care for patients with complex heart conditions.',
    availability: 'Mon, Wed, Fri (9:00 AM - 4:00 PM)',
    rating: 4.9,
    reviews: 128
  },
  {
    id: 'd2',
    name: 'Dr. Michael Chen',
    specialtyId: 'neuroscience',
    specialtyName: 'Neuroscience',
    image: doctorMaleImg,
    qualifications: 'MD, PhD, Board Certified Neurologist',
    experience: '12+ Years',
    about: 'Dr. Michael Chen specializes in treating neurological disorders, including stroke, epilepsy, and movement disorders. He utilizes the latest advanced diagnostic tools to tailor treatments for his patients.',
    availability: 'Tue, Thu (10:00 AM - 5:00 PM)',
    rating: 4.8,
    reviews: 94
  },
  {
    id: 'd3',
    name: 'Dr. Emily Roberts',
    specialtyId: 'paediatric-care',
    specialtyName: 'Paediatric Care',
    image: doctorFemaleImg,
    qualifications: 'MD, FAAP',
    experience: '10+ Years',
    about: 'Dr. Emily Roberts provides comprehensive healthcare for infants, children, and adolescents. She is known for her gentle approach and dedication to early childhood development.',
    availability: 'Mon, Tue, Wed, Fri (8:00 AM - 3:00 PM)',
    rating: 5.0,
    reviews: 215
  },
  {
    id: 'd4',
    name: 'Dr. James Wilson',
    specialtyId: 'orthopaedics',
    specialtyName: 'Orthopaedics',
    image: doctorMaleImg,
    qualifications: 'MD, FAAOS',
    experience: '20+ Years',
    about: 'Dr. James Wilson is a leading orthopaedic surgeon focusing on sports injuries and joint replacement. He has helped thousands of patients regain mobility and live pain-free lives.',
    availability: 'Wed, Thu, Sat (9:00 AM - 2:00 PM)',
    rating: 4.7,
    reviews: 156
  },
  {
    id: 'd5',
    name: 'Dr. Linda Martinez',
    specialtyId: 'gynaecology',
    specialtyName: 'Gynaecology',
    image: doctorFemaleImg,
    qualifications: 'MD, FACOG',
    experience: '14+ Years',
    about: 'Dr. Linda Martinez is a dedicated gynecologist providing expert care in women\'s health, from routine screenings to advanced surgical procedures. She prioritizes patient comfort and education.',
    availability: 'Mon, Thu, Fri (10:00 AM - 6:00 PM)',
    rating: 4.9,
    reviews: 182
  }
];
