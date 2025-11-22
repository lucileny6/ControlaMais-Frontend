import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';

// Tipos
type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';
type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  position?: ToastPosition;
}

interface ToasterProps {
  position?: ToastPosition;
  duration?: number;
  offset?: number;
  theme?: 'light' | 'dark' | 'auto';
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// Context
const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

// Hook para usar o toaster
export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Provider Component
function ToastProvider({ 
  children,
  defaultPosition = 'top-center',
  defaultDuration = 4000,
}: { 
  children: React.ReactNode;
  defaultPosition?: ToastPosition;
  defaultDuration?: number;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      position: defaultPosition,
      duration: defaultDuration,
      ...toast,
    };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-remove se tiver duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

// Toaster Component
function Toaster({ 
  position = 'top-center',
  duration = 4000,
  offset = 16,
  theme = 'light',
}: ToasterProps) {
  const { toasts, removeToast } = useToast();

  const getPositionStyle = (position: ToastPosition): ViewStyle => {
    const baseStyle = {
      position: 'absolute' as const,
      zIndex: 9999,
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyle, top: offset, left: offset };
      case 'top-center':
        return { ...baseStyle, top: offset, left: '50%', transform: [{ translateX: -Dimensions.get('window').width * 0.4 }] };
      case 'top-right':
        return { ...baseStyle, top: offset, right: offset };
      case 'bottom-left':
        return { ...baseStyle, bottom: offset, left: offset };
      case 'bottom-center':
        return { ...baseStyle, bottom: offset, left: '50%', transform: [{ translateX: -Dimensions.get('window').width * 0.4 }] };
      case 'bottom-right':
        return { ...baseStyle, bottom: offset, right: offset };
      default:
        return { ...baseStyle, top: offset, left: '50%', transform: [{ translateX: -Dimensions.get('window').width * 0.4 }] };
    }
  };

  const getThemeColors = () => {
    if (theme === 'dark') {
      return {
        background: '#1F2937',
        text: '#F9FAFB',
        border: '#374151',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      };
    }

    // Light theme
    return {
      background: '#FFFFFF',
      text: '#111827',
      border: '#E5E7EB',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    };
  };

  const colors = getThemeColors();

  const getToastStyle = (type: ToastType) => {
    const baseStyle = {
      backgroundColor: colors.background,
      borderColor: colors.border,
    };

    switch (type) {
      case 'success':
        return { ...baseStyle, borderLeftColor: colors.success };
      case 'error':
        return { ...baseStyle, borderLeftColor: colors.error };
      case 'warning':
        return { ...baseStyle, borderLeftColor: colors.warning };
      case 'info':
        return { ...baseStyle, borderLeftColor: colors.info };
      default:
        return baseStyle;
    }
  };

  const getIcon = (type: ToastType) => {
    const iconProps = { size: 20 };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} color={colors.success} />;
      case 'error':
        return <AlertCircle {...iconProps} color={colors.error} />;
      case 'warning':
        return <AlertTriangle {...iconProps} color={colors.warning} />;
      case 'info':
        return <Info {...iconProps} color={colors.info} />;
      default:
        return <Info {...iconProps} color={colors.info} />;
    }
  };

  // Agrupar toasts por posição
  const groupedToasts = toasts.reduce((acc, toast) => {
    const toastPosition = toast.position || position;
    if (!acc[toastPosition]) {
      acc[toastPosition] = [];
    }
    acc[toastPosition].push(toast);
    return acc;
  }, {} as Record<ToastPosition, Toast[]>);

  return (
    <>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <SafeAreaView
          key={position}
          style={[styles.container, getPositionStyle(position as ToastPosition)]}
          pointerEvents="box-none"
        >
          <View style={styles.toastsContainer}>
            {positionToasts.map((toast) => (
              <ToastItem
                key={toast.id}
                toast={toast}
                onDismiss={removeToast}
                style={getToastStyle(toast.type)}
                colors={colors}
                icon={getIcon(toast.type)}
              />
            ))}
          </View>
        </SafeAreaView>
      ))}
    </>
  );
}

// Toast Item Component
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
  style: any;
  colors: any;
  icon: React.ReactNode;
}

function ToastItem({ toast, onDismiss, style, colors, icon }: ToastItemProps) {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
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
  }, [slideAnim, fadeAnim]);

  const handleDismiss = () => {
    // Animação de saída
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.toastContent}>
        <View style={styles.toastIcon}>
          {icon}
        </View>
        <Text style={[styles.toastMessage, { color: colors.text }]}>
          {toast.message}
        </Text>
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    maxWidth: Dimensions.get('window').width * 0.8,
  },
  toastsContainer: {
    gap: 8,
  },
  toast: {
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    elevation: 4,
    padding: 12,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  toastIcon: {
    marginTop: 2,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    padding: 2,
  },
});

// Hook simplificado para uso rápido
function useToaster() {
  const { addToast } = useToast();

  const toast = {
    success: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
      addToast({ type: 'success', message, ...options });
    },
    error: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
      addToast({ type: 'error', message, ...options });
    },
    warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
      addToast({ type: 'warning', message, ...options });
    },
    info: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
      addToast({ type: 'info', message, ...options });
    },
    default: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
      addToast({ type: 'default', message, ...options });
    },
  };

  return toast;
}

// Componente para uso direto (sem provider)
function StandaloneToaster() {
  return (
    <ToastProvider>
      <Toaster />
    </ToastProvider>
  );
}

// Exportações
export {
  StandaloneToaster, Toaster, ToastProvider, useToaster
};

