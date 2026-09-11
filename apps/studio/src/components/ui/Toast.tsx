import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from 'next-themes';

export { toast } from 'sonner';

export interface ToasterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}

export function Toaster({ position = 'bottom-right' }: ToasterProps) {
  const { theme = 'dark', resolvedTheme } = useTheme();
  const activeTheme = (resolvedTheme || theme || 'dark') as 'light' | 'dark' | 'system';

  return (
    <SonnerToaster
      theme={activeTheme}
      position={position}
      expand={false}
      closeButton
      offset={{ bottom: 90, right: 24 }}
      toastOptions={{
        className: 'focusflow-toast font-sans text-xs',
      }}
    />
  );
}
