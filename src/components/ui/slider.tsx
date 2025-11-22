import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from 'react-native';

// Tipos
interface SliderProps {
  value?: number ;
  defaultValue?: number | number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number | number[]) => void;
  onValueCommit?: (value: number | number[]) => void;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  style?: ViewStyle;
  trackStyle?: any;
  rangeStyle?: any;
  thumbStyle?: any;
}

function Slider({
  value: controlledValue,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  onValueCommit,
  disabled = false,
  orientation = 'horizontal',
  style,
  trackStyle,
  rangeStyle,
  thumbStyle,
  ...props
}: SliderProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : uncontrolledValue;

  // Converter para array para facilitar o tratamento
  const values = useMemo(() => {
    if (Array.isArray(currentValue)) {
      return currentValue.map(v => Math.max(min, Math.min(max, v)));
    }
    return [Math.max(min, Math.min(max, currentValue))];
  }, [currentValue, min, max]);

  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [trackHeight, setTrackHeight] = useState(0);

  // Animações para os thumbs
  const thumbPositions = useRef(
    values.map(() => new Animated.Value(0))
  ).current;

  // Atualizar posições dos thumbs quando o valor mudar
  React.useEffect(() => {
    values.forEach((value, index) => {
      const position = getPositionFromValue(value);
      Animated.spring(thumbPositions[index], {
        toValue: position,
        useNativeDriver: false,
        damping: 15,
        stiffness: 150,
      }).start();
    });
  }, [values, min, max, trackWidth, trackHeight]);

  const getPositionFromValue = (value: number) => {
    const percentage = (value - min) / (max - min);
    if (orientation === 'horizontal') {
      return percentage * trackWidth;
    } else {
      return percentage * trackHeight;
    }
  };

  const getValueFromPosition = (position: number) => {
    let percentage;
    if (orientation === 'horizontal') {
      percentage = position / trackWidth;
    } else {
      percentage = position / trackHeight;
    }

    let value = min + percentage * (max - min);
    
    // Aplicar step
    if (step > 0) {
      value = Math.round(value / step) * step;
    }
    
    return Math.max(min, Math.min(max, value));
  };

  const handleTrackLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setTrackWidth(width);
    setTrackHeight(height);
  };

  const updateValue = (newValues: number[], commit = false) => {
    const result = newValues.length === 1 ? newValues[0] : [...newValues];
    
    if (!isControlled) {
      setUncontrolledValue(result);
    }
    
    onValueChange?.(result);
    
    if (commit) {
      onValueCommit?.(result);
    }
  };

  // Criar PanResponders para cada thumb
  const panResponders = values.map((_, index) => {
    let startValue = values[index];

    return PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (event: GestureResponderEvent) => {
        startValue = values[index];
      },
      onPanResponderMove: (event: GestureResponderEvent, gesture: PanResponderGestureState) => {
        if (!trackRef.current) return;

        trackRef.current.measure((x, y, width, height) => {
          let newPosition;
          
          if (orientation === 'horizontal') {
            const trackX = x;
            const thumbX = event.nativeEvent.pageX - trackX;
            newPosition = Math.max(0, Math.min(width, thumbX));
          } else {
            const trackY = y;
            const thumbY = event.nativeEvent.pageY - trackY;
            newPosition = Math.max(0, Math.min(height, thumbY));
          }

          const newValue = getValueFromPosition(newPosition);
          
          // Para sliders de range, garantir a ordem dos valores
          const newValues = [...values];
          newValues[index] = newValue;
          
          // Ordenar valores para sliders de range múltiplo
          if (newValues.length > 1) {
            newValues.sort((a, b) => a - b);
          }
          
          updateValue(newValues);
        });
      },
      onPanResponderRelease: () => {
        updateValue(values, true);
      },
    });
  });

  // Calcular estilo do range
  const getRangeStyle = () => {
    if (values.length === 1) {
      const position = getPositionFromValue(values[0]);
      if (orientation === 'horizontal') {
        return {
          width: position,
          height: '100%',
        };
      } else {
        return {
          width: '100%',
          height: position,
        };
      }
    } else {
      // Para range com múltiplos valores
      const startPosition = getPositionFromValue(values[0]);
      const endPosition = getPositionFromValue(values[1]);
      
      if (orientation === 'horizontal') {
        return {
          left: startPosition,
          width: endPosition - startPosition,
          height: '100%',
        };
      } else {
        return {
          bottom: startPosition,
          height: endPosition - startPosition,
          width: '100%',
        };
      }
    }
  };

  return (
    <View
      style={[
        styles.container,
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {/* Track */}
      <View
        ref={trackRef}
        style={[
          styles.track,
          orientation === 'horizontal' ? styles.trackHorizontal : styles.trackVertical,
          trackStyle,
        ]}
        onLayout={handleTrackLayout}
      >
        {/* Range */}
        <Animated.View
          style={[
            styles.range,
            getRangeStyle(),
            rangeStyle,
          ]}
        />
      </View>

      {/* Thumbs */}
      {values.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.thumb,
            orientation === 'horizontal' 
              ? { transform: [{ translateX: thumbPositions[index] }] }
              : { transform: [{ translateY: thumbPositions[index] }] },
            thumbStyle,
          ]}
          {...panResponders[index].panHandlers}
        />
      ))}
    </View>
  );
}

