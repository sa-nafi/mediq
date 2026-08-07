import { Link } from 'react-router-dom';
import { LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-20">
      <div className="w-full max-w-md rounded-3xl border border-border-light bg-surface p-8 shadow-card">
        <div className="text-center mb-6">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-secondary/10 mb-4">
            <LogIn className="h-7 w-7 text-secondary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted">Sign in to access your patient portal</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <Input id="login-email" type="email" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-foreground mb-1.5">
              Password
            </label>
            <Input id="login-password" type="password" placeholder="Enter your password" />
          </div>
          <Button variant="default" size="lg" className="w-full" type="submit">
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          This is a placeholder login page. Authentication will be connected to the backend.
        </p>

        <div className="mt-4 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-secondary hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
