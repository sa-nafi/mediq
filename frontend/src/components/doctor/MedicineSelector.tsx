import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { doctorApi } from '@/api/doctor';
import { useDebounce } from '@/hooks/use-debounce';

interface MedicineSelectorProps {
  onSelect: (medicine: any) => void;
}

export function MedicineSelector({ onSelect }: MedicineSelectorProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearch = useDebounce(search, 300);

  const { data: medicinesData, isLoading } = useQuery({
    queryKey: ['doctor', 'medicines', debouncedSearch],
    queryFn: () => doctorApi.getMedicines({ search: debouncedSearch, limit: 10 }),
    enabled: isOpen,
  });

  const medicines = medicinesData?.data || [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted" />
        </div>
        <input
          type="text"
          className="w-full bg-surface border border-border-light rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
          placeholder="Search for a medicine..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isLoading && isOpen && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Loader2 className="h-4 w-4 text-muted animate-spin" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-surface border border-border-light rounded-xl shadow-lg max-h-60 overflow-auto">
          {medicines.length > 0 ? (
            <ul className="py-1">
              {medicines.map((medicine: any) => (
                <li
                  key={medicine.id}
                  className="px-4 py-2 hover:bg-secondary/5 cursor-pointer text-sm"
                  onClick={() => {
                    onSelect(medicine);
                    setSearch(medicine.medicine_name);
                    setIsOpen(false);
                  }}
                >
                  <div className="font-medium text-foreground">{medicine.medicine_name}</div>
                  {medicine.category && (
                    <div className="text-[10px] uppercase font-bold text-muted mt-0.5 tracking-wider">
                      {medicine.category}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            search && !isLoading && (
              <div className="px-4 py-3 text-sm text-muted text-center">
                No medicines found.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
