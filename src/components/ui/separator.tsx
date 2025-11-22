import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

// Utility function for className (if using NativeWind, otherwise ignore or map manually)
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  style?: ViewStyle;
}

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  style,
  ...props
}: SeparatorProps) {
  return (
    <View
      style={[
        styles.separator,
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  separator: {
    backgroundColor: '#e5e7eb', // bg-border
    flexShrink: 0, // shrink-0
  },
  horizontal: {
    height: 1, // h-px
    width: '100%', // w-full
  },
  vertical: {
    height: '100%', // h-full
    width: 1, // w-px
  },
});

export { Separator };

