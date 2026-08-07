import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, MapPin, Calendar } from 'lucide-react';
import { doctors } from '@/data/doctors';
import { motion } from 'framer-motion';

export function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.specialtyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-[#1a3a40] sm:text-4xl mb-4"
          >
            Our Medical Specialists
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Find and book appointments with our highly qualified doctors across various specialties. 
            Your health is our top priority.
          </motion.p>
        </div>

        {/* Search and Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12 max-w-2xl mx-auto"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by doctor name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-full py-3.5 pl-12 pr-4 shadow-sm border border-gray-100 outline-none focus:ring-2 focus:ring-[#358797]/50"
            />
          </div>
        </motion.div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doc, index) => (
              <motion.div 
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.3 + index * 0.1 } }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 flex flex-col h-full"
              >
                <div className="p-6 bg-gradient-to-br from-[#f8fbfa] to-white border-b border-gray-50 flex items-center justify-center h-48">
                   <img src={doc.image} alt={doc.name} className="w-32 h-32 rounded-full shadow-sm bg-white" />
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-[#1a3a40]">{doc.name}</h3>
                      <p className="text-[#358797] font-medium text-sm">{doc.specialtyName}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-semibold text-amber-700">{doc.rating}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-6 flex-1">{doc.qualifications}</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                       <MapPin className="h-4 w-4 text-gray-400" />
                       <span>Noor Healthcare Center</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                       <Calendar className="h-4 w-4 text-gray-400" />
                       <span>{doc.availability}</span>
                    </div>
                  </div>

                  <Link to={`/doctors/${doc.id}`} className="w-full block text-center py-2.5 rounded-xl border-2 border-[#358797] text-[#358797] font-semibold hover:bg-[#358797] hover:text-white transition-colors">
                    View Profile
                  </Link>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-gray-500">
              No doctors found matching your search.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
