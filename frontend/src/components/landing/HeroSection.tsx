import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserRound, ChevronDown, Heart, Pill } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import heroImg from '@/assets/hero.png';
import { doctors } from '@/data/doctors';

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter doctors based on query
  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.specialtyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDoctorClick = (id: string) => {
    setSearchQuery('');
    setIsDropdownOpen(false);
    navigate(`/doctors/${id}`);
  };

  return (
    <section className="relative overflow-hidden bg-white pt-28 pb-16 lg:pt-36 lg:pb-24">
      {/* Background Organic Blob */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 800"
          className="absolute top-0 left-0 w-full h-[120%] object-cover object-top opacity-30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 L1440,0 L1440,300 C1200,450 1000,100 720,300 C440,500 200,200 0,400 Z"
            fill="#358797"
            opacity="0.15"
          />
          <path
            d="M0,0 L800,0 C900,200 600,400 400,300 C200,200 100,500 0,600 Z"
            fill="#358797"
            opacity="0.2"
          />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          
          {/* Left Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-[#1a3a40] sm:text-5xl lg:text-6xl leading-[1.1] mb-6">
              Where Healing<br/>
              Feels Like <span className="text-[#358797]">Home</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed">
              Start your journey to better health. Find the right doctor and specialty below.
            </p>

            {/* Search Bar - Interactive */}
            <motion.div 
              ref={dropdownRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="relative max-w-md w-full"
            >
              <div className="bg-white rounded-full p-2 pl-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center border border-gray-100 relative z-20">
                {/* Doctor Dropdown Trigger (Visual Only for now) */}
                <div className="flex items-center cursor-pointer shrink-0 group">
                  <UserRound className="h-5 w-5 text-[#358797]" />
                  <span className="font-semibold text-[#1a3a40] ml-2 text-sm">Doctor</span>
                  <ChevronDown className="h-4 w-4 text-gray-400 ml-1 group-hover:text-gray-600 transition-colors" />
                </div>
                
                {/* Divider */}
                <div className="w-[1px] h-8 bg-gray-200 mx-4 shrink-0"></div>
                
                {/* Input */}
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search doctor name.." 
                  className="flex-1 outline-none text-sm text-gray-700 bg-transparent min-w-0"
                />
                
                {/* Search Button */}
                <button 
                  className="h-12 w-12 rounded-full bg-[#358797] text-white flex items-center justify-center shrink-0 hover:bg-[#2a6d7a] transition-colors shadow-md ml-2" 
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {isDropdownOpen && searchQuery.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] border border-gray-100 overflow-hidden z-30"
                  >
                    <div className="max-h-64 overflow-y-auto py-2">
                      {filteredDoctors.length > 0 ? (
                        filteredDoctors.map(doc => (
                          <div 
                            key={doc.id}
                            onClick={() => handleDoctorClick(doc.id)}
                            className="px-6 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-4 transition-colors"
                          >
                            <img src={doc.image} alt={doc.name} className="w-10 h-10 rounded-full bg-gray-100" />
                            <div>
                              <p className="font-semibold text-[#1a3a40] text-sm">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.specialtyName}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-6 py-4 text-sm text-gray-500 text-center">
                          No doctors found matching "{searchQuery}"
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Right Image Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative lg:ml-auto flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-[600px]">
              
              {/* Main Image with mix-blend and custom wavy mask */}
              <div className="relative z-10" style={{
                maskImage: 'url("data:image/svg+xml,%3Csvg width=\'100%25\' height=\'100%25\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0,0 L1000,0 L1000,750 C800,850 600,700 400,800 C200,900 0,750 0,750 Z\' fill=\'black\' /%3E%3C/svg%3E")',
                WebkitMaskImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' preserveAspectRatio=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0,0 L100,0 L100,85 Q75,100 50,85 T0,85 Z\' fill=\'black\' /%3E%3C/svg%3E")',
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%'
              }}>
                <img
                  src={heroImg}
                  alt="Doctor consulting with a patient"
                  className="w-full h-auto object-cover mix-blend-darken scale-105 origin-bottom"
                  loading="eager"
                />
              </div>

              {/* Floating Decorative Pill 1 (Heart) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute bottom-[10%] left-[10%] z-20 bg-white p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white flex items-center justify-center"
              >
                <div className="bg-[#e6f2f4] p-2 rounded-xl">
                   <Heart className="h-6 w-6 text-[#358797] fill-[#358797]" />
                </div>
              </motion.div>

              {/* Floating Decorative Pill 2 (Capsule) */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="absolute top-[40%] right-[2%] z-20 bg-white p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white flex items-center justify-center"
              >
                <div className="bg-[#e6f2f4] p-2 rounded-xl">
                   <Pill className="h-6 w-6 text-[#358797]" />
                </div>
              </motion.div>

            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
