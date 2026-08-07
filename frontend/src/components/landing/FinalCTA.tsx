import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAppointmentStore } from '@/store/appointment-store';

export function FinalCTA() {
  const openModal = useAppointmentStore((s) => s.openModal);

  return (
    <section className="bg-primary py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Take the Next Step Toward{' '}
            <span className="text-accent">Better Health</span>
          </h2>
          <p className="mt-4 text-base text-white/75 leading-relaxed">
            Book your diagnostic appointment or explore the tests and packages available at our center.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button variant="accent" size="lg" onClick={openModal}>
              Book Appointment
            </Button>
            <Button variant="white" size="lg" asChild>
              <a href="#services">Explore Tests</a>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Decorative */}
      <div className="pointer-events-none absolute right-0 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
    </section>
  );
}
