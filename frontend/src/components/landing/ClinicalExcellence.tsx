import { specialties } from '@/data/specialties';
import { Heart, Smile, Stethoscope, Brain, Activity, Thermometer, Droplet, User, Baby, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const iconMap: Record<string, React.ElementType> = {
  Heart,
  Smile,
  Stethoscope,
  Brain,
  Activity,
  Thermometer,
  Droplet,
  User,
  Baby,
};

export function ClinicalExcellence() {
  return (
    <section className="py-20 bg-background" id="speciality">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-3xl">
          <h2 className="text-3xl font-bold text-primary sm:text-4xl mb-4">
            An Ecosystem for Clinical Excellence
          </h2>
          <p className="text-muted text-base leading-relaxed">
            Discover world-class healthcare at Noor Healthcare's specialized centres of medical innovation. Our advanced facilities offer unmatched expertise in key specialties and super specialties, setting new global standards in clinical excellence and patient care.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map((spec, idx) => {
            const Icon = iconMap[spec.icon] || Heart;
            return (
              <motion.div
                key={spec.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0, transition: { delay: idx * 0.05, duration: 0.5 } }}
                viewport={{ once: true }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="flex items-start gap-4 p-6 rounded-2xl bg-surface border border-border-light shadow-soft hover:shadow-hover transition-shadow duration-300 group cursor-pointer"
              >
                <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-secondary transition-colors">
                    {spec.name}
                  </h3>
                  <p className="text-sm text-muted">
                    {spec.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10">
          <Button variant="accent" size="lg" className="rounded-full flex items-center gap-2">
            View All Specialties
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
