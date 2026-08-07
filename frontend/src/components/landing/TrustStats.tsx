import { Award, FlaskConical, TestTubes, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { icon: Award, value: '25+', label: 'Years of Care', color: 'text-primary' },
  { icon: TestTubes, value: '100K+', label: 'Tests Performed', color: 'text-secondary' },
  { icon: FlaskConical, value: '50+', label: 'Diagnostic Tests', color: 'text-accent-dark' },
  { icon: ThumbsUp, value: '98%', label: 'Patient Satisfaction', color: 'text-emerald-500' },
] as const;

export function TrustStats() {
  return (
    <section className="relative -mt-1 bg-white py-10 lg:py-14" aria-label="Trust statistics">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <p className="text-sm font-semibold text-secondary uppercase tracking-wider">
            Trusted by thousands of patients
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <p className="text-2xl font-extrabold text-foreground sm:text-3xl">{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
