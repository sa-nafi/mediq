import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MedicineSelector } from './MedicineSelector';

export interface PrescriptionItem {
  medicine_id: number;
  medicine_name: string;
  dosage: string;
  quantity: number;
  duration_days: number;
}

export interface PrescriptionState {
  instructions: string;
  items: PrescriptionItem[];
}

interface PrescriptionFormProps {
  value: PrescriptionState;
  onChange: (value: PrescriptionState) => void;
}

export function PrescriptionForm({ value, onChange }: PrescriptionFormProps) {
  const addItem = (medicine: any) => {
    if (value.items.some(i => i.medicine_id === medicine.id)) {
      toast.error('Medicine already added to prescription');
      return;
    }
    onChange({
      ...value,
      items: [
        ...value.items,
        {
          medicine_id: medicine.id,
          medicine_name: medicine.medicine_name,
          dosage: '',
          quantity: 1,
          duration_days: 1
        }
      ]
    });
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, val: string | number) => {
    const newItems = [...value.items];
    newItems[index] = { ...newItems[index], [field]: val };
    onChange({ ...value, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = [...value.items];
    newItems.splice(index, 1);
    onChange({ ...value, items: newItems });
  };

  const setInstructions = (instructions: string) => {
    onChange({ ...value, instructions });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Medicines</h3>
        </div>
        
        <div className="p-4 bg-surface border border-border-light rounded-xl shadow-sm space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">Add Medicine</label>
            <MedicineSelector onSelect={addItem} />
          </div>

          {value.items.length > 0 && (
            <div className="space-y-3 mt-4 pt-4 border-t border-border-light">
              {value.items.map((item, index) => (
                <div key={item.medicine_id} className="grid grid-cols-12 gap-3 items-start bg-background p-3 rounded-lg border border-border-light">
                  <div className="col-span-12 md:col-span-4">
                    <label className="text-[10px] uppercase font-bold text-muted block mb-1">Medicine Name</label>
                    <div className="text-sm font-semibold text-foreground py-2 truncate" title={item.medicine_name}>
                      {item.medicine_name}
                    </div>
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <label className="text-[10px] uppercase font-bold text-muted block mb-1">Dosage</label>
                    <input
                      type="text"
                      required
                      value={item.dosage}
                      onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                      placeholder="e.g. 1-0-1"
                      className="w-full bg-surface border border-border-light rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-muted block mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full bg-surface border border-border-light rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-muted block mb-1">Days</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.duration_days}
                      onChange={(e) => updateItem(index, 'duration_days', parseInt(e.target.value) || 1)}
                      className="w-full bg-surface border border-border-light rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-1 flex justify-end md:justify-center md:pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 rounded-lg shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold text-foreground">General Instructions</label>
        <textarea
          value={value.instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full bg-surface border border-border-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[80px]"
          placeholder="e.g. Take after meals, drink plenty of water..."
        />
      </div>
    </div>
  );
}
