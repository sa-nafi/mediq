interface MedicalRecordState {
  diagnosis: string;
  treatment: string;
  notes: string;
}

interface MedicalRecordFormProps {
  value: MedicalRecordState;
  onChange: (value: MedicalRecordState) => void;
}

export function MedicalRecordForm({ value, onChange }: MedicalRecordFormProps) {
  const handleChange = (field: keyof MedicalRecordState, newValue: string) => {
    onChange({ ...value, [field]: newValue });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="space-y-1">
        <label className="text-sm font-semibold text-foreground">Diagnosis <span className="text-red-500">*</span></label>
        <textarea
          value={value.diagnosis}
          onChange={(e) => handleChange('diagnosis', e.target.value)}
          className="w-full bg-surface border border-border-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[80px]"
          placeholder="Enter primary diagnosis..."
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold text-foreground">Treatment Plan</label>
        <textarea
          value={value.treatment}
          onChange={(e) => handleChange('treatment', e.target.value)}
          className="w-full bg-surface border border-border-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[100px]"
          placeholder="Enter treatment plan..."
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold text-foreground">Additional Notes</label>
        <textarea
          value={value.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="w-full bg-surface border border-border-light rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all min-h-[80px]"
          placeholder="Any other observations..."
        />
      </div>
    </div>
  );
}
