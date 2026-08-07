import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HealthLibraryPage() {
  return (
    <div className="pt-24 pb-20 min-h-[80vh] bg-gray-50 flex items-center justify-center">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        
        <div className="w-24 h-24 bg-[#e6f2f4] rounded-full flex items-center justify-center mx-auto mb-8">
           <Construction className="h-12 w-12 text-[#358797]" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-[#1a3a40] sm:text-5xl mb-6">
          Health Library
        </h1>
        
        <p className="text-xl text-gray-500 mb-2">
          This section is currently under development.
        </p>
        <p className="text-gray-500 mb-10 max-w-xl mx-auto">
          We are working hard to bring you a comprehensive library of health resources, articles, and medical insights. Stay tuned!
        </p>
        
        <Link 
          to="/" 
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#358797] text-white rounded-full font-medium hover:bg-[#2a6d7a] transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
      </div>
    </div>
  );
}
