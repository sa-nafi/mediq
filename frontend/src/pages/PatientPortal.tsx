import { Link } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PatientPortal() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-20">
      <div className="text-center max-w-md">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-secondary/10 mb-6">
          <LayoutDashboard className="h-8 w-8 text-secondary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Patient Portal</h1>
        <p className="mt-3 text-muted">
          The patient portal is under development. You'll be able to view your reports, manage appointments, and access your health records here.
        </p>
        <div className="mt-6">
          <Button variant="outline" asChild>
            <Link to="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
