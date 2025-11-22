import { X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

// Tipos
interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

function useDialog() {
  const context = React.useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a Dialog');
  }
  return context;
}

// Componente Principal
function Dialog({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const contextValue: DialogContextType = {
    open,
    setOpen,
  };

  return (
    <DialogContext.Provider value={contextValue}>
      <View {...props}>{children}</View>
    </DialogContext.Provider>
  );
}

// Trigger Component
function DialogTrigger({ children, ...props }: { children: React.ReactNode }) {
  const { setOpen } = useDialog();

  return (
    <TouchableOpacity onPress={() => setOpen(true)} {...props}>
      {children}
    </TouchableOpacity>
  );
}

// Overlay Component
function DialogOverlay({ style, ...props }: { style?: any }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { open } = useDialog();

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
interface DialogContentProps {
  children: React.ReactNode;
  showCloseButton?: boolean;
  style?: any;
  overlayStyle?: any;
}

function DialogContent({
  children,
  showCloseButton = true,
  style,
  overlayStyle,
  ...props
}: DialogContentProps) {
  const { open, setOpen } = useDialog();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [open, slideAnim, scaleAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
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
        <View style={styles.modalContainer}>
          <DialogOverlay style={overlayStyle} />
          
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.content,
                style,
                {
                  transform: [
                    { translateY },
                    { scale: scaleAnim },
                  ],
                },
              ]}
              {...props}
            >
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setOpen(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Close Component
function DialogClose({ children, ...props }: { children: React.ReactNode }) {
  const { setOpen } = useDialog();

  return (
    <TouchableOpacity onPress={() => setOpen(false)} {...props}>
      {children}
    </TouchableOpacity>
  );
}

// Header Component
function DialogHeader({ children, style, ...props }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
}

// Footer Component
function DialogFooter({ children, style, ...props }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
}

// Title Component
function DialogTitle({ children, style, ...props }: { children: React.ReactNode; style?: any }) {
  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
}

// Description Component
function DialogDescription({ children, style, ...props }: { children: React.ReactNode; style?: any }) {
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  header: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
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
function useDialogState(initialState = false) {
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
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, useDialog,
  useDialogState
};

