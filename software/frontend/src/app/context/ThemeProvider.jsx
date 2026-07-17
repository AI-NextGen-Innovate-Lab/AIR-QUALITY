import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const STORAGE_KEY = 'airquality-dsm-theme';

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={STORAGE_KEY}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}

export { STORAGE_KEY };
