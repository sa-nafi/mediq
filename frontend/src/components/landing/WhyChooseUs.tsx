import { ShieldCheck, Cpu, Users, Zap, Heart, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const reasons = [
  {
    icon: ShieldCheck,
    title: 'Accurate Results',
    description: 'Advanced laboratory processes and rigorous quality controls ensure reliable, precise diagnostic results every time.',
    size: 'large' as const,
    accent: 'bg-secondary',
  },
  {
    icon: Cpu,
    title: 'Modern Technology',
    description: 'Reliable diagnostic equipment and digital workflows for efficient, accurate testing.',
    size: 'small' as const,
    accent: 'bg-primary',
  },
  {
    icon: Users,
    title: 'Experienced Professionals',
    description: 'Qualified medical and laboratory professionals dedicated to your health.',
    size: 'small' as const,
    accent: 'bg-accent',
  },
  {
    icon: Zap,
    title: 'Fast Reporting',
    description: 'Access your reports conveniently without unnecessary delays through our digital platform.',
    size: 'small' as const,
    accent: 'bg-emerald-500',
  },
  {
    icon: Heart,
    title: 'Patient-Centered Care',
    description: 'Simple booking, comfortable environment, and a focus on your well-being throughout the process.',
    size: 'small' as const,
    accent: 'bg-rose-400',
  },
  {
    icon: Lock,
    title: 'Trusted Healthcare',
    description: 'Secure, dependable, and professional diagnostic services you can rely on.',
    size: 'small' as const,
    accent: 'bg-indigo-500',
  },
] as const;

export function WhyChooseUs() {
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
            Why Choose <span className="text-secondary">Our Diagnostic Center?</span>
          </h2>
          <p className="mt-4 text-base text-muted max-w-2xl mx-auto">
            We combine advanced medical technology with compassionate care to deliver an outstanding diagnostic experience.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, i) => {
            const isLarge = reason.size === 'large';
            return (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`group relative overflow-hidden rounded-2xl border border-border-light shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 ${
                  isLarge
                    ? 'sm:col-span-2 lg:col-span-2 bg-primary text-white p-8 lg:p-10'
                    : 'bg-surface p-6'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${
                    isLarge ? 'bg-white/15' : `${reason.accent}/10`
                  }`}
                >
                  <reason.icon className={`h-6 w-6 ${isLarge ? 'text-white' : 'text-secondary'}`} />
                </div>
                <h3
                  className={`text-lg font-bold mb-2 ${
                    isLarge ? 'text-white text-xl' : 'text-foreground'
                  }`}
                >
                  {reason.title}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${
                    isLarge ? 'text-white/80 max-w-md' : 'text-muted'
                  }`}
                >
                  {reason.description}
                </p>

                {/* Decorative circle */}
                {isLarge && (
                  <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/5" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
