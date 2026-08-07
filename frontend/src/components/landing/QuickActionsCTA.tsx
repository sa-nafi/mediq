import { Phone, UserRound, Calendar, ChevronRight } from 'lucide-react';
import { useAppointmentStore } from '@/store/appointment-store';
import { Link } from 'react-router-dom';

export function QuickActionsCTA() {
  const openModal = useAppointmentStore((s) => s.openModal);

  return (
    <section className="bg-[#0b333a] py-16 text-white border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
          Your Health, Its Our Priority
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Emergency Call */}
          <a href="tel:+8801712341234" className="bg-white rounded-full flex items-center justify-between p-2 pr-3 cursor-pointer group">
             <div className="flex items-center gap-3">
               <div className="bg-[#f0f9f3] p-3 rounded-full text-[#0b333a]">
                 <Phone className="h-5 w-5" />
               </div>
               <span className="text-[#0b333a] font-semibold">Emergency Call</span>
             </div>
             <div className="h-8 w-8 rounded-full bg-[#358797] text-white flex items-center justify-center transition-transform group-hover:scale-105">
                 <ChevronRight className="h-5 w-5" />
             </div>
          </a>

          {/* Find Doctor */}
          <Link to="/doctors" className="bg-white rounded-full flex items-center justify-between p-2 pr-3 cursor-pointer group">
             <div className="flex items-center gap-3">
               <div className="bg-[#f0f9f3] p-3 rounded-full text-[#0b333a]">
                 <UserRound className="h-5 w-5" />
               </div>
               <span className="text-[#0b333a] font-semibold">Find Doctor</span>
             </div>
             <div className="h-8 w-8 rounded-full bg-[#358797] text-white flex items-center justify-center transition-transform group-hover:scale-105">
                 <ChevronRight className="h-5 w-5" />
             </div>
          </Link>

          {/* Make an Appointment */}
          <div className="bg-white rounded-full flex items-center justify-between p-2 pr-3 cursor-pointer group" onClick={openModal}>
             <div className="flex items-center gap-3">
               <div className="bg-[#f0f9f3] p-3 rounded-full text-[#0b333a]">
                 <Calendar className="h-5 w-5" />
               </div>
               <span className="text-[#0b333a] font-semibold">Make an Appointment</span>
             </div>
             <div className="h-8 w-8 rounded-full bg-[#358797] text-white flex items-center justify-center transition-transform group-hover:scale-105">
                 <ChevronRight className="h-5 w-5" />
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
