import React, { useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Label } from './label';

// Tipos
interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  style?: any;
  thumbStyle?: any;
  trackStyle?: any;
  size?: 'sm' | 'md' | 'lg';
}

function Switch({
  checked: controlledChecked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  style,
  thumbStyle,
  trackStyle,
  size = 'md',
  ...props
}: SwitchProps) {
  const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : uncontrolledChecked;

  // Animações
  const thumbPosition = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const trackColor = useRef(new Animated.Value(checked ? 1 : 0)).current;

  // Tamanhos baseados na prop size
  const getSizes = () => {
    switch (size) {
      case 'sm':
        return {
          trackWidth: 36,
          trackHeight: 20,
          thumbSize: 16,
          thumbSpacing: 2,
        };
      case 'lg':
        return {
          trackWidth: 52,
          trackHeight: 28,
          thumbSize: 24,
          thumbSpacing: 2,
        };
      case 'md':
      default:
        return {
          trackWidth: 44,
          trackHeight: 24,
          thumbSize: 20,
          thumbSpacing: 2,
        };
    }
  };

  const sizes = getSizes();

  // Atualizar animações quando o estado mudar
  React.useEffect(() => {
    const toValue = checked ? 1 : 0;
    
    Animated.parallel([
      Animated.spring(thumbPosition, {
        toValue,
        useNativeDriver: false,
        damping: 15,
        stiffness: 120,
      }),
      Animated.timing(trackColor, {
        toValue,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [checked, thumbPosition, trackColor]);

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) return;

    const newChecked = !checked;
    
    if (!isControlled) {
      setUncontrolledChecked(newChecked);
    }
    
    onCheckedChange?.(newChecked);
  };

  // Interpolações de cor
  const trackBackgroundColor = trackColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#007AFF'], // Cinza para Azul
  });

  const thumbTranslateX = thumbPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [sizes.thumbSpacing, sizes.trackWidth - sizes.thumbSize - sizes.thumbSpacing],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      style={style}
      {...props}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: sizes.trackWidth,
            height: sizes.trackHeight,
            backgroundColor: trackBackgroundColor,
            opacity: disabled ? 0.5 : 1,
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: sizes.thumbSize,
              height: sizes.thumbSize,
              transform: [{ translateX: thumbTranslateX }],
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// Componente Switch com Label
interface SwitchWithLabelProps extends SwitchProps {
  label: string;
  labelPosition?: 'left' | 'right';
  description?: string;
  labelStyle?: any;
  descriptionStyle?: any;
  containerStyle?: any;
}

function SwitchWithLabel({
  label,
  labelPosition = 'right',
  description,
  labelStyle,
  descriptionStyle,
  containerStyle,
  ...switchProps
}: SwitchWithLabelProps) {
  const content = (
    <View style={styles.labelContent}>
      <Label>{label}</Label>
      {description && (
        <Text style={[styles.description, descriptionStyle]}>{description}</Text>
      )}
    </View>
  );

  return (
    <View style={[styles.labelContainer, containerStyle]}>
      {labelPosition === 'left' && content}
      <Switch {...switchProps} />
      {labelPosition === 'right' && content}
    </View>
  );
}

// Componente Switch com Ícone
interface SwitchWithIconProps extends SwitchProps {
  checkedIcon?: React.ReactNode;
  uncheckedIcon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

function SwitchWithIcon({
  checkedIcon,
  uncheckedIcon,
  iconPosition = 'left',
  ...switchProps
}: SwitchWithIconProps) {
  const icon = switchProps.checked ? checkedIcon : uncheckedIcon;

  return (
    <View style={styles.iconContainer}>
      {iconPosition === 'left' && icon}
      <Switch {...switchProps} />
      {iconPosition === 'right' && icon}
    </View>
  );
}

// Componente Switch para Formulários
interface FormSwitchProps extends SwitchWithLabelProps {
  name: string;
  control?: any; // Para integração com react-hook-form
}

function FormSwitch({
  name,
  control,
  onCheckedChange,
  ...props
}: FormSwitchProps) {
  // Esta é uma implementação simplificada
  // Em um caso real, você integraria com react-hook-form ou outro gerenciador de formulários
  
  const handleValueChange = (checked: boolean) => {
    onCheckedChange?.(checked);
    // Aqui você também atualizaria o formulário se control estiver disponível
  };

  return (
    <SwitchWithLabel
      onCheckedChange={handleValueChange}
      {...props}
    />
  );
}

// Estilos
const styles = StyleSheet.create({
  track: {
    borderRadius: 9999,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  thumb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    elevation: 2,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labelContent: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

// Hook para uso simplificado
function useSwitchState(defaultChecked = false) {
  const [checked, setChecked] = React.useState(defaultChecked);

  const toggle = () => setChecked(prev => !prev);

  return {
    checked,
    setChecked,
    toggle,
  };
}

// Exportações
export {
  FormSwitch, Switch, SwitchWithIcon, SwitchWithLabel, useSwitchState
};

