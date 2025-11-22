import React, { createContext, useContext } from 'react';
import {
    GestureResponderEvent,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Tipos para as variantes
type ToggleSize = 'default' | 'sm' | 'lg';
type ToggleVariant = 'default' | 'outline';

interface ToggleGroupContextType {
  size: ToggleSize;
  variant: ToggleVariant;
}

interface ToggleGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: ToggleVariant;
  size?: ToggleSize;
  children: React.ReactNode;
  className?: string;
  style?: any;
}

interface ToggleGroupItemProps {
  value: string;
  children: React.ReactNode;
  variant?: ToggleVariant;
  size?: ToggleSize;
  className?: string;
  style?: any;
}

// Context para compartilhar props entre os componentes
const ToggleGroupContext = createContext<ToggleGroupContextType>({
  size: 'default',
  variant: 'default',
});

// Utilitário para combinar classes (simplificado para RN)
const cn = (...classes: (string | undefined | false | null)[]): any => {
  return classes.filter(Boolean).join(' ');
};

// Estilos base para as variantes
const getToggleStyles = (variant: ToggleVariant, size: ToggleSize, isSelected: boolean) => {
  const baseStyles = {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: isSelected ? '#3b82f6' : '#ffffff',
  };

  const sizeStyles = {
    sm: { paddingHorizontal: 12, paddingVertical: 6 },
    default: { paddingHorizontal: 16, paddingVertical: 8 },
    lg: { paddingHorizontal: 20, paddingVertical: 10 },
  };

  const variantStyles = {
    default: {
      backgroundColor: isSelected ? '#3b82f6' : '#f8fafc',
      borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
    },
    outline: {
      backgroundColor: isSelected ? '#3b82f6' : '#ffffff',
      borderColor: '#e2e8f0',
    },
  };

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

const getTextStyles = (variant: ToggleVariant, size: ToggleSize, isSelected: boolean) => {
  const baseTextStyles = {
    fontWeight: '500' as const,
    color: isSelected ? '#ffffff' : '#64748b',
  };

  const sizeTextStyles = {
    sm: { fontSize: 14 },
    default: { fontSize: 16 },
    lg: { fontSize: 18 },
  };

  return {
    ...baseTextStyles,
    ...sizeTextStyles[size],
  };
};

// Componente ToggleGroup
function ToggleGroup({
  value,
  onValueChange,
  variant = 'default',
  size = 'default',
  children,
  className,
  style,
}: ToggleGroupProps) {
  const contextValue = { variant, size };

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      <View 
        style={[
          {
            flexDirection: 'row',
            borderRadius: 6,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<ToggleGroupItemProps>(child)) {
            const childValue = child.props.value;
            return React.cloneElement(child, {
              isSelected: value === childValue,
              onPress: () => onValueChange?.(childValue),
            } as Partial<typeof child.props>);
          }
          return child;
        })}
      </View>
    </ToggleGroupContext.Provider>
  );
}

// Componente ToggleGroupItem
function ToggleGroupItem({
  value,
  children,
  variant,
  size,
  className,
  style,
  isSelected,
  onPress,
}: ToggleGroupItemProps & {
  isSelected?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
}) {
  const context = useContext(ToggleGroupContext);
  
  const currentVariant = variant || context.variant;
  const currentSize = size || context.size;
  
  const toggleStyles = getToggleStyles(currentVariant, currentSize, isSelected || false);
  const textStyles = getTextStyles(currentVariant, currentSize, isSelected || false);

  return (
    <TouchableOpacity
      style={[toggleStyles, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {typeof children === 'string' ? (
        <Text style={textStyles}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

export { ToggleGroup, ToggleGroupItem };
