import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth-store';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      const res = await authApi.login(data);
      if (res.access_token) {
        setAccessToken(res.access_token);

        // After token is set, authStore will decode and set `user`.
        // The user might not be synchronously available in the state if we just read it,
        // but `useAuthStore.getState().user` will have it.
        const user = useAuthStore.getState().user;

        toast.success('Logged in successfully');

        const from = location.state?.from?.pathname;
        if (from) {
          navigate(from, { replace: true });
        } else {
          if (user?.role === 'patient') {
            navigate('/patient', { replace: true });
          } else {
            navigate('/staff', { replace: true });
          }
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialized && user) {
    const from = (location.state as any)?.from?.pathname || (user.role === 'patient' ? '/patient' : '/staff');
    return <Navigate to={from} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md rounded-3xl border border-border-light bg-surface p-8 shadow-card"
      >
        <div className="text-center mb-6">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-secondary/10 mb-4">
            <LogIn className="h-7 w-7 text-secondary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted">Sign in to access your portal</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1.5">
              Password
            </label>
            <Input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              {...register('password')}
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
          </div>
          <Button variant="default" size="lg" className="w-full bg-secondary hover:bg-secondary-light text-white" type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-secondary hover:text-secondary-light hover:underline underline-offset-4">
            Register here
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
