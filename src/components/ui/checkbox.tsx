import { Check } from 'lucide-react-native';
import React from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Tipos
interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: number;
  label?: string;
  labelPosition?: 'left' | 'right';
  accessibilityLabel?: string;
}

function Checkbox({
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
  size = 24,
  label,
  labelPosition = 'right',
  accessibilityLabel,
  ...props
}: CheckboxProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled) return;
    
    // Animação de press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onCheckedChange?.(!checked);
  };

  const checkboxContent = (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View
        style={[
          styles.checkbox,
          {
            width: size,
            height: size,
            borderRadius: size / 6,
          },
          checked && styles.checkboxChecked,
          disabled && styles.checkboxDisabled,
        ]}
      >
        {checked && (
          <Check 
            size={size * 0.6} 
            color={checked ? '#fff' : '#000'} 
          />
        )}
      </View>
    </Animated.View>
  );

  const labelComponent = label ? (
    <Text 
      style={[
        styles.label,
        disabled && styles.labelDisabled,
        { marginLeft: labelPosition === 'right' ? 8 : 0, marginRight: labelPosition === 'left' ? 8 : 0 }
      ]}
    >
      {label}
    </Text>
  ) : null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        disabled && styles.containerDisabled,
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel || label}
      activeOpacity={0.7}
      {...props}
    >
      {labelPosition === 'left' && labelComponent}
      {checkboxContent}
      {labelPosition === 'right' && labelComponent}
    </TouchableOpacity>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    borderWidth: 2,
    borderColor: '#6B7280', // gray-500
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF', // blue-500
    borderColor: '#007AFF',
  },
  checkboxDisabled: {
    borderColor: '#D1D5DB', // gray-300
    backgroundColor: '#F3F4F6', // gray-100
  },
  label: {
    fontSize: 16,
    color: '#111827', // gray-900
  },
  labelDisabled: {
    color: '#6B7280', // gray-500
  },
});

// Componente Checkbox com FormField (para uso com formulários)
interface CheckboxFieldProps extends CheckboxProps {
  error?: string;
  helperText?: string;
}

function CheckboxField({
  error,
  helperText,
  ...checkboxProps
}: CheckboxFieldProps) {
  return (
    <View style={fieldStyles.fieldContainer}>
      <Checkbox {...checkboxProps} />
      {(error || helperText) && (
        <Text style={[
          fieldStyles.helperText,
          error && fieldStyles.helperTextError
        ]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

// Estilos para o campo
const fieldStyles = StyleSheet.create({
  fieldContainer: {
    marginVertical: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280', // gray-500
    marginTop: 4,
    marginLeft: 32, // Alinhar com o checkbox
  },
  helperTextError: {
    color: '#DC2626', // red-600
  },
});

export { Checkbox, CheckboxField };

