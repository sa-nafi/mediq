export interface HealthPackage {
  id: string;
  name: string;
  description: string;
  testCount: number;
  category: string;
  /** Demo placeholder price — not real medical pricing */
  startingPrice: string;
  popular?: boolean;
}

/** Demo data — prices are placeholders and do not represent actual medical costs */
export const healthPackages: HealthPackage[] = [
  {
    id: 'complete-health',
    name: 'Complete Health Checkup',
    description: 'A comprehensive panel covering blood work, organ function, and vital health markers for overall wellness assessment.',
    testCount: 65,
    category: 'Full Body',
    startingPrice: 'From ৳3,500',
    popular: true,
  },
  {
    id: 'diabetes-screening',
    name: 'Diabetes Screening',
    description: 'Focused panel including fasting glucose, HbA1c, insulin levels, and kidney function markers.',
    testCount: 18,
    category: 'Diabetes',
    startingPrice: 'From ৳1,200',
  },
  {
    id: 'heart-health',
    name: 'Heart Health Package',
    description: 'Cardiac risk assessment with lipid profile, ECG, and inflammatory markers for heart health.',
    testCount: 24,
    category: 'Cardiac',
    startingPrice: 'From ৳2,800',
    popular: true,
  },
  {
    id: 'womens-wellness',
    name: "Women's Wellness",
    description: 'Tailored health screening including hormonal panel, thyroid, and vitamin assessments.',
    testCount: 32,
    category: "Women's Health",
    startingPrice: 'From ৳2,500',
  },
  {
    id: 'mens-wellness',
    name: "Men's Wellness",
    description: 'Comprehensive male health panel covering prostate markers, hormones, and metabolic health.',
    testCount: 28,
    category: "Men's Health",
    startingPrice: 'From ৳2,200',
  },
  {
    id: 'senior-health',
    name: 'Senior Health Checkup',
    description: 'Specialized screening for age-related conditions including bone density, vision, and cognitive markers.',
    testCount: 45,
    category: 'Senior',
    startingPrice: 'From ৳4,000',
    popular: true,
  },
];
