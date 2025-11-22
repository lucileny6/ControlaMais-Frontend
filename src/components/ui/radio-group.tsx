import { Circle } from 'lucide-react-native';
import React, { createContext, useContext } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Tipos
interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
  style?: any;
  disabled?: boolean;
}

interface RadioGroupContextType {
  value: string;
  onValueChange: (value: string) => void;
  disabled: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextType | undefined>(undefined);

function useRadioGroup() {
  const context = useContext(RadioGroupContext);
  if (context === undefined) {
    throw new Error('useRadioGroup must be used within a RadioGroup');
  }
  return context;
}

// Componente Principal
function RadioGroup({
  value: controlledValue,
  onValueChange,
  defaultValue = '',
  children,
  style,
  disabled = false,
  ...props
}: RadioGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const contextValue: RadioGroupContextType = {
    value,
    onValueChange: handleValueChange,
    disabled,
  };

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <View style={[styles.radioGroup, style]} {...props}>
        {children}
      </View>
    </RadioGroupContext.Provider>
  );
}

// Item Component
interface RadioGroupItemProps {
  value: string;
  children?: React.ReactNode;
  label?: string;
  description?: string;
  disabled?: boolean;
  style?: any;
  labelStyle?: any;
  descriptionStyle?: any;
}

function RadioGroupItem({
  value,
  children,
  label,
  description,
  disabled: itemDisabled = false,
  style,
  labelStyle,
  descriptionStyle,
  ...props
}: RadioGroupItemProps) {
  const { value: selectedValue, onValueChange, disabled: groupDisabled } = useRadioGroup();
  const isSelected = selectedValue === value;
  const disabled = groupDisabled || itemDisabled;

  const handlePress = () => {
    if (!disabled) {
      onValueChange(value);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.item,
        disabled && styles.itemDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <View style={styles.itemContent}>
        {/* Radio Circle */}
        <View style={[
          styles.radio,
          isSelected && styles.radioSelected,
          disabled && styles.radioDisabled,
        ]}>
          {isSelected && (
            <Circle 
              size={8} 
              fill={disabled ? '#9CA3AF' : '#007AFF'} 
              color={disabled ? '#9CA3AF' : '#007AFF'} 
            />
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {children || (
            <>
              {label && (
                <Text style={[
                  styles.label,
                  disabled && styles.labelDisabled,
                  labelStyle,
                ]}>
                  {label}
                </Text>
              )}
              {description && (
                <Text style={[
                  styles.description,
                  disabled && styles.descriptionDisabled,
                  descriptionStyle,
                ]}>
                  {description}
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Indicator Component (para uso customizado)
function RadioGroupIndicator({
  isSelected,
  disabled = false,
  style,
}: {
  isSelected: boolean;
  disabled?: boolean;
  style?: any;
}) {
  return (
    <View style={[
      styles.radio,
      isSelected && styles.radioSelected,
      disabled && styles.radioDisabled,
      style,
    ]}>
      {isSelected && (
        <Circle 
          size={8} 
          fill={disabled ? '#9CA3AF' : '#007AFF'} 
          color={disabled ? '#9CA3AF' : '#007AFF'} 
        />
      )}
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  radioGroup: {
    gap: 12,
  },
  item: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  itemWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  radioDisabled: {
    borderColor: '#9CA3AF',
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  labelDisabled: {
    color: '#9CA3AF',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  descriptionDisabled: {
    color: '#9CA3AF',
  },

  iconItem: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
  },
  iconItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTextContent: {
    flex: 1,
    gap: 4,
  },
  iconLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  iconDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  iconLabelDisabled: {
    color: '#9ca3af',
  },
  iconDescriptionDisabled: {
    color: '#d1d5db',
  },
  iconIndicator: {
    marginLeft: 'auto',
  },
});

// Hook para uso simplificado
function useRadioGroupState(defaultValue = '') {
  const [value, setValue] = React.useState(defaultValue);

  return {
    value,
    setValue,
  };
}

// Componentes pré-configurados

// Radio Item com layout horizontal
function HorizontalRadioItem({
  value,
  label,
  style,
  ...props
}: RadioGroupItemProps) {
  return (
    <RadioGroupItem
      value={value}
      style={[customStyles.horizontalItem, style]}
      {...props}
    >
      <View style={customStyles.horizontalContent}>
        <Text style={customStyles.horizontalLabel}>{label}</Text>
      </View>
    </RadioGroupItem>
  );
}

// Radio Item com ícone
interface IconRadioItemProps extends RadioGroupItemProps {
  icon: React.ReactNode;
}

function IconRadioItem({
  value,
  label,
  description,
  icon,
  style,
  ...props
}: IconRadioItemProps) {
  return (
    <RadioGroupItem
      value={value}
      style={[styles.iconItem, style]}
      {...props}
    >
      <View style={styles.iconItemContent}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.iconTextContent}>
          <Text style={styles.label}>{label}</Text>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>
      </View>
    </RadioGroupItem>
  );
}

// Estilos adicionais para componentes customizados
const customStyles = StyleSheet.create({
  horizontalItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  horizontalContent: {
    alignItems: 'center',
    gap: 8,
  },
  horizontalLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  iconItem: {
    padding: 16,
  },
  iconItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconTextContent: {
    flex: 1,
    gap: 4,
  },
});

// Combinar estilos
Object.assign(styles, customStyles);

// Exportações
export {
  HorizontalRadioItem,
  IconRadioItem, RadioGroup, RadioGroupIndicator, RadioGroupItem, useRadioGroup,
  useRadioGroupState
};

