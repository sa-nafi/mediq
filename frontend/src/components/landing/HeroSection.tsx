import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppointmentStore } from '@/store/appointment-store';
import heroImg from '@/assets/hero-diagnostic.png';

export function HeroSection() {
  const openModal = useAppointmentStore((s) => s.openModal);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-white pt-28 pb-12 lg:pt-36 lg:pb-20">
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute top-20 -left-20 h-72 w-72 rounded-full bg-secondary/5 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <Badge variant="default" className="mb-5">
              Trusted Diagnostic Care
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem]">
              Better Diagnostics.{' '}
              <br className="hidden sm:block" />
              Better Decisions.{' '}
              <br className="hidden sm:block" />
              <span className="text-secondary">Better Health.</span>
            </h1>
            <p className="mt-5 text-base text-muted leading-relaxed sm:text-lg max-w-md">
              Accurate diagnostic testing, modern technology, and compassionate care — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="accent" size="lg" onClick={openModal}>
                Book an Appointment
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#services">Explore Tests</a>
              </Button>
            </div>

            {/* Search Bar */}
            <div className="mt-8 relative max-w-lg">
              <div className="flex items-center rounded-full border border-border bg-surface shadow-soft overflow-hidden">
                <div className="pl-5 pr-2 text-muted">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search for a test, package, or health condition"
                  className="flex-1 bg-transparent py-3.5 pr-2 text-sm placeholder:text-muted/70 focus:outline-none"
                  aria-label="Search tests and packages"
                />
                <Button variant="default" size="sm" className="mr-1.5 shrink-0">
                  Search
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Main image */}
              <div className="overflow-hidden rounded-3xl shadow-card">
                <img
                  src={heroImg}
                  alt="Laboratory professional examining diagnostic samples with modern equipment"
                  className="h-full w-full object-cover aspect-[4/3]"
                  loading="eager"
                />
              </div>

              {/* Floating card - Tests */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute -bottom-4 -left-4 sm:-left-8 rounded-2xl bg-surface p-4 shadow-card border border-border-light"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                    <span className="text-lg font-bold text-secondary">50+</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Diagnostic Tests</p>
                    <p className="text-xs text-muted">Available daily</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating card - Satisfaction */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -top-3 -right-3 sm:-right-6 rounded-2xl bg-primary p-4 shadow-card text-white"
              >
                <p className="text-2xl font-bold">98%</p>
                <p className="text-xs text-white/80">Patient Satisfaction</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
