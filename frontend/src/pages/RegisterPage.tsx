import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth-store';

const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['M', 'F', 'O']),
  blood_type: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      const res = await authApi.register(data);
      if (res.access_token) {
        setAccessToken(res.access_token);
        toast.success('Registration successful');
        navigate('/patient', { replace: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialized && user) {
    return <Navigate to={user.role === 'patient' ? '/patient' : '/staff'} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg rounded-3xl border border-border-light bg-surface p-8 shadow-card"
      >
        <div className="text-center mb-6">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-secondary/10 mb-4">
            <UserPlus className="h-7 w-7 text-secondary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create an Account</h1>
          <p className="mt-2 text-sm text-muted">Join Noor Healthcare patient portal</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">First Name *</label>
              <Input placeholder="John" {...register('first_name')} />
              {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Last Name *</label>
              <Input placeholder="Doe" {...register('last_name')} />
              {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
            <Input type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password *</label>
            <Input type="password" placeholder="Create a password" {...register('password')} />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date of Birth *</label>
              <Input type="date" {...register('date_of_birth')} />
              {errors.date_of_birth && <p className="mt-1 text-xs text-red-500">{errors.date_of_birth.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Gender *</label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('gender')}
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
              {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Blood Type</label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('blood_type')}
              >
                <option value="">Select (Optional)</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
              <Input type="tel" placeholder="Phone number" {...register('phone')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
            <Input placeholder="Your address" {...register('address')} />
          </div>

          <Button variant="default" size="lg" className="w-full bg-secondary hover:bg-secondary-light text-white mt-4" type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Register'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-secondary hover:text-secondary-light hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-secondary hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
