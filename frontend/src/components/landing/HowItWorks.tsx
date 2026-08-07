import { CalendarCheck, Building2, TestTubes, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    step: '01',
    icon: CalendarCheck,
    title: 'Book Your Test',
    description: 'Schedule an appointment online or call us. Choose your preferred date and time.',
  },
  {
    step: '02',
    icon: Building2,
    title: 'Visit Our Center',
    description: 'Come to our modern diagnostic facility. Our staff will guide you through the process.',
  },
  {
    step: '03',
    icon: TestTubes,
    title: 'Get Tested',
    description: 'Our experienced professionals conduct your diagnostic tests with care and precision.',
  },
  {
    step: '04',
    icon: FileCheck,
    title: 'View Your Report',
    description: 'Access your results digitally through our portal or collect them from the center.',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            How It <span className="text-secondary">Works</span>
          </h2>
          <p className="mt-4 text-base text-muted max-w-xl mx-auto">
            Getting tested is simple. Follow four easy steps to start your diagnostic journey.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connector line (desktop) */}
          <div className="pointer-events-none absolute top-14 left-[12%] right-[12%] hidden lg:block">
            <div className="h-0.5 w-full bg-gradient-to-r from-secondary/20 via-secondary/40 to-secondary/20" />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number */}
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 mb-5">
                <step.icon className="h-7 w-7 text-secondary" />
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white shadow-sm">
                  {step.step}
                </span>
              </div>

              <h3 className="text-base font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted leading-relaxed max-w-xs">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
