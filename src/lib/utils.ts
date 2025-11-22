// src/lib/utils.ts
import { StyleSheet } from 'react-native';

// Sistema de classes similar ao Tailwind
const tailwindClasses: Record<string, any> = {
  // Cores de background
  'bg-white': { backgroundColor: '#ffffff' },
  'bg-gray-50': { backgroundColor: '#f9fafb' },
  'bg-gray-100': { backgroundColor: '#f3f4f6' },
  'bg-gray-200': { backgroundColor: '#e5e7eb' },
  'bg-blue-500': { backgroundColor: '#3b82f6' },
  'bg-blue-600': { backgroundColor: '#2563eb' },
  
  // Cores de texto
  'text-white': { color: '#ffffff' },
  'text-gray-900': { color: '#111827' },
  'text-gray-700': { color: '#374151' },
  'text-gray-500': { color: '#6b7280' },
  'text-blue-500': { color: '#3b82f6' },
  
  // Espaçamento
  'p-2': { padding: 8 },
  'p-4': { padding: 16 },
  'p-6': { padding: 24 },
  'px-4': { paddingHorizontal: 16 },
  'py-2': { paddingVertical: 8 },
  'm-2': { margin: 8 },
  'm-4': { margin: 16 },
  
  // Tamanhos de texto
  'text-sm': { fontSize: 14 },
  'text-base': { fontSize: 16 },
  'text-lg': { fontSize: 18 },
  'text-xl': { fontSize: 20 },
  'text-2xl': { fontSize: 24 },
  
  // Pesos de fonte
  'font-normal': { fontWeight: '400' },
  'font-medium': { fontWeight: '500' },
  'font-semibold': { fontWeight: '600' },
  'font-bold': { fontWeight: '700' },
  
  // Bordas
  'rounded': { borderRadius: 4 },
  'rounded-md': { borderRadius: 6 },
  'rounded-lg': { borderRadius: 8 },
  'rounded-xl': { borderRadius: 12 },
  'border': { borderWidth: 1 },
  'border-gray-300': { borderColor: '#d1d5db' },
  
  // Flexbox
  'flex': { flex: 1 },
  'flex-row': { flexDirection: 'row' },
  'flex-col': { flexDirection: 'column' },
  'items-center': { alignItems: 'center' },
  'justify-center': { justifyContent: 'center' },
  'justify-between': { justifyContent: 'space-between' },
};

// Função cn adaptada para React Native
export function cn(...classNames: (string | undefined | null | false)[]): any {
  const validClasses = classNames.filter(Boolean) as string[];
  
  return StyleSheet.flatten(
    validClasses.map(className => tailwindClasses[className] || {})
  );
}

// Outras funções utilitárias úteis
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}