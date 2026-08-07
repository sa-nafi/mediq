import { useNavigate } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth-store';

export function StaffPortal() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore(state => state.clearAuth);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error(e);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-20">
      <div className="text-center max-w-md">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/10 mb-6">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Staff Portal</h1>
        <p className="mt-3 text-muted">
          The staff portal is under development. Receptionists, doctors, and lab technicians will access their workflows here.
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
