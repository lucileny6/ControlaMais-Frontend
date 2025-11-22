import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import React from 'react';

const lightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: '#000000',
    background: '#ffffff',
    card: '#ffffff',
    text: '#000000',
    border: '#e5e5e5',
    notification: '#ff3b30',
    // Suas cores customizadas
    secondary: '#666666',
    muted: '#f5f5f5',
    destructive: '#dc2626',
    chart1: '#3b82f6',
    chart2: '#ef4444',
    chart3: '#10b981',
    chart4: '#f59e0b',
    chart5: '#8b5cf6',
  },
};

const darkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: '#ffffff',
    background: '#000000',
    card: '#1a1a1a',
    text: '#ffffff',
    border: '#333333',
    notification: '#ff453a',
    // Suas cores customizadas
    secondary: '#a0a0a0',
    muted: '#2a2a2a',
    destructive: '#ef4444',
    chart1: '#60a5fa',
    chart2: '#f87171',
    chart3: '#34d399',
    chart4: '#fbbf24',
    chart5: '#a78bfa',
  },
};

interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

export function ThemeProvider({ children, theme = 'light' }: ThemeProviderProps) {
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <NavigationThemeProvider value={currentTheme}>
      {children}
    </NavigationThemeProvider>
  );
}