import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pill, Search, AlertCircle, ShoppingBag } from 'lucide-react';
import { patientApi } from '@/api/patient';
import { Button } from '@/components/ui/button';

export function PatientMedicinesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: medicines, isLoading, error } = useQuery({
    queryKey: ['patient', 'medicines', searchQuery],
    queryFn: () => patientApi.getMedicines(searchQuery),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Medicines</h1>
        <p className="text-muted mt-1">Browse available medicines in our pharmacy.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
        <input 
          type="text" 
          placeholder="Search medicines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface rounded-xl py-3 pl-10 pr-4 shadow-sm border border-border-light focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border-light bg-surface shadow-sm">
          <p className="text-muted">Loading medicines...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-red-600 gap-2 shadow-sm">
          <AlertCircle className="h-6 w-6" />
          <p>Failed to load medicines.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : medicines && medicines.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {medicines.map((med: any) => (
            <div key={med.id} className="bg-surface rounded-2xl p-5 shadow-sm border border-border-light flex flex-col hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
                <Pill className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground text-lg truncate" title={med.name}>{med.name}</h3>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">{med.category}</p>
              
              <div className="mt-auto space-y-2 pt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Brand</span>
                  <span className="font-medium text-foreground">{med.brand}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Price</span>
                  <span className="font-bold text-primary">${Number(med.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Stock</span>
                  {med.stock > 10 ? (
                    <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">In Stock</span>
                  ) : med.stock > 0 ? (
                    <span className="font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Low Stock</span>
                  ) : (
                    <span className="font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Out of Stock</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-surface border border-border-light rounded-3xl shadow-sm">
          <ShoppingBag className="h-16 w-16 text-muted/50 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground">No Medicines Found</h3>
          <p className="text-muted mt-2 max-w-md mx-auto">
            Try adjusting your search to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
