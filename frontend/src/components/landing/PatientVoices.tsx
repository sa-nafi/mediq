import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const patients = [
  {
    id: 1,
    name: 'Sarah M.',
    type: 'Employee',
    quote: 'The doctors and staff at Noor Healthcare were incredibly supportive throughout my treatment. They made sure I understood every step of the process.',
  },
  {
    id: 2,
    name: 'David L.',
    type: 'Patient',
    quote: 'Exceptional care and support! I came in for a routine checkup and was amazed by the level of detail and modern facilities available.',
  },
  {
    id: 3,
    name: 'Emily R.',
    type: 'Patient',
    quote: 'I have been bringing my children here for years. The paediatric care team is phenomenal and always puts my kids at ease.',
  },
  {
    id: 4,
    name: 'Michael T.',
    type: 'Patient',
    quote: 'The fastest diagnostic reports I have ever received. The digital portal makes it so easy to share results with my primary care physician.',
  },
];

export function PatientVoices() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-[#5ea5b3] py-20 lg:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:items-center">
          
          {/* Left Text */}
          <div className="lg:w-1/3">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
              Voices of Trust<br/>Our Patients
            </h2>
            <p className="text-white/90 text-base mb-8">
              Real stories from our patients about their journey to healing with Noor Healthcare
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={scrollLeft}
                className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-sm" 
                aria-label="Previous patient voice"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={scrollRight}
                className="h-10 w-10 rounded-full bg-[#185e65] flex items-center justify-center text-white hover:bg-[#185e65]/80 transition-colors shadow-md" 
                aria-label="Next patient voice"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Right Cards Slider */}
          <div 
            ref={scrollContainerRef}
            className="lg:w-2/3 flex gap-6 overflow-x-auto pb-6 pt-4 snap-x snap-mandatory px-4 -mx-4 lg:px-0 lg:mx-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
          >
            {patients.map((patient, idx) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative shrink-0 w-[280px] sm:w-[320px] rounded-[2rem] bg-white p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] transition-shadow snap-start flex flex-col justify-between group"
              >
                <div>
                  <Quote className="h-10 w-10 text-secondary/20 mb-4 transition-transform group-hover:scale-110 group-hover:text-secondary/40" />
                  <div className="flex text-amber-400 mb-4 gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="text-muted leading-relaxed mb-6">
                    "{patient.quote}"
                  </p>
                </div>
                
                <div className="mt-auto border-t border-border pt-4">
                   <p className="font-bold text-foreground">{patient.name}</p>
                   <p className="text-sm text-muted">{patient.type}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
