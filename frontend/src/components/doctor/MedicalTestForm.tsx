import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MedicalTestItem {
  id: string; // unique string for UI keying
  test_name: string;
  test_details: string;
}

interface MedicalTestFormProps {
  value: MedicalTestItem[];
  onChange: (value: MedicalTestItem[]) => void;
}

export function MedicalTestForm({ value, onChange }: MedicalTestFormProps) {
  const addTest = () => {
    onChange([
      ...value,
      { id: Math.random().toString(36).substring(7), test_name: '', test_details: '' }
    ]);
  };

  const updateTest = (id: string, field: keyof MedicalTestItem, val: string) => {
    onChange(value.map(test => test.id === id ? { ...test, [field]: val } : test));
  };

  const removeTest = (id: string) => {
    onChange(value.filter(test => test.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Ordered Tests</h3>
        <Button onClick={addTest} variant="outline" size="sm" className="gap-1 rounded-xl">
          <Plus className="h-4 w-4" /> Add Test
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="p-8 text-center bg-surface border border-border-light rounded-xl border-dashed">
          <p className="text-sm text-muted">No tests ordered yet. Click "Add Test" to order one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((test) => (
            <div key={test.id} className="p-4 bg-surface border border-border-light rounded-xl shadow-sm relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeTest(test.id)}
                className="absolute top-2 right-2 h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <div className="space-y-4 pr-8">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">Test Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={test.test_name}
                    onChange={(e) => updateTest(test.id, 'test_name', e.target.value)}
                    className="w-full bg-background border border-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                    placeholder={`e.g. Complete Blood Count (CBC)`}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">Test Details / Notes</label>
                  <textarea
                    value={test.test_details}
                    onChange={(e) => updateTest(test.id, 'test_details', e.target.value)}
                    className="w-full bg-background border border-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[60px]"
                    placeholder="Instructions for the lab technician..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