// Componente Slider com marcações
interface SliderWithMarksProps extends SliderProps {
  marks?: Array<number | { value: number; label?: string }>;
  showMarks?: boolean;
  min?: number;
  max?: number;
}



function SliderWithMarks({
  marks = [],
  showMarks = true,
  min = 0,
  max = 100,
  ...props
}: SliderWithMarksProps) {
  const defaultMarks = useMemo(() => {
    if (marks.length > 0) return marks;
    
    // Gerar marcações automáticas
    const step = (max - min) / 4;
    return Array.from({ length: 5 }, (_, i) => min + i * step);
  }, [marks, min, max]);

  return (
    <View style={styles.marksContainer}>
      <Slider min={min} max={max} {...props} />
      
      {showMarks && (
        <View style={styles.marks}>
          {defaultMarks.map((mark, index) => {
            const value = typeof mark === 'number' ? mark : mark.value;
            const label = typeof mark === 'number' ? value.toString() : mark.label || mark.value.toString();
            
            return (
              <View key={index} style={styles.markContainer}>
                <View style={styles.mark} />
                <Text style={styles.markLabel}>{label}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// Componente Slider com valor exibido
interface SliderWithValueProps extends SliderProps {
  showValue?: boolean;
  valueFormat?: (value: number | number[]) => string;
}

function SliderWithValue({
  showValue = true,
  valueFormat,
  ...props
}: SliderWithValueProps) {
  const [currentValue, setCurrentValue] = useState(
    Array.isArray(props.value) ? props.value : [props.value || props.defaultValue || 0]
  );

  const handleValueChange = (value: number | number[]) => {
    setCurrentValue(Array.isArray(value) ? value : [value]);
    props.onValueChange?.(value);
  };

  const formatValue = () => {
    if (valueFormat) {
      return valueFormat(Array.isArray(currentValue) && currentValue.length === 1 ? currentValue[0] : currentValue);
    }
    
    if (currentValue.length === 1) {
      return currentValue[0].toString();
    } else {
      return currentValue.join(' - ');
    }
  };

  return (
    <View style={styles.valueContainer}>
      <Slider {...props} onValueChange={handleValueChange} />
      
      {showValue && (
        <View style={styles.valueDisplay}>
          <Text style={styles.valueText}>{formatValue()}</Text>
        </View>
      )}
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontal: {
    width: '100%',
    height: 40,
  },
  vertical: {
    width: 40,
    height: 200,
  },
  disabled: {
    opacity: 0.5,
  },
  track: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    position: 'relative',
  },
  trackHorizontal: {
    width: '100%',
    height: 6,
  },
  trackVertical: {
    width: 6,
    height: '100%',
  },
  range: {
    backgroundColor: '#007AFF',
    borderRadius: 4,
    position: 'absolute',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#007AFF',
    elevation: 3,
    position: 'absolute',
  },
  marksContainer: {
    gap: 16,
  },
  marks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  markContainer: {
    alignItems: 'center',
  },
  mark: {
    width: 2,
    height: 6,
    backgroundColor: '#9CA3AF',
  },
  markLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  valueContainer: {
    gap: 12,
  },
  valueDisplay: {
    alignItems: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});

// Hook para uso simplificado
function useSliderState(initialValue: number | number[] = 0) {
  const [value, setValue] = useState(initialValue);

  return {
    value,
    setValue,
  };
}

// Exportações
export {
  Slider,
  SliderWithMarks,
  SliderWithValue,
  useSliderState
};

