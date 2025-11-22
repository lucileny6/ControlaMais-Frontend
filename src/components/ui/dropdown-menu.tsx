import { Check, ChevronRight, Circle } from 'lucide-react-native';
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
interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DropdownMenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<View | null>;
  position: { x: number; y: number; width: number; height: number };
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | undefined>(undefined);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (context === undefined) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu');
  }
  return context;
}

// Componente Principal
function DropdownMenu({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [position, setPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const triggerRef = useRef<View>(null);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const contextValue: DropdownMenuContextType = {
    open,
    setOpen,
    triggerRef,
    position,
  };

  return (
    <DropdownMenuContext.Provider value={contextValue}>
      <View {...props}>{children}</View>
    </DropdownMenuContext.Provider>
  );
}

// Trigger Component
function DropdownMenuTrigger({ children, ...props }: { children: React.ReactNode }) {
  const { setOpen, triggerRef } = useDropdownMenu();

  const handlePress = () => {
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setOpen(true);
      });
    } else {
      setOpen(true);
    }
  };

  return (
    <TouchableOpacity 
      ref={triggerRef}
      onPress={handlePress}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

// Content Component
interface DropdownMenuContentProps {
  children: React.ReactNode;
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  style?: any;
}

function DropdownMenuContent({
  children,
  sideOffset = 4,
  align = 'start',
  style,
  ...props
}: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef, position } = useDropdownMenu();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const contentRef = useRef<View>(null);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (open) {
      // Medir a posição do trigger
      if (triggerRef.current) {
        triggerRef.current.measureInWindow((x, y, width, height) => {
          // A posição será usada para calcular o posicionamento
        });
      }

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
      scaleAnim.setValue(0.95);
    }
  }, [open, slideAnim, scaleAnim]);

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setContentSize({ width, height });
  };

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
              ref={contentRef}
              style={[
                styles.content,
                style,
                {
                  opacity,
                  transform: [
                    { translateY },
                    { scale: scaleAnim },
                  ],
                },
              ]}
              onLayout={handleLayout}
              {...props}
            >
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Group Component
function DropdownMenuGroup({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.group, style]}>{children}</View>;
}

// Item Components
function DropdownMenuItem({
  children,
  onSelect,
  disabled = false,
  variant = 'default',
  style,
  ...props
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  style?: any;
}) {
  const { setOpen } = useDropdownMenu();

  const handlePress = () => {
    if (disabled) return;
    onSelect?.();
    setOpen(false);
  };

  return (
    <TouchableOpacity
      style={[
        styles.item,
        variant === 'destructive' && styles.itemDestructive,
        disabled && styles.itemDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <Text
        style={[
          styles.itemText,
          variant === 'destructive' && styles.itemTextDestructive,
          disabled && styles.itemTextDisabled,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

function DropdownMenuCheckboxItem({
  children,
  checked = false,
  onSelect,
  disabled = false,
  style,
  ...props
}: {
  children: React.ReactNode;
  checked?: boolean;
  onSelect?: (checked: boolean) => void;
  disabled?: boolean;
  style?: any;
}) {
  const { setOpen } = useDropdownMenu();

  const handlePress = () => {
    if (disabled) return;
    onSelect?.(!checked);
    setOpen(false);
  };

  return (
    <TouchableOpacity
      style={[
        styles.item,
        styles.checkboxItem,
        disabled && styles.itemDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <View style={styles.checkboxContainer}>
        {checked && <Check size={16} color="#007AFF" />}
      </View>
      <Text style={[styles.itemText, disabled && styles.itemTextDisabled]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

function DropdownMenuRadioItem({
  children,
  checked = false,
  onSelect,
  disabled = false,
  style,
  ...props
}: {
  children: React.ReactNode;
  checked?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  style?: any;
}) {
  const { setOpen } = useDropdownMenu();

  const handlePress = () => {
    if (disabled) return;
    onSelect?.();
    setOpen(false);
  };

  return (
    <TouchableOpacity
      style={[
        styles.item,
        styles.radioItem,
        disabled && styles.itemDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <View style={styles.radioContainer}>
        {checked && <Circle size={8} fill="#007AFF" color="#007AFF" />}
      </View>
      <Text style={[styles.itemText, disabled && styles.itemTextDisabled]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

// Label Component
function DropdownMenuLabel({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.label, style]}>
      <Text style={styles.labelText}>{children}</Text>
    </View>
  );
}

// Separator Component
function DropdownMenuSeparator({ style }: { style?: any }) {
  return <View style={[styles.separator, style]} />;
}

// Shortcut Component
function DropdownMenuShortcut({ keys, style }: { keys: string; style?: any }) {
  return (
    <View style={[styles.shortcut, style]}>
      <Text style={styles.shortcutText}>{keys}</Text>
    </View>
  );
}

// Sub Menu Components
function DropdownMenuSub({ children, trigger, style }: { 
  children: React.ReactNode;
  trigger: React.ReactNode;
  style?: any;
}) {
  const [isSubOpen, setIsSubOpen] = useState(false);

  return (
    <View style={style}>
      <DropdownMenuItem onSelect={() => setIsSubOpen(true)}>
        <View style={styles.subTrigger}>
          <Text style={styles.itemText}>{trigger}</Text>
          <ChevronRight size={16} color="#6B7280" />
        </View>
      </DropdownMenuItem>
      
      {isSubOpen && (
        <View style={styles.subContent}>
          {children}
        </View>
      )}
    </View>
  );
}

function DropdownMenuSubContent({ children, style }: { 
  children: React.ReactNode;
  style?: any;
}) {
  return <View style={[styles.subContent, style]}>{children}</View>;
}

// Radio Group Component
function DropdownMenuRadioGroup({ children, style }: { 
  children: React.ReactNode;
  style?: any;
}) {
  return <View style={[styles.radioGroup, style]}>{children}</View>;
}

// Estilos
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    minWidth: 200,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  group: {
    marginVertical: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    minHeight: 36,
  },
  itemText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  itemDestructive: {
    backgroundColor: 'transparent',
  },
  itemTextDestructive: {
    color: '#DC2626',
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemTextDisabled: {
    color: '#9CA3AF',
  },
  checkboxItem: {
    paddingLeft: 8,
  },
  radioItem: {
    paddingLeft: 8,
  },
  checkboxContainer: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 3,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioContainer: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    marginVertical: 4,
    marginHorizontal: 8,
  },
  shortcut: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  shortcutText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  subTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  subContent: {
    marginLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
    paddingLeft: 4,
  },
  radioGroup: {
    gap: 2,
  },
});

// Hook para uso simplificado
function useDropdownMenuState(initialState = false) {
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
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuTrigger, useDropdownMenu,
  useDropdownMenuState
};

