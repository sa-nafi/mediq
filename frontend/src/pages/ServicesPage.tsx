import { HeartPulse, Stethoscope, Microscope, Pill, Activity, Syringe } from 'lucide-react';
import { motion } from 'framer-motion';

const services = [
  {
    icon: <Stethoscope className="h-8 w-8 text-[#358797]" />,
    title: 'Consultancy',
    description: 'Expert medical consultations with our leading specialists across various departments to diagnose and plan your treatment.',
  },
  {
    icon: <Microscope className="h-8 w-8 text-[#358797]" />,
    title: 'Medical Tests & Diagnostics',
    description: 'State-of-the-art laboratory and imaging services ensuring accurate and fast results for effective treatment planning.',
  },
  {
    icon: <Pill className="h-8 w-8 text-[#358797]" />,
    title: 'Pharmacy',
    description: 'In-house trusted pharmacy providing genuine medications, health supplements, and comprehensive prescription guidance.',
  },
  {
    icon: <Activity className="h-8 w-8 text-[#358797]" />,
    title: 'Emergency Care',
    description: '24/7 emergency medical services with fully equipped trauma centers and rapid response teams ready to save lives.',
  },
  {
    icon: <HeartPulse className="h-8 w-8 text-[#358797]" />,
    title: 'Surgical Procedures',
    description: 'Advanced minimally invasive and major surgical procedures performed by renowned surgeons in modern operating theatres.',
  },
  {
    icon: <Syringe className="h-8 w-8 text-[#358797]" />,
    title: 'Vaccination & Immunization',
    description: 'Complete vaccination programs for children and adults to protect against preventable diseases and ensure community health.',
  }
];

export function ServicesPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-[#1a3a40] sm:text-4xl mb-6"
          >
            Our Medical Services
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground leading-relaxed"
          >
            At Noor Healthcare, we offer a comprehensive range of medical services designed to meet all your health needs under one roof. We blend advanced technology with compassionate care.
          </motion.p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm mb-6">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-[#1a3a40] mb-3">{service.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
