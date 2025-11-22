import React, { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Tipos
interface TextareaProps {
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  className?: string;
  style?: any;
  inputStyle?: any;
  label?: string;
  helperText?: string;
  maxLength?: number;
  autoFocus?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  showCharacterCount?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

function Textarea({
  value: controlledValue,
  defaultValue = '',
  onChangeText,
  placeholder = '',
  disabled = false,
  error = false,
  errorMessage,
  style,
  inputStyle,
  label,
  helperText,
  maxLength,
  autoFocus = false,
  multiline = true,
  numberOfLines = 4,
  showCharacterCount = false,
  onFocus,
  onBlur,
  ...props
}: TextareaProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  // Animações
  const focusAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleChangeText = (text: string) => {
    if (!isControlled) {
      setUncontrolledValue(text);
    }
    onChangeText?.(text);

    // Animação do label
    Animated.timing(labelAnim, {
      toValue: text ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
    
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.timing(labelAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
    
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (!value) {
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Interpolações para animações - CORRIGIDAS
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? '#DC2626' : '#D1D5DB', error ? '#DC2626' : '#007AFF'],
  });

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, -8],
  });

  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? '#DC2626' : '#6B7280', error ? '#DC2626' : '#007AFF'],
  });

  // CORREÇÃO: Valores estáticos para propriedades que não suportam Animated
  const elevation = isFocused ? 4 : 0;
  const backgroundColor = isFocused || value ? '#FFFFFF' : 'transparent';

  const characterCount = value?.length || 0;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;

  return (
    <View style={[styles.container, style]}>
      {/* Container principal com label flutuante */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={focusInput}
        disabled={disabled}
        style={styles.touchableContainer}
      >
        <Animated.View
          style={[
            styles.inputContainer,
            {
              borderColor, // Animated value - funciona
              elevation, // CORREÇÃO: Usando valor estático
            },
            disabled && styles.inputContainerDisabled,
            error && styles.inputContainerError,
          ]}
        >
          {/* Label flutuante */}
          {label && (
            <Animated.Text
              style={[
                styles.label,
                {
                  top: labelTop, // Animated value - funciona
                  fontSize: labelFontSize, // Animated value - funciona
                  color: labelColor, // Animated value - funciona
                  backgroundColor, // CORREÇÃO: Usando valor estático
                },
                disabled && styles.labelDisabled,
              ]}
              numberOfLines={1}
            >
              {label}
            </Animated.Text>
          )}

          {/* TextInput */}
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={handleChangeText}
            placeholder={isFocused || !label ? placeholder : ''}
            placeholderTextColor="#9CA3AF"
            editable={!disabled}
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
            autoFocus={autoFocus}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              styles.textarea,
              label && styles.textareaWithLabel,
              inputStyle,
            ]}
            textAlignVertical="top"
            {...props}
          />

          {/* Contador de caracteres */}
          {showCharacterCount && maxLength && (
            <View style={styles.characterCountContainer}>
              <Text
                style={[
                    characterCount > maxLength 
                    ? [styles.characterCount, styles.characterCountError]
                    : isNearLimit 
                    ? [styles.characterCount, styles.characterCountWarning]
                    : styles.characterCount
                ]}
              >
                {characterCount}/{maxLength}
              </Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Mensagens de ajuda e erro */}
      <View style={styles.messageContainer}>
        {error && errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : helperText ? (
          <Text style={styles.helperText}>{helperText}</Text>
        ) : null}
      </View>
    </View>
  );
}

// Componente Textarea com FormField (para uso com react-hook-form)
interface TextareaFieldProps extends TextareaProps {
  name: string;
  control?: any;
  rules?: any;
}

function TextareaField({
  name,
  control,
  rules,
  ...textareaProps
}: TextareaFieldProps) {
  // Esta é uma implementação simplificada
  // Em um caso real, você integraria com react-hook-form
  return <Textarea {...textareaProps} />;
}

// Componente Textarea para diferentes tamanhos
interface SizedTextareaProps extends TextareaProps {
  size?: 'sm' | 'md' | 'lg';
}

function SizedTextarea({ size = 'md', ...props }: SizedTextareaProps) {
  const sizeStyles = {
    sm: styles.textareaSm,
    md: styles.textareaMd,
    lg: styles.textareaLg,
  };

  return (
    <Textarea
      {...props}
      inputStyle={[sizeStyles[size], props.inputStyle]}
    />
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  touchableContainer: {
    width: '100%',
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
    minHeight: 120,
    position: 'relative',
  },
  inputContainerDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  inputContainerError: {
    borderColor: '#DC2626',
  },
  label: {
    position: 'absolute',
    left: 12,
    paddingHorizontal: 4,
    zIndex: 1,
    fontWeight: '500' as const,
  },
  labelDisabled: {
    color: '#9CA3AF',
  },
  textarea: {
    fontSize: 16,
    color: '#111827',
    padding: 0,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textareaWithLabel: {
    paddingTop: 4,
  },
  textareaSm: {
    fontSize: 14,
    minHeight: 80,
  },
  textareaMd: {
    fontSize: 16,
    minHeight: 100,
  },
  textareaLg: {
    fontSize: 18,
    minHeight: 120,
  },
  characterCountContainer: {
    position: 'absolute',
    bottom: 8,
    right: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  characterCountWarning: {
    color: '#F59E0B',
    fontWeight: '500' as const,
  },
  characterCountError: {
    color: '#DC2626',
    fontWeight: '600' as const,
  },
  messageContainer: {
    marginTop: 4,
    minHeight: 20,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500' as const,
  },
});

// Hook para uso simplificado
function useTextareaState(initialValue = '') {
  const [value, setValue] = useState(initialValue);

  const clear = () => setValue('');

  return {
    value,
    setValue,
    clear,
  };
}

// Exportações
export {
  SizedTextarea, Textarea,
  TextareaField, useTextareaState
};

