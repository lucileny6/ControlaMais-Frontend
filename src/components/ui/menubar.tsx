import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react-native'; // Assuming lucide-react-native for icons
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

// Utility function for className (if using NativeWind, otherwise ignore or map manually)
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

interface MenubarProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function Menubar({ className, children, style, ...props }: MenubarProps) {
  return (
    <View style={[styles.menubar, style]} {...props}>
      {children}
    </View>
  );
}

interface MenubarMenuProps {
  children: React.ReactNode;
}

function MenubarMenu({ children, ...props }: MenubarMenuProps) {
  return <View {...props}>{children}</View>;
}

interface MenubarGroupProps {
  children: React.ReactNode;
}

function MenubarGroup({ children, ...props }: MenubarGroupProps) {
  return <View {...props}>{children}</View>;
}

interface MenubarPortalProps {
  children: React.ReactNode;
}

function MenubarPortal({ children, ...props }: MenubarPortalProps) {
  // In RN, portal is simulated via Modal; pass children directly
  return <>{children}</>;
}

interface MenubarRadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

function MenubarRadioGroup({ value, onValueChange, children, ...props }: MenubarRadioGroupProps) {
  return (
    <View {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<MenubarRadioItemProps>(child)) {
          const childValue = child.props.value
          if(childValue !== undefined) {
            return React.cloneElement(child, {
              selectedValue: value,
              onValueChange,
            })
          }
        }

        return child;

      })}
    </View>
  );
}

interface MenubarTriggerProps {
  className?: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

function MenubarTrigger({ className, children, onPress, style, ...props }: MenubarTriggerProps) {
  return (
    <TouchableOpacity style={[styles.trigger, style]} onPress={onPress} {...props}>
      {children}
    </TouchableOpacity>
  );
}

interface MenubarContentProps {
  className?: string;
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
  sideOffset?: number;
  children: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  style?: ViewStyle;
}

function MenubarContent({
  className,
  align = 'start',
  alignOffset = -4,
  sideOffset = 8,
  children,
  open,
  onClose,
  style,
  ...props
}: MenubarContentProps) {
  if (!open) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View
          style={[
            styles.content,
            {
              alignSelf: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center',
              marginTop: sideOffset,
              marginLeft: alignOffset,
            },
            style,
          ]}
          {...props}
        >
          <ScrollView>{children}</ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

interface MenubarItemProps {
  className?: string;
  inset?: boolean;
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

function MenubarItem({
  inset,
  variant = 'default',
  children,
  onPress,
  disabled,
  style,
  ...props
}: MenubarItemProps) {

  return (
    <TouchableOpacity
      style={[
        styles.item,
        inset ? styles.inset : undefined,
        variant === 'destructive' ? styles.destructiveContainer : undefined,
        disabled ? styles.disabled : undefined,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

interface MenubarCheckboxItemProps {
  className?: string;
  children: React.ReactNode;
  checked?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

function MenubarCheckboxItem({
  className,
  children,
  checked,
  onPress,
  disabled,
  style,
  ...props
}: MenubarCheckboxItemProps) {
  return (
    <TouchableOpacity
      style={[styles.checkboxItem, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <View style={styles.indicator}>
        {checked && <CheckIcon size={16} />}
      </View>
      {children}
    </TouchableOpacity>
  );
}

interface MenubarRadioItemProps {
  className?: string;
  children: React.ReactNode;
  value?: string;
  selectedValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

function MenubarRadioItem({
  className,
  children,
  value,
  selectedValue,
  onValueChange,
  disabled,
  style,
  ...props
}: MenubarRadioItemProps) {
  const isSelected = selectedValue === value;
  return (
    <TouchableOpacity
      style={[styles.radioItem, disabled && styles.disabled, style]}
      onPress={() => onValueChange?.(value!)}
      disabled={disabled}
      {...props}
    >
      <View style={styles.indicator}>
        {isSelected && <CircleIcon size={8} fill="currentColor" />}
      </View>
      {children}
    </TouchableOpacity>
  );
}

interface MenubarLabelProps {
  className?: string;
  inset?: boolean;
  children: React.ReactNode;
  style?: TextStyle;
}

function MenubarLabel({ className, inset, children, style, ...props }: MenubarLabelProps) {
  return (
    <Text style={[styles.label, inset && styles.inset, style]} {...props}>
      {children}
    </Text>
  );
}

interface MenubarSeparatorProps {
  className?: string;
  style?: ViewStyle;
}

function MenubarSeparator({ className, style, ...props }: MenubarSeparatorProps) {
  return <View style={[styles.separator, style]} {...props} />;
}

interface MenubarShortcutProps {
  className?: string;
  children: React.ReactNode;
  style?: TextStyle;
}

function MenubarShortcut({ className, children, style, ...props }: MenubarShortcutProps) {
  return (
    <Text style={[styles.shortcut, style]} {...props}>
      {children}
    </Text>
  );
}

interface MenubarSubProps {
  children: React.ReactNode;
}

function MenubarSub({ children, ...props }: MenubarSubProps) {
  return <View {...props}>{children}</View>;
}

interface MenubarSubTriggerProps {
  className?: string;
  inset?: boolean;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

function MenubarSubTrigger({
  className,
  inset,
  children,
  onPress,
  style,
  ...props
}: MenubarSubTriggerProps) {
  return (
    <TouchableOpacity style={[styles.subTrigger, inset && styles.inset, style]} onPress={onPress} {...props}>
      {children}
      <ChevronRightIcon size={16} />
    </TouchableOpacity>
  );
}

interface MenubarSubContentProps {
  className?: string;
  children: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  style?: ViewStyle;
}

function MenubarSubContent({ className, children, open, onClose, style, ...props }: MenubarSubContentProps) {
  if (!open) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={[styles.subContent, style]} {...props}>
          <ScrollView>{children}</ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menubar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff', // bg-background
    height: 36, // h-9
    borderRadius: 6, // rounded-md
    borderWidth: 1,
    borderColor: '#e5e7eb', // border
    elevation: 2,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4, // rounded-sm
    paddingHorizontal: 8, // px-2
    paddingVertical: 4, // py-1
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#ffffff', // bg-popover
    borderRadius: 6, // rounded-md
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 4, // p-1
    elevation: 5,
    minWidth: 192, // min-w-[12rem]
    maxHeight: '50%', // Prevent overflow
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 4, // rounded-sm
    paddingHorizontal: 8, // px-2
    paddingVertical: 6, // py-1.5
    backgroundColor: 'transparent',
  },
  inset: {
    paddingLeft: 32, // pl-8
  },

  destructiveContainer: {
    backgroundColor: '#fef2f2', // fundo vermelho claro
  },

  destructiveText: {
    color: '#dc2626', // text-destructive
  },
  disabled: {
    opacity: 0.5,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 2, // rounded-xs
    paddingVertical: 6, // py-1.5
    paddingRight: 8, // pr-2
    paddingLeft: 32, // pl-8
    backgroundColor: 'transparent',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 2, // rounded-xs
    paddingVertical: 6, // py-1.5
    paddingRight: 8, // pr-2
    paddingLeft: 32, // pl-8
    backgroundColor: 'transparent',
  },
  indicator: {
    position: 'absolute',
    left: 8, // left-2
    width: 14, // size-3.5
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    paddingHorizontal: 8, // px-2
    paddingVertical: 6, // py-1.5
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
  },
  separator: {
    backgroundColor: '#e5e7eb', // bg-border
    marginHorizontal: -4, // -mx-1
    marginVertical: 4, // my-1
    height: 1, // h-px
  },
  shortcut: {
    color: '#6b7280', // text-muted-foreground
    fontSize: 12, // text-xs
    marginLeft: 'auto',
    letterSpacing: 0.1, // tracking-widest
  },
  subTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4, // rounded-sm
    paddingHorizontal: 8, // px-2
    paddingVertical: 6, // py-1.5
    backgroundColor: 'transparent',
  },
  subContent: {
    backgroundColor: '#ffffff', // bg-popover
    borderRadius: 6, // rounded-md
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 4, // p-1
    elevation: 5,
    minWidth: 128, // min-w-[8rem]
    maxHeight: '50%',
  },
});

export {
  Menubar, MenubarCheckboxItem, MenubarContent,
  MenubarGroup, MenubarItem, MenubarLabel, MenubarMenu, MenubarPortal, MenubarRadioGroup,
  MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger
};

