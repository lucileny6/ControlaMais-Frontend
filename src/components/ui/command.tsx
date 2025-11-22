import { Search, X } from 'lucide-react-native';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, FlatList, ListRenderItem, Modal, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

// Tipos
interface CommandProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

interface CommandContextType {
  value: string;
  setValue: (value: string) => void;
  filteredItems: any[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

function useCommand() {
  const context = useContext(CommandContext);
  if (context === undefined) {
    throw new Error('useCommand must be used within a Command');
  }
  return context;
}

// Componente Principal
function CommandRoot({ children, style, ...props }: CommandProps) {
  const [value, setValue] = useState('');
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const contextValue: CommandContextType = {
    value,
    setValue,
    filteredItems,
    selectedIndex,
    setSelectedIndex,
  };

  return (
    <CommandContext.Provider value={contextValue}>
      <View style={[styles.command, style]} {...props}>
        {children}
      </View>
    </CommandContext.Provider>
  );
}

// Dialog Component
interface CommandDialogProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  style?: any;
}

function CommandDialog({
  visible,
  onDismiss,
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  style,
}: CommandDialogProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.dialogContent,
                style,
                { transform: [{ translateY }] }
              ]}
            >
              <View style={styles.dialogHeader}>
                <View>
                  {title && <Text style={styles.dialogTitle}>{title}</Text>}
                  {description && (
                    <Text style={styles.dialogDescription}>{description}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Input Component
interface CommandInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  style?: any;
  autoFocus?: boolean;
}

function CommandInput({
  placeholder = "Search...",
  value,
  onChangeText,
  style,
  autoFocus = true,
  ...props
}: CommandInputProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  return (
    <View style={[styles.inputWrapper, style]}>
      <Search size={20} color="#6B7280" style={styles.searchIcon} />
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        {...props}
      />
    </View>
  );
}

// List Component
interface CommandListProps {
  children: React.ReactNode;
  style?: any;
  data?: any[];
  keyExtractor?: (item: any, index: number) => string;
  renderItem?: (item: any) => React.ReactNode;
}

function CommandList({
  children,
  style,
  data,
  keyExtractor,
  renderItem,
  ...props
}: CommandListProps) {

  const renderFlatListItem: ListRenderItem<any> = ({item}) => {
    
    if(!renderItem) return null;

    const renderedItem = renderItem(item);

    if(renderedItem === undefined || renderedItem === null){
      
      return null;

    }

    return renderedItem as React.ReactElement
  }

  if (data && renderItem) {
    return (
      <FlatList
        data={data}
        keyExtractor={keyExtractor || ((item, index) => index.toString())}
        renderItem={renderFlatListItem}
        style={[styles.list, style]}
        keyboardShouldPersistTaps="handled"
        {...props}
      />
    );
  }

  return (
    <View style={[styles.list, style]} {...props}>
      {children}
    </View>
  );
}

// Empty Component
function CommandEmpty({ 
  message = "No results found.",
  style,
}: { 
  message?: string;
  style?: any;
}) {
  return (
    <View style={[styles.empty, style]}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// Group Component
interface CommandGroupProps {
  children: React.ReactNode;
  heading?: string;
  style?: any;
}

function CommandGroup({ children, heading, style }: CommandGroupProps) {
  return (
    <View style={[styles.group, style]}>
      {heading && (
        <Text style={styles.groupHeading}>{heading}</Text>
      )}
      {children}
    </View>
  );
}

// Item Component
interface CommandItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  style?: any;
  isSelected?: boolean;
}

function CommandItem({
  children,
  onSelect,
  disabled = false,
  style,
  isSelected = false,
  ...props
}: CommandItemProps) {
  return (
    <TouchableOpacity
      style={[
        styles.item,
        isSelected && styles.itemSelected,
        disabled && styles.itemDisabled,
        style,
      ]}
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

// Shortcut Component
function CommandShortcut({ 
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

// Separator Component
function CommandSeparator({ style }: { style?: any }) {
  return <View style={[styles.separator, style]} />;
}

// Hook para Command Palette
function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

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

// Componente de Trigger para abrir o Command
function CommandTrigger({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}) {
  const { open } = useCommandPalette();

  const handlePress = () => {
    onPress?.();
    open();
  };

  return (
    <TouchableOpacity onPress={handlePress} style={style}>
      {children}
    </TouchableOpacity>
  );
}

// Estilos
const styles = StyleSheet.create({
  command: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  dialogDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  list: {
    maxHeight: 300,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  group: {
    paddingVertical: 8,
  },
  groupHeading: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 6,
  },
  itemSelected: {
    backgroundColor: '#F3F4F6',
  },
  itemDisabled: {
    opacity: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  shortcut: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shortcutText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

// Exportações
export {
  CommandRoot as Command,
  CommandDialog, CommandEmpty,
  CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, CommandTrigger, useCommand, useCommandPalette
};

