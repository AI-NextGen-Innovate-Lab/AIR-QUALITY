import React, { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={mounted && resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  );
}
