import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  isPending?: boolean;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  isPending = false,
  variant = 'default',
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive';
  const Icon = isDestructive ? AlertTriangle : Info;

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 transition-all duration-300" />
        <AlertDialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] overflow-hidden border border-border-light bg-surface p-0 shadow-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl sm:rounded-3xl"
        >
          {/* Top accent bar */}
          <div className={cn("h-2 w-full", isDestructive ? "bg-red-500" : "bg-secondary")} />
          
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
              <div className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border shadow-sm transition-transform duration-300 data-[state=open]:scale-100 scale-95",
                isDestructive 
                  ? "bg-red-50 border-red-100 text-red-600" 
                  : "bg-secondary/10 border-secondary/20 text-secondary"
              )}>
                <Icon className="h-6 w-6" />
              </div>
              
              <div className="flex flex-col gap-2 mt-2 sm:mt-1">
                <AlertDialogPrimitive.Title className="text-xl font-extrabold leading-none tracking-tight text-foreground">
                  {title}
                </AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description className="text-[15px] leading-relaxed text-muted">
                  {description}
                </AlertDialogPrimitive.Description>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <AlertDialogPrimitive.Cancel asChild>
                <Button
                  variant="outline"
                  disabled={isPending}
                  className="rounded-xl h-11 px-6 transition-all"
                >
                  {cancelText}
                </Button>
              </AlertDialogPrimitive.Cancel>
              <AlertDialogPrimitive.Action asChild>
                <Button
                  variant={isDestructive ? "destructive" : "default"}
                  className={cn(
                    "rounded-xl h-11 px-6 font-semibold transition-all shadow-md active:scale-95",
                    !isDestructive && "bg-secondary hover:bg-secondary-light text-white"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    onConfirm();
                  }}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wait
                    </>
                  ) : (
                    confirmText
                  )}
                </Button>
              </AlertDialogPrimitive.Action>
            </div>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
