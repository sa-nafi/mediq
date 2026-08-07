import { motion } from 'framer-motion';

/**
 * Demo partner data — these are placeholder names and
 * do NOT represent actual partnerships with real organizations.
 */
const partners = [
  'HealthNet',
  'MedAlliance',
  'CarePath',
  'LifeLab',
  'DiagnoTech',
  'WellCare',
  'HealthFirst',
  'MedTrust',
] as const;

export function Partners() {
  return (
    <section className="bg-white py-12 lg:py-16 border-y border-border-light">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Trusted by Leading Healthcare Partners
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Collaborating with trusted partners to deliver the best in healthcare services
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 lg:gap-x-14">
          {partners.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex h-12 items-center justify-center"
            >
              {/* Placeholder logo — styled text */}
              <span className="text-lg font-bold text-muted/40 hover:text-muted/60 transition-colors select-none">
                {name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
