import { X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

// Tipos
interface DrawerProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DrawerContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  position: 'left' | 'right' | 'top' | 'bottom';
}

const DrawerContext = React.createContext<DrawerContextType | undefined>(undefined);

function useDrawer() {
  const context = React.useContext(DrawerContext);
  if (context === undefined) {
    throw new Error('useDrawer must be used within a Drawer');
  }
  return context;
}

// Componente Principal
function Drawer({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  position = 'right',
  ...props
}: DrawerProps & { position?: 'left' | 'right' | 'top' | 'bottom' }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const contextValue: DrawerContextType = {
    open,
    setOpen,
    position,
  };

  return (
    <DrawerContext.Provider value={contextValue}>
      <View {...props}>{children}</View>
    </DrawerContext.Provider>
  );
}

// Trigger Component
function DrawerTrigger({ children, ...props }: { children: React.ReactNode }) {
  const { setOpen } = useDrawer();

  return (
    <TouchableOpacity onPress={() => setOpen(true)} {...props}>
      {children}
    </TouchableOpacity>
  );
}

// Close Component
function DrawerClose({ children, ...props }: { children: React.ReactNode }) {
  const { setOpen } = useDrawer();

  return (
    <TouchableOpacity onPress={() => setOpen(false)} {...props}>
      {children}
    </TouchableOpacity>
  );
}

// Overlay Component
function DrawerOverlay({ style, ...props }: { style?: any }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { open } = useDrawer();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: open ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [open, fadeAnim]);

  if (!open) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        { opacity: fadeAnim },
        style,
      ]}
      {...props}
    />
  );
}

// Content Component
interface DrawerContentProps {
  children: React.ReactNode;
  showHandle?: boolean;
  showCloseButton?: boolean;
  style?: any;
  overlayStyle?: any;
}

function DrawerContent({
  children,
  showHandle = true,
  showCloseButton = true,
  style,
  overlayStyle,
  ...props
}: DrawerContentProps) {
  const { open, setOpen, position } = useDrawer();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.Value(0)).current;
  const screenDimensions = Dimensions.get('window');

  // Calcular dimensões baseadas na posição
  const getDrawerDimensions = () => {
    switch (position) {
      case 'left':
      case 'right':
        return {
          width: Math.min(screenDimensions.width * 0.8, 400),
          height: screenDimensions.height,
        };
      case 'top':
      case 'bottom':
        return {
          width: screenDimensions.width,
          height: Math.min(screenDimensions.height * 0.8, 600),
        };
      default:
        return {
          width: Math.min(screenDimensions.width * 0.8, 400),
          height: screenDimensions.height,
        };
    }
  };

  const drawerDimensions = getDrawerDimensions();

  // Configurar animação base
  useEffect(() => {
    if (open) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      slideAnim.setValue(0);
      pan.setValue(0);
    }
  }, [open, slideAnim, pan]);

  // Configurar PanResponder para gestos
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Só responder a gestos significativos
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        switch (position) {
          case 'left':
            pan.setValue(Math.max(0, -gestureState.dx));
            break;
          case 'right':
            pan.setValue(Math.max(0, gestureState.dx));
            break;
          case 'top':
            pan.setValue(Math.max(0, -gestureState.dy));
            break;
          case 'bottom':
            pan.setValue(Math.max(0, gestureState.dy));
            break;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 50;
        let shouldClose = false;

        switch (position) {
          case 'left':
            shouldClose = gestureState.dx < -threshold;
            break;
          case 'right':
            shouldClose = gestureState.dx > threshold;
            break;
          case 'top':
            shouldClose = gestureState.dy < -threshold;
            break;
          case 'bottom':
            shouldClose = gestureState.dy > threshold;
            break;
        }

        if (shouldClose) {
          setOpen(false);
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    })
  ).current;

  // Calcular transform baseada na posição
  const getTransform = () => {
    const baseTransform = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const translate = pan.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 100],
    });

    switch (position) {
      case 'left':
        return [
          {
            translateX: Animated.multiply(
              baseTransform,
              -drawerDimensions.width
            ).interpolate({
              inputRange: [-drawerDimensions.width, 0],
              outputRange: [-drawerDimensions.width, 0],
            }),
          },
          { translateX: Animated.multiply(translate, -1) },
        ];
      case 'right':
        return [
          {
            translateX: Animated.multiply(
              baseTransform,
              drawerDimensions.width
            ).interpolate({
              inputRange: [0, drawerDimensions.width],
              outputRange: [drawerDimensions.width, 0],
            }),
          },
          { translateX: translate },
        ];
      case 'top':
        return [
          {
            translateY: Animated.multiply(
              baseTransform,
              -drawerDimensions.height
            ).interpolate({
              inputRange: [-drawerDimensions.height, 0],
              outputRange: [-drawerDimensions.height, 0],
            }),
          },
          { translateY: Animated.multiply(translate, -1) },
        ];
      case 'bottom':
        return [
          {
            translateY: Animated.multiply(
              baseTransform,
              drawerDimensions.height
            ).interpolate({
              inputRange: [0, drawerDimensions.height],
              outputRange: [drawerDimensions.height, 0],
            }),
          },
          { translateY: translate },
        ];
      default:
        return [];
    }
  };

  const getDrawerStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      backgroundColor: '#FFFFFF',
      elevation: 8,
    };

    switch (position) {
      case 'left':
        return {
          ...baseStyle,
          top: 0,
          left: 0,
          width: drawerDimensions.width,
          height: drawerDimensions.height,
          borderTopRightRadius: 12,
          borderBottomRightRadius: 12,
        };
      case 'right':
        return {
          ...baseStyle,
          top: 0,
          right: 0,
          width: drawerDimensions.width,
          height: drawerDimensions.height,
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
        };
      case 'top':
        return {
          ...baseStyle,
          top: 0,
          left: 0,
          right: 0,
          height: drawerDimensions.height,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom: 0,
          left: 0,
          right: 0,
          height: drawerDimensions.height,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        };
    }
  };

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <DrawerOverlay style={overlayStyle} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            getDrawerStyle(),
            style,
            {
              transform: getTransform(),
            },
          ]}
          {...panResponder.panHandlers}
          {...props}
        >
          {showHandle && (position === 'bottom' || position === 'top') && (
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          )}

          {showCloseButton && (
            <TouchableOpacity
              style={[
                styles.closeButton,
                position === 'left' || position === 'right'
                  ? styles.closeButtonSide
                  : styles.closeButtonTop,
              ]}
              onPress={() => setOpen(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          )}

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

// Header Component
function DrawerHeader({ children, style, ...props }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
}

// Footer Component
function DrawerFooter({ children, style, ...props }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
}

// Title Component
function DrawerTitle({ children, style, ...props }: { children: React.ReactNode; style?: any }) {
  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
}

// Description Component
function DrawerDescription({ children, style, ...props }: { children: React.ReactNode; style?: any }) {
  return (
    <Text style={[styles.description, style]} {...props}>
      {children}
    </Text>
  );
}

// Estilos
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    zIndex: 1,
    padding: 8,
  },
  closeButtonSide: {
    top: 16,
    right: 16,
  },
  closeButtonTop: {
    top: 16,
    right: 16,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  footer: {
    marginTop: 'auto',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

// Hook para uso simplificado
function useDrawerState(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

// Exportações
export {
  Drawer, DrawerClose,
  DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger, useDrawer,
  useDrawerState
};

