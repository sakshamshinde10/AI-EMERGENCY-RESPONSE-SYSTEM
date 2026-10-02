import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeProviderContext = createContext(null);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'theme'
}) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return defaultTheme;

    const storedTheme = localStorage.getItem(storageKey);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : defaultTheme;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    localStorage.setItem(storageKey, nextTheme);
    setThemeState(nextTheme);
  }, [storageKey]);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(storageKey, nextTheme);
      return nextTheme;
    });
  }, [storageKey]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [setTheme, theme, toggleTheme]);

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }

  return context;
}
