import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Calendar, Clock, Award, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppointmentStore } from '@/store/appointment-store';
import { doctors } from '@/data/doctors';

export function DoctorDetailsPage() {
  const { id } = useParams();
  const openModal = useAppointmentStore((s) => s.openModal);
  
  const doctor = doctors.find(d => d.id === id);

  if (!doctor) {
    return (
      <div className="pt-32 pb-16 min-h-[70vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Doctor not found</h2>
        <Link to="/doctors" className="text-[#358797] hover:underline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to all doctors
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link to="/doctors" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#358797] mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to doctors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center sticky top-28">
              <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-[#f8fbfa] to-gray-100 border-4 border-white shadow-md mb-6 overflow-hidden flex items-center justify-center">
                 <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
              </div>
              
              <h1 className="text-2xl font-bold text-[#1a3a40] mb-1">{doctor.name}</h1>
              <p className="text-[#358797] font-medium mb-4">{doctor.specialtyName}</p>
              
              <div className="flex items-center justify-center gap-1 mb-6">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`h-4 w-4 ${i <= Math.floor(doctor.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                ))}
                <span className="ml-2 text-sm font-bold text-gray-700">{doctor.rating}</span>
                <span className="text-xs text-gray-400">({doctor.reviews} reviews)</span>
              </div>

              <div className="w-full h-px bg-gray-100 mb-6"></div>

              <div className="space-y-4 text-left mb-8">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mt-0.5">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Experience</p>
                    <p className="text-sm font-medium text-gray-900">{doctor.experience}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-green-50 p-2 rounded-lg text-green-600 mt-0.5">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Qualifications</p>
                    <p className="text-sm font-medium text-gray-900">{doctor.qualifications}</p>
                  </div>
                </div>
              </div>

              <Button onClick={openModal} className="w-full bg-[#358797] hover:bg-[#2a6d7a] text-white rounded-xl py-6 text-base shadow-md">
                Book Appointment
              </Button>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-[#1a3a40] mb-4">About Doctor</h2>
              <p className="text-gray-600 leading-relaxed">
                {doctor.about}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-[#1a3a40] mb-6">Location & Availability</h2>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-full shrink-0">
                  <MapPin className="h-6 w-6 text-[#358797]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Noor Healthcare Main Center</h3>
                  <p className="text-sm text-gray-500">123 Health Avenue, Medical District, NY 10001</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-gray-50 p-3 rounded-full shrink-0">
                  <Calendar className="h-6 w-6 text-[#358797]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Working Hours</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> {doctor.availability}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
