import {
  Check,
  ChevronRight,
  Circle,
  MoreHorizontal,
} from 'lucide-react-native';
import React, { createContext, useContext, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

// Tipos
interface ContextMenuProps {
  children: React.ReactNode;
  trigger?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  style?: any;
}

interface ContextMenuContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number }) => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (context === undefined) {
    throw new Error('useContextMenu must be used within a ContextMenu');
  }
  return context;
}

// Componente Principal
function ContextMenu({ 
  children, 
  trigger, 
  onOpenChange, 
  style,
  ...props 
}: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const contextValue: ContextMenuContextType = {
    isOpen,
    setIsOpen: handleOpenChange,
    position,
    setPosition,
  };

  return (
    <ContextMenuContext.Provider value={contextValue}>
      <View style={style} {...props}>
        {trigger || (
          <ContextMenuTrigger>
            <MoreHorizontal size={20} color="#6B7280" />
          </ContextMenuTrigger>
        )}
        {children}
      </View>
    </ContextMenuContext.Provider>
  );
}

// Trigger Component
function ContextMenuTrigger({ 
  children, 
  style,
  ...props 
}: { 
  children: React.ReactNode;
  style?: any;
}) {
  const { setIsOpen, setPosition } = useContextMenu();

  const handlePress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    // Calcular posição para evitar que o menu saia da tela
    let x = pageX;
    let y = pageY;

    // Ajustar posição se necessário (será ajustado no conteúdo)
    setPosition({ x, y });
    setIsOpen(true);
  };

  const handleLongPress = (event: any) => {
    handlePress(event);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={style}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

// Content Component
function ContextMenuContent({ 
  children, 
  style,
  ...props 
}: { 
  children: React.ReactNode;
  style?: any;
}) {
  const { isOpen, setIsOpen, position } = useContextMenu();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const contentRef = useRef<View>(null);
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [isOpen, slideAnim]);

  const scale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Calcular posição final ajustada
  const getAdjustedPosition = () => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const menuWidth = 200;
    const menuHeight = contentSize.height || 300;

    let x = position.x;
    let y = position.y;

    // Ajustar horizontalmente
    if (x + menuWidth > screenWidth) {
      x = screenWidth - menuWidth - 16;
    }

    // Ajustar verticalmente
    if (y + menuHeight > screenHeight) {
      y = screenHeight - menuHeight - 16;
    }

    return { x: Math.max(16, x), y: Math.max(16, y) };
  };

  const adjustedPosition = getAdjustedPosition();

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setContentSize({ width, height });
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              ref={contentRef}
              style={[
                styles.content,
                style,
                {
                  opacity,
                  transform: [{ scale }],
                  top: adjustedPosition.y,
                  left: adjustedPosition.x,
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

// Item Components
function ContextMenuItem({
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
  const { setIsOpen } = useContextMenu();

  const handlePress = () => {
    if (disabled) return;
    onSelect?.();
    setIsOpen(false);
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

function ContextMenuCheckboxItem({
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
  const { setIsOpen } = useContextMenu();

  const handlePress = () => {
    if (disabled) return;
    onSelect?.(!checked);
    setIsOpen(false);
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

function ContextMenuRadioItem({
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
  const { setIsOpen } = useContextMenu();

  const handlePress = () => {
    if (disabled) return;
    onSelect?.();
    setIsOpen(false);
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

// Group Components
function ContextMenuGroup({ 
  children, 
  style 
}: { 
  children: React.ReactNode;
  style?: any;
}) {
  return <View style={[styles.group, style]}>{children}</View>;
}

function ContextMenuLabel({ 
  children, 
  style 
}: { 
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[styles.label, style]}>
      <Text style={styles.labelText}>{children}</Text>
    </View>
  );
}

function ContextMenuSeparator({ style }: { style?: any }) {
  return <View style={[styles.separator, style]} />;
}

function ContextMenuShortcut({ 
  keys, 
  style 
}: { 
  keys: string;
  style?: any;
}) {
  return (
    <View style={[styles.shortcut, style]}>
      <Text style={styles.shortcutText}>{keys}</Text>
    </View>
  );
}

// Sub Menu Components (Simplificado)
function ContextMenuSub({ 
  children, 
  trigger,
  style 
}: { 
  children: React.ReactNode;
  trigger: React.ReactNode;
  style?: any;
}) {
  const [isSubOpen, setIsSubOpen] = useState(false);

  return (
    <View style={style}>
      <ContextMenuItem onSelect={() => setIsSubOpen(true)}>
        <View style={styles.subTrigger}>
          <Text style={styles.itemText}>{trigger}</Text>
          <ChevronRight size={16} color="#6B7280" />
        </View>
      </ContextMenuItem>
      
      {isSubOpen && (
        <View style={styles.subContent}>
          {children}
        </View>
      )}
    </View>
  );
}

function ContextMenuSubContent({ 
  children, 
  style 
}: { 
  children: React.ReactNode;
  style?: any;
}) {
  return <View style={[styles.subContent, style]}>{children}</View>;
}

// Estilos
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  content: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    minWidth: 200,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  group: {
    marginVertical: 2,
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
});

// Exportações
export {
  ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator,
  ContextMenuShortcut, ContextMenuSub,
  ContextMenuSubContent, ContextMenuTrigger, useContextMenu
};

