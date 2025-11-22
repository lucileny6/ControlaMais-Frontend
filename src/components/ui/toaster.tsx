import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

export function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;
  return (
    <>
      {toasts.map((toast) => (
        <Toast 
          key={toast.id} 
          {...toast}
        />
      ))}
    </>
  );
}

const styles = {
  toastContent: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    flex: 1,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
};