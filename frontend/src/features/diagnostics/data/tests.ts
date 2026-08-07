export interface DiagnosticTest {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
}

/** Demo data — used for the test search component */
export const diagnosticTests: DiagnosticTest[] = [
  { id: '1', name: 'Complete Blood Count', code: 'CBC', category: 'Hematology', description: 'Measures red & white blood cells, hemoglobin, and platelets.' },
  { id: '2', name: 'HbA1c (Glycated Hemoglobin)', code: 'HbA1c', category: 'Diabetes', description: 'Measures average blood sugar over 2–3 months.' },
  { id: '3', name: 'Lipid Profile', code: 'LIPID', category: 'Cardiac', description: 'Cholesterol, triglycerides, HDL, and LDL levels.' },
  { id: '4', name: 'Thyroid Profile', code: 'TSH', category: 'Endocrine', description: 'T3, T4, and TSH levels for thyroid function.' },
  { id: '5', name: 'Liver Function Test', code: 'LFT', category: 'Hepatology', description: 'Assesses liver enzymes, bilirubin, and proteins.' },
  { id: '6', name: 'Kidney Function Test', code: 'KFT', category: 'Nephrology', description: 'BUN, creatinine, and electrolyte levels.' },
  { id: '7', name: 'Vitamin D', code: 'VITD', category: 'Vitamins', description: 'Measures 25-hydroxy vitamin D levels.' },
  { id: '8', name: 'Urine Routine Examination', code: 'URE', category: 'Urinalysis', description: 'Physical, chemical, and microscopic urine analysis.' },
  { id: '9', name: 'Blood Glucose Fasting', code: 'BGF', category: 'Diabetes', description: 'Fasting blood sugar level measurement.' },
  { id: '10', name: 'Erythrocyte Sedimentation Rate', code: 'ESR', category: 'Hematology', description: 'Indicates inflammation in the body.' },
  { id: '11', name: 'C-Reactive Protein', code: 'CRP', category: 'Immunology', description: 'Marker for inflammation and infection.' },
  { id: '12', name: 'Prothrombin Time', code: 'PT', category: 'Hematology', description: 'Blood clotting time assessment.' },
  { id: '13', name: 'Serum Electrolytes', code: 'ELEC', category: 'Biochemistry', description: 'Sodium, potassium, and chloride levels.' },
  { id: '14', name: 'Iron Studies', code: 'IRON', category: 'Hematology', description: 'Serum iron, ferritin, and TIBC levels.' },
  { id: '15', name: 'Vitamin B12', code: 'B12', category: 'Vitamins', description: 'Measures vitamin B12 levels in blood.' },
  { id: '16', name: 'Folic Acid', code: 'FOLIC', category: 'Vitamins', description: 'Folate level assessment.' },
  { id: '17', name: 'Uric Acid', code: 'UA', category: 'Biochemistry', description: 'Measures uric acid for gout and kidney assessment.' },
  { id: '18', name: 'Calcium', code: 'CA', category: 'Biochemistry', description: 'Serum calcium level measurement.' },
  { id: '19', name: 'Prostate Specific Antigen', code: 'PSA', category: "Men's Health", description: 'Screening marker for prostate health.' },
  { id: '20', name: 'Chest X-Ray', code: 'CXR', category: 'Radiology', description: 'Diagnostic imaging of chest and lungs.' },
  { id: '21', name: 'Electrocardiogram', code: 'ECG', category: 'Cardiac', description: 'Records electrical activity of the heart.' },
  { id: '22', name: 'Abdominal Ultrasound', code: 'USG', category: 'Radiology', description: 'Imaging of abdominal organs.' },
  { id: '23', name: 'Hemoglobin', code: 'HB', category: 'Hematology', description: 'Measures hemoglobin concentration.' },
  { id: '24', name: 'Blood Group & Rh Type', code: 'BG', category: 'Hematology', description: 'Determines ABO and Rh blood group.' },
];
