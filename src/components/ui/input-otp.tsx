import { Minus } from 'lucide-react-native';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Tipos
interface InputOTPProps {
  value?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  containerClassName?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  children: React.ReactNode;
}

interface OTPInputContextType {
  value: string;
  setValue: (value: string) => void;
  maxLength: number;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  slots: Array<{
    char: string;
    isActive: boolean;
    hasFakeCaret: boolean;
  }>;
}

const OTPInputContext = createContext<OTPInputContextType | undefined>(undefined);

function useOTPInput() {
  const context = useContext(OTPInputContext);
  if (context === undefined) {
    throw new Error('useOTPInput must be used within an InputOTP');
  }
  return context;
}

// Componente Principal
function InputOTP({
  value: controlledValue,
  onChange,
  maxLength = 6,
  containerClassName,
  className,
  disabled = false,
  autoFocus = false,
  children,
  ...props
}: InputOTPProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(autoFocus ? 0 : -1);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const setValue = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    onChange?.(newValue);
  };

  // Preparar slots
  const slots = Array.from({ length: maxLength }, (_, index) => ({
    char: value[index] || '',
    isActive: focusedIndex === index,
    hasFakeCaret: focusedIndex === index && !value[index],
  }));

  const contextValue: OTPInputContextType = {
    value,
    setValue,
    maxLength,
    focusedIndex,
    setFocusedIndex,
    slots,
  };

  // Focar no input quando focusedIndex mudar
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < maxLength) {
      inputRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, maxLength]);

  // Auto-focus no primeiro input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      setTimeout(() => {
        setFocusedIndex(0);
      }, 100);
    }
  }, [autoFocus]);

  const handleTextChange = (text: string, index: number) => {
    if (disabled) return;

    // Remover caracteres não numéricos se for um OTP numérico
    const cleanText = text.replace(/[^0-9]/g, '');

    if (cleanText) {
      const newValue = value.split('');
      newValue[index] = cleanText[0];
      const newValueStr = newValue.join('').slice(0, maxLength);
      setValue(newValueStr);

      // Mover para o próximo input
      if (index < maxLength - 1 && cleanText.length === 1) {
        setFocusedIndex(index + 1);
      }
    } else {
      // Backspace - limpar o campo atual
      const newValue = value.split('');
      newValue[index] = '';
      setValue(newValue.join(''));

      // Mover para o input anterior
      if (index > 0) {
        setFocusedIndex(index - 1);
      }
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      setFocusedIndex(index - 1);
    }
  };

  // Render children e injetar refs
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === InputOTPGroup) {
        return React.cloneElement(child, {
          inputRefs,
          handleTextChange,
          handleKeyPress,
          disabled,
        } as any);
      }
    }
    return child;
  });

  return (
    <OTPInputContext.Provider value={contextValue}>
      <View
        style={[
          styles.container,
          disabled && styles.containerDisabled,
        ]}
        {...props}
      >
        {childrenWithProps}
        
        {/* Inputs escondidos para cada slot */}
        {slots.map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={styles.hiddenInput}
            value={value[index] || ''}
            onChangeText={(text) => handleTextChange(text, index)}
            onKeyPress={(event) => handleKeyPress(event, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(-1)}
            keyboardType="numeric"
            maxLength={1}
            editable={!disabled}
            selectTextOnFocus
          />
        ))}
      </View>
    </OTPInputContext.Provider>
  );
}

// Group Component
function InputOTPGroup({
  children,
  style,
  inputRefs,
  handleTextChange,
  handleKeyPress,
  disabled,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
  inputRefs?: any;
  handleTextChange?: any;
  handleKeyPress?: any;
  disabled?: boolean;
}) {
  const { slots } = useOTPInput();

  const childrenWithProps = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child)) {
      if (child.type === InputOTPSlot) {
        return React.cloneElement(child, {
          index,
          inputRefs,
          handleTextChange,
          handleKeyPress,
          disabled,
        } as any);
      }
    }
    return child;
  });

  return (
    <View style={[styles.group, style]} {...props}>
      {childrenWithProps}
    </View>
  );
}

// Slot Component
function InputOTPSlot({
  index,
  style,
  ...props
}: {
  index: number;
  style?: any;
}) {
  const { slots } = useOTPInput();
  const caretAnim = useRef(new Animated.Value(1)).current;
  const slot = slots[index];

  // Animação do caret
  useEffect(() => {
    if (slot.hasFakeCaret) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(caretAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(caretAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();

      return () => animation.stop();
    }
  }, [slot.hasFakeCaret, caretAnim]);

  return (
    <TouchableOpacity
      style={[
        styles.slot,
        slot.isActive && styles.slotActive,
        style,
      ]}
      activeOpacity={0.7}
      {...props}
    >
      <Text style={styles.slotText}>
        {slot.char}
      </Text>
      
      {slot.hasFakeCaret && (
        <Animated.View 
          style={[
            styles.caret,
            { opacity: caretAnim }
          ]} 
        />
      )}
    </TouchableOpacity>
  );
}

// Separator Component
function InputOTPSeparator({ style, ...props }: { style?: any }) {
  return (
    <View style={[styles.separator, style]} {...props}>
      <Minus size={16} color="#6B7280" />
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slot: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  slotActive: {
    borderColor: '#007AFF',
    elevation: 4,
  },
  slotText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  caret: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: '#111827',
  },
  separator: {
    paddingHorizontal: 8,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});

// Hook para uso simplificado
function useInputOTP(maxLength = 6) {
  const [value, setValue] = useState('');

  return {
    value,
    setValue,
    maxLength,
  };
}

// Componente OTP completo pré-configurado
interface CompleteInputOTPProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

function CompleteInputOTP({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}: CompleteInputOTPProps) {
  return (
    <InputOTP
      value={value}
      onChange={onChange}
      maxLength={length}
      disabled={disabled}
      autoFocus={autoFocus}
    >
      <InputOTPGroup>
        {Array.from({ length }, (_, index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

// Exportações
export {
  CompleteInputOTP, InputOTP,
  InputOTPGroup, InputOTPSeparator, InputOTPSlot, useInputOTP, useOTPInput
};

