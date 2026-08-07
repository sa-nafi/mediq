import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export function DiseaseSearch() {
  return (
    <section className="py-20 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Image Box */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative h-[600px] rounded-3xl overflow-hidden shadow-card"
          >
            {/* Using a placeholder gradient/image style since we don't have the specific image */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80">
                <img 
                    src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1000&auto=format&fit=crop" 
                    alt="Scientist looking through microscope" 
                    className="w-full h-full object-cover mix-blend-overlay opacity-60"
                />
            </div>
            
            <div className="absolute bottom-0 left-0 p-8 w-full bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-2xl font-bold text-white mb-2">
                Personalized Care, Transformed
              </h3>
              <a href="#" className="text-sm text-white/90 underline underline-offset-4 hover:text-accent transition-colors">
                Learn how we drive innovation
              </a>
            </div>
          </motion.div>

          {/* Right Side - Search */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:pl-8"
          >
            <h2 className="text-3xl font-bold text-primary sm:text-4xl mb-3">
              Search diseases & conditions
            </h2>
            <p className="text-muted text-base mb-8">
              Find diseases & conditions by first letter
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              {alphabet.map((letter) => (
                <button
                  key={letter}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-sm font-medium text-foreground hover:bg-secondary hover:text-white hover:border-secondary transition-colors"
                >
                  {letter}
                </button>
              ))}
            </div>

            <div>
              <p className="text-sm text-foreground font-medium mb-3">
                Search diseases & conditions
              </p>
              <div className="flex items-center rounded-full border border-border bg-white shadow-sm overflow-hidden p-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search diseases..."
                  className="flex-1 bg-transparent py-3 px-5 text-sm placeholder:text-muted/70 focus:outline-none"
                  aria-label="Search diseases"
                />
                <Button variant="default" size="icon" className="shrink-0 h-10 w-10 rounded-full bg-secondary hover:bg-secondary/90">
                  <Search className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
