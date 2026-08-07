import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { diagnosticServices } from '@/features/diagnostics/data/services';

export function DiagnosticServices() {
  return (
    <section id="services" className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            Everything You Need for <span className="text-secondary">Better Health</span>
          </h2>
          <p className="mt-4 text-base text-muted max-w-2xl mx-auto leading-relaxed">
            Explore our comprehensive range of diagnostic services, health screenings, and wellness packages — all in one trusted center.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {diagnosticServices.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                to="/services"
                className="group flex items-start gap-4 rounded-2xl border border-border-light bg-surface p-5 shadow-soft transition-all duration-300 hover:shadow-card hover:border-secondary/20 hover:-translate-y-0.5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background group-hover:bg-secondary/10 transition-colors">
                  <service.icon className={`h-5 w-5 ${service.color} group-hover:text-secondary transition-colors`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-secondary transition-colors">
                    {service.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <Button variant="default" size="default" asChild>
            <Link to="/services" className="gap-2">
              View All Services <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
