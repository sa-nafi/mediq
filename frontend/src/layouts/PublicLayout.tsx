import { useLocation, useOutlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BookAppointmentModal } from '@/features/appointments/components/BookAppointmentModal';
import { motion, AnimatePresence } from 'framer-motion';

export function PublicLayout() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-1 w-full"
        >
          {outlet}
        </motion.main>
      </AnimatePresence>
      <Footer />
      <BookAppointmentModal />
    </div>
  );
}
