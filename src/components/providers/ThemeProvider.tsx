import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  enableSystem?: boolean;
  storageKey?: string;
}

export const ThemeProvider = ({
  children,
  defaultTheme = 'dark',
  enableSystem = false,
  storageKey = 'orbitra-theme',
}: ThemeProviderProps) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      storageKey={storageKey}
    >
      {children}
    </NextThemeProvider>
  );
};


