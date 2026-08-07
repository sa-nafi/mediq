import { motion } from 'framer-motion';

const stats = [
  {
    title: '60+ Years of Excellence',
    description: 'Decades of trusted care, prioritizing your health and well-being.',
    bgColor: 'bg-[#185e65]', // Using custom teal color from mockup
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop', // Hospital building
  },
  {
    title: '1000+ Expert Medical Care',
    description: 'A team of professionals committed to your health and well-being.',
    bgColor: 'bg-[#0f444c]',
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=800&auto=format&fit=crop', // Doctors team
  },
  {
    title: 'Advanced Medical Technology',
    description: 'Medical technology for accurate diagnosis and effective treatment.',
    bgColor: 'bg-[#146b82]',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800&auto=format&fit=crop', // Scanner
  },
  {
    title: '98% Happy Patients',
    description: 'We take pride in creating a positive experience for every patient.',
    bgColor: 'bg-[#0f606a]',
    image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=800&auto=format&fit=crop', // Happy patient
  },
  {
    title: '40+ Years Trusted Pharmacy',
    description: 'We trusted pharmacy solutions, delivering quality care and reliability.',
    bgColor: 'bg-[#0a353c]',
    image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?q=80&w=800&auto=format&fit=crop', // Pharmacy items
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-surface py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mb-10 max-w-2xl"
        >
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            Why Choose <span className="text-secondary">Noor Healthcare?</span>
          </h2>
          <p className="mt-3 text-base text-muted">
            At Noor Healthcare, we blend expert medical care with compassion, offering personalized treatment to ensure every patient feels supported and valued throughout their healing journey.
          </p>
        </motion.div>

        {/* Bento Grid layout - Fixed alignment with standard grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[280px]">
          
          {/* Card 1 (Large left) spans 2 rows, 4 cols */}
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5 }}
             className={`rounded-3xl overflow-hidden text-white relative flex flex-col ${stats[0].bgColor} md:col-span-4 md:row-span-2 h-full`}
          >
              <div className="p-8 z-10">
                <h3 className="text-2xl font-bold mb-2">{stats[0].title}</h3>
                <p className="text-sm text-white/90 max-w-[200px] leading-relaxed">{stats[0].description}</p>
              </div>
              <div className="mt-auto relative h-64 w-full">
                 <img src={stats[0].image} alt={stats[0].title} className="absolute inset-0 w-full h-full object-cover rounded-t-3xl mt-4 px-6" style={{clipPath: 'polygon(0 15%, 100% 0, 100% 100%, 0% 100%)'}}/>
              </div>
          </motion.div>

          {/* Card 2 (Top wide) spans 1 row, 5 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`rounded-3xl overflow-hidden text-white relative flex flex-col md:flex-row ${stats[1].bgColor} md:col-span-5 md:row-span-1 h-full`}
          >
            <div className="p-6 z-10 flex-1">
              <h3 className="text-xl font-bold mb-2">{stats[1].title}</h3>
              <p className="text-sm text-white/90 max-w-[180px] leading-relaxed">{stats[1].description}</p>
            </div>
            <div className="w-48 h-full relative shrink-0">
                <img src={stats[1].image} alt={stats[1].title} className="absolute bottom-0 right-0 h-4/5 object-cover object-left" />
            </div>
          </motion.div>

          {/* Card 3 (Top narrow) spans 1 row, 3 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`rounded-3xl overflow-hidden text-white relative flex flex-col ${stats[2].bgColor} md:col-span-3 md:row-span-1 h-full`}
          >
            <div className="p-6 z-10 pb-0">
              <h3 className="text-xl font-bold mb-2">{stats[2].title}</h3>
              <p className="text-sm text-white/90 leading-relaxed mb-4">{stats[2].description}</p>
            </div>
            <div className="mt-auto h-32 relative">
                <img src={stats[2].image} alt={stats[2].title} className="absolute bottom-0 right-0 w-3/4 h-full object-cover rounded-tl-3xl" />
            </div>
          </motion.div>

          {/* Card 4 (Bottom wide) spans 1 row, 5 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`rounded-3xl overflow-hidden text-white relative flex flex-col items-center justify-between pt-6 ${stats[3].bgColor} md:col-span-5 md:row-span-1 h-full`}
          >
            <div className="px-6 w-full z-10 relative">
              <h3 className="text-xl font-bold mb-2">{stats[3].title}</h3>
              <p className="text-sm text-white/90 max-w-[220px] leading-relaxed">{stats[3].description}</p>
            </div>
            <img src={stats[3].image} alt={stats[3].title} className="w-3/4 mt-4 h-32 object-cover object-top rounded-t-[3rem]" />
          </motion.div>

          {/* Card 5 (Bottom narrow) spans 1 row, 3 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`rounded-3xl overflow-hidden text-white relative flex flex-col ${stats[4].bgColor} md:col-span-3 md:row-span-1 h-full`}
          >
            <div className="p-6 z-10">
              <h3 className="text-xl font-bold mb-2">{stats[4].title}</h3>
              <p className="text-sm text-white/90 leading-relaxed mb-2">{stats[4].description}</p>
            </div>
            <div className="mt-auto h-32 flex justify-center w-full">
                <img src={stats[4].image} alt={stats[4].title} className="w-3/4 object-cover object-center rounded-t-3xl" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
