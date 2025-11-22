import { Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

// Tipos
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<View | null>;
  triggerWidth: number;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

function useSelect() {
  const context = React.useContext(SelectContext);
  if (context === undefined) {
    throw new Error('useSelect must be used within a Select');
  }
  return context;
}

// Componente Principal
function Select({
  value: controlledValue,
  onValueChange,
  defaultValue = '',
  children,
  disabled = false,
  ...props
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [triggerWidth, setTriggerWidth] = useState(0);
  const triggerRef = useRef<View>(null);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  };

  const contextValue: SelectContextType = {
    value,
    onValueChange: handleValueChange,
    open,
    setOpen,
    triggerRef,
    triggerWidth,
  };

  const measureTrigger = () => {
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setTriggerWidth(width);
      });
    }
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <View {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            if (child.type === SelectTrigger) {
              return React.cloneElement(child, {
                ref: triggerRef,
                onLayout: measureTrigger,
                disabled,
              } as any);
            }
          }
          return child;
        })}
      </View>
    </SelectContext.Provider>
  );
}

// Trigger Component
interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
  disabled?: boolean;
}

const SelectTrigger = React.forwardRef<View, SelectTriggerProps>(
  ({ children, style, disabled = false, ...props }, ref) => {
    const { open, setOpen, value } = useSelect();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: open ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, [open, fadeAnim]);

    const rotate = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <TouchableOpacity
        ref={ref}
        style={[
          styles.trigger,
          disabled && styles.triggerDisabled,
          style,
        ]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
        {...props}
      >
        <View style={styles.triggerContent}>
          {children}
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={16} color="#6B7280" />
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

// Value Component
function SelectValue({
  children,
  placeholder = "Select...",
  style,
  ...props
}: {
  children?: React.ReactNode;
  placeholder?: string;
  style?: any;
}) {
  const { value } = useSelect();

  return (
    <Text style={[styles.value, style]} {...props}>
      {children || value || placeholder}
    </Text>
  );
}

// Content Component
interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
  position?: 'popper' | 'inline';
}

function SelectContent({
  children,
  style,
  position = 'popper',
  ...props
}: SelectContentProps) {
  const { open, setOpen, triggerWidth } = useSelect();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.spring(fadeAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [open, slideAnim, fadeAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.content,
                { width: position === 'popper' ? triggerWidth : 'auto' },
                style,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY }],
                },
              ]}
              {...props}
            >
              <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {children}
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Item Component
interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}

function SelectItem({
  value,
  children,
  disabled = false,
  style,
  textStyle,
  ...props
}: SelectItemProps) {
  const { value: selectedValue, onValueChange } = useSelect();
  const isSelected = selectedValue === value;

  const handlePress = () => {
    if (!disabled) {
      onValueChange(value);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.item,
        isSelected && styles.itemSelected,
        disabled && styles.itemDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <Text style={[
        styles.itemText,
        isSelected && styles.itemTextSelected,
        disabled && styles.itemTextDisabled,
        textStyle,
      ]}>
        {children}
      </Text>
      
      {isSelected && (
        <Check size={16} color="#007AFF" style={styles.checkIcon} />
      )}
    </TouchableOpacity>
  );
}

// Group Component
function SelectGroup({
  children,
  style,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[styles.group, style]} {...props}>
      {children}
    </View>
  );
}

// Label Component
function SelectLabel({
  children,
  style,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[styles.label, style]} {...props}>
      <Text style={styles.labelText}>{children}</Text>
    </View>
  );
}

// Separator Component
function SelectSeparator({
  style,
  ...props
}: {
  style?: any;
}) {
  return (
    <View style={[styles.separator, style]} {...props} />
  );
}

// Scroll Button Components
function SelectScrollUpButton({
  style,
  ...props
}: {
  style?: any;
}) {
  return (
    <View style={[styles.scrollButton, style]} {...props}>
      <ChevronUp size={16} color="#6B7280" />
    </View>
  );
}

function SelectScrollDownButton({
  style,
  ...props
}: {
  style?: any;
}) {
  return (
    <View style={[styles.scrollButton, style]} {...props}>
      <ChevronDown size={16} color="#6B7280" />
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    minWidth: 120,
  },
  triggerDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
  triggerContent: {
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    maxHeight: 200,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scrollView: {
    borderRadius: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
  },
  itemSelected: {
    backgroundColor: '#EFF6FF',
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  itemTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  itemTextDisabled: {
    color: '#9CA3AF',
  },
  checkIcon: {
    marginLeft: 8,
  },
  group: {
    gap: 2,
  },
  label: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  scrollButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
});

// Hook para uso simplificado
function useSelectState(defaultValue = '') {
  const [value, setValue] = useState(defaultValue);

  return {
    value,
    setValue,
  };
}

// Componente Select completo pré-configurado
interface CompleteSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
  style?: any;
}

function CompleteSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  style,
}: CompleteSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger style={style}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Exportações
export {
  CompleteSelect, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger,
  SelectValue, useSelect,
  useSelectState
};

