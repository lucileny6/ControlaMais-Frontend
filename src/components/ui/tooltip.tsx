import React, { createContext, useContext, useRef, useState } from 'react';
import {
  Dimensions,
  LayoutChangeEvent,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';

// Tipos e interfaces
interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRect: { x: number; y: number; width: number; height: number } | null;
  setTriggerRect: (rect: any) => void;
}

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

interface TooltipProps {
  children: React.ReactNode;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  sideOffset?: number;
  style?: ViewStyle;
}

// Context
const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

// Utilitário para combinar estilos
const cn = (...classes: (string | undefined | false | null)[]): any => {
  return classes.filter(Boolean).join(' ');
};

// Hook personalizado para usar o context
const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
};

// Componente Provider
function TooltipProvider({ 
  children, 
  delayDuration = 0 
}: TooltipProviderProps) {
  const [open, setOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<any>(null);

  return (
    <TooltipContext.Provider value={{ 
      open, 
      setOpen, 
      triggerRect, 
      setTriggerRect 
    }}>
      {children}
    </TooltipContext.Provider>
  );
}

// Componente Tooltip principal
function Tooltip({ children }: TooltipProps) {
  return (
    <TooltipProvider>
      {children}
    </TooltipProvider>
  );
}

// Componente Trigger
function TooltipTrigger({ children, style }: TooltipTriggerProps) {
  const { setOpen, setTriggerRect } = useTooltip();
  const triggerRef = useRef<View>(null);

  const handlePress = () => {
    // Medir a posição do trigger
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerRect({ x, y, width, height });
      setOpen(true);
    });
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
  };

  return (
    <TouchableOpacity
      ref={triggerRef}
      onPress={handlePress}
      onLayout={handleLayout}
      style={style}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );
}

// Componente Content
function TooltipContent({ 
  children, 
  className, 
  sideOffset = 0, 
  style 
}: TooltipContentProps) {
  const { open, setOpen, triggerRect } = useTooltip();
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContentSize({ width, height });
  };

  const calculatePosition = () => {
    if (!triggerRect) return { top: 0, left: 0 };

    const screen = Dimensions.get('window');
    const { x, y, width, height } = triggerRect;

    // Posição padrão: abaixo do elemento
    let top = y + height + sideOffset;
    let left = x + (width - contentSize.width) / 2;

    // Ajustar para não sair da tela
    if (top + contentSize.height > screen.height) {
      // Se não couber abaixo, mostrar acima
      top = y - contentSize.height - sideOffset;
    }

    if (left < 0) {
      left = 8; // Margem mínima
    } else if (left + contentSize.width > screen.width) {
      left = screen.width - contentSize.width - 8;
    }

    return { top, left };
  };

  const position = calculatePosition();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => setOpen(false)}
      >
        <View
          style={[
            styles.content,
            position,
            style,
          ]}
          onLayout={handleLayout}
        >
          <Text style={styles.text}>{children}</Text>
          {/* Seta do tooltip */}
          <View style={[styles.arrow, styles.arrowBottom]} />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// Estilos
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    position: 'absolute',
    backgroundColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 200,
    elevation: 5,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  arrow: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#000000',
    transform: [{ rotate: '45deg' }],
  },
  arrowBottom: {
    top: -4,
    alignSelf: 'center',
  },
  arrowTop: {
    bottom: -4,
    alignSelf: 'center',
  },
  arrowLeft: {
    right: -4,
    top: '50%',
    marginTop: -4,
  },
  arrowRight: {
    left: -4,
    top: '50%',
    marginTop: -4,
  },
});

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };

