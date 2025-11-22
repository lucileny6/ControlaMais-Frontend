import React from 'react';
import {
  GestureResponderEvent,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

// Tipos para as variantes
type ToggleSize = 'default' | 'sm' | 'lg';
type ToggleVariant = 'default' | 'outline';

interface ToggleProps {
  pressed?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  variant?: ToggleVariant;
  size?: ToggleSize;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  invalid?: boolean;
}

// Utilitário para combinar estilos
const mergeStyles = (base: ViewStyle, additional: ViewStyle): ViewStyle => {
  return { ...base, ...additional };
};

// Estilos base para as variantes
const getToggleStyles = (
  variant: ToggleVariant,
  size: ToggleSize,
  pressed: boolean,
  disabled: boolean,
  invalid: boolean
): ViewStyle => {
  const baseStyles: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    gap: 8,
  };

  const sizeStyles: Record<ToggleSize, ViewStyle> = {
    default: {
      height: 36,
      paddingHorizontal: 8,
      minWidth: 36,
    },
    sm: {
      height: 32,
      paddingHorizontal: 6,
      minWidth: 32,
    },
    lg: {
      height: 40,
      paddingHorizontal: 10,
      minWidth: 40,
    },
  };

  const variantStyles: Record<ToggleVariant, ViewStyle> = {
    default: {
      backgroundColor: pressed ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      borderWidth: 0,
    },
    outline: {
      backgroundColor: pressed ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      borderWidth: 1,
      borderColor: invalid ? '#dc2626' : '#e2e8f0',
      elevation: 1,
    },
  };

  const stateStyles: ViewStyle = disabled
    ? {
        opacity: 0.5,
        pointerEvents: 'none',
      }
    : {};

  const invalidStyles: ViewStyle = invalid
    ? {
        borderColor: '#dc2626',
      }
    : {};

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...stateStyles,
    ...invalidStyles,
  };
};

const getTextStyles = (
  variant: ToggleVariant,
  size: ToggleSize,
  pressed: boolean,
  disabled: boolean
): TextStyle => {
  const baseStyles: TextStyle = {
    fontWeight: '500',
  };

  const sizeStyles: Record<ToggleSize, TextStyle> = {
    default: { fontSize: 14 },
    sm: { fontSize: 14 },
    lg: { fontSize: 16 },
  };

  const colorStyles: TextStyle = pressed
    ? { color: '#1e40af' } // accent-foreground
    : { color: disabled ? '#9ca3af' : '#64748b' }; // muted-foreground

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...colorStyles,
  };
};

// Componente de ícone para substituir SVG
const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ pointerEvents: 'none', flexShrink: 0 }}>
    {children}
  </div>
);

// Componente Toggle principal
function Toggle({
  pressed = false,
  onPress,
  disabled = false,
  variant = 'default',
  size = 'default',
  children,
  className,
  style,
  invalid = false,
  ...props
}: ToggleProps) {
  const toggleStyles = getToggleStyles(variant, size, pressed, disabled, invalid);
  const textStyles = getTextStyles(variant, size, pressed, disabled);

  const handlePress = (event: GestureResponderEvent) => {
    if (!disabled && onPress) {
      onPress(event);
    }
  };

  // Processar children para aplicar estilos de texto e ícones
  const renderChildren = () => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        return <Text style={textStyles}>{child}</Text>;
      }
      
      // Se for um elemento React, verificar se é um ícone
      if (React.isValidElement(child)) {
        // Você pode adicionar lógica aqui para detectar ícones
        // Por enquanto, apenas envolvemos em um wrapper
        return <IconWrapper>{child}</IconWrapper>;
      }
      
      return child;
    });
  };

  return (
    <TouchableOpacity
      style={[toggleStyles, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityState={{ selected: pressed, disabled }}
      {...props}
    >
      {renderChildren()}
    </TouchableOpacity>
  );
}

export { Toggle, type ToggleSize, type ToggleVariant };

