import { CalendarDays, FileText, ClipboardList, Pill, FolderHeart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import reportsImg from '@/assets/digital-reports.png';

const features = [
  { icon: CalendarDays, label: 'Book appointments online' },
  { icon: ClipboardList, label: 'Track diagnostic services' },
  { icon: FileText, label: 'Access reports digitally' },
  { icon: Pill, label: 'View prescriptions' },
  { icon: FolderHeart, label: 'Manage health records' },
] as const;

export function DigitalReports() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="order-2 lg:order-1"
          >
            <div className="overflow-hidden rounded-3xl shadow-card bg-white p-4">
              <img
                src={reportsImg}
                alt="Digital health dashboard showing patient reports and metrics on phone and tablet"
                className="w-full rounded-2xl object-cover"
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              Your Reports,{' '}
              <span className="text-secondary">Always Within Reach</span>
            </h2>
            <p className="mt-4 text-base text-muted leading-relaxed max-w-md">
              Our upcoming patient portal puts your health information at your fingertips. Manage your diagnostic journey from anywhere.
            </p>

            <ul className="mt-8 space-y-4">
              {features.map((f, i) => (
                <motion.li
                  key={f.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 shrink-0">
                    <f.icon className="h-4.5 w-4.5 text-secondary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{f.label}</span>
                </motion.li>
              ))}
            </ul>

            <div className="mt-8">
              <Button variant="default" size="lg" asChild>
                <Link to="/patient">Access Patient Portal</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
