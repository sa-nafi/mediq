import { Link } from 'react-router-dom';
import { ArrowRight, TestTubes } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { healthPackages } from '@/features/diagnostics/data/packages';

export function PopularPackages() {
  return (
    <section className="bg-white py-16 lg:py-24">
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
            Popular Health <span className="text-secondary">Packages</span>
          </h2>
          <p className="mt-4 text-base text-muted max-w-2xl mx-auto">
            Comprehensive diagnostic packages designed for thorough health assessments at every stage of life.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {healthPackages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group relative rounded-2xl border border-border-light bg-surface p-6 shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1"
            >
              {pkg.popular && (
                <Badge variant="accent" className="absolute top-4 right-4 text-[10px]">
                  Popular
                </Badge>
              )}

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 mb-4">
                <TestTubes className="h-5 w-5 text-secondary" />
              </div>

              <h3 className="text-lg font-bold text-foreground group-hover:text-secondary transition-colors">
                {pkg.name}
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
                {pkg.description}
              </p>

              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="text-muted">
                  <span className="font-semibold text-foreground">{pkg.testCount}</span> tests
                </span>
                <span className="text-xs text-border">|</span>
                <span className="font-semibold text-secondary">{pkg.startingPrice}</span>
              </div>

              <div className="mt-5">
                <Button variant="outline" size="sm" asChild className="w-full gap-2">
                  <Link to="/tests">
                    View Package <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
