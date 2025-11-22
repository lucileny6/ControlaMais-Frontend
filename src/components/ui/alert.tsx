import React from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';

interface AlertProps {
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
  style?: ViewStyle;
}

interface AlertTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export function AlertC({ 
  variant = 'default', 
  children, 
  style 
}: AlertProps) {
  
  const baseStyle: ViewStyle = {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  };

  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
    },
    destructive: {
      backgroundColor: '#fef2f2',
      borderColor: '#fecaca',
    }
  };

  return (
    <View style={[baseStyle, variantStyles[variant], style]}>
      {children}
    </View>
  );
}

export function AlertTitle({ children, style }: AlertTitleProps) {
  const titleStyle: TextStyle = {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  };

  return (
    <Text style={[titleStyle, style]}>
      {children}
    </Text>
  );
}

export function AlertDescription({ children, style }: AlertDescriptionProps) {
  const descriptionStyle: TextStyle = {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  };

  return (
    <Text style={[descriptionStyle, style]}>
      {children}
    </Text>
  );
}