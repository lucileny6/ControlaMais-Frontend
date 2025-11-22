import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ProgressProps {
  value: number;
  className?: string;
  style?: any;
  color?: string;
  backgroundColor?: string;
  height?: number;
}

function Progress({ 
  value, 
  style, 
  color = '#000000', 
  backgroundColor = 'rgba(0, 0, 0, 0.1)',
  height = 8 
}: ProgressProps) {
  // Garantir que o valor fique entre 0 e 100
  const progressValue = Math.min(Math.max(value || 0, 0), 100);
  
  return (
    <View 
      style={[
        styles.track, 
        { backgroundColor, height },
        style
      ]}
    >
      <View 
        style={[
          styles.indicator,
          { 
            width: `${progressValue}%`,
            backgroundColor: color,
            height
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 9999, // rounded-full
    overflow: 'hidden',
    width: '100%',
  },
  indicator: {
    borderRadius: 9999,
    transitionProperty: 'width', // Nota: React Native não suporta transições CSS
  },
});

export { Progress };
