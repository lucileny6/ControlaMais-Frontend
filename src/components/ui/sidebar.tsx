import { PanelLeftIcon } from 'lucide-react-native'; // Assuming lucide-react-native for icons
import React, { useCallback, useMemo, useState } from 'react';
import { DimensionValue, Modal, ScrollView, StyleSheet, Text, TextInput, TextStyle, TouchableOpacity, useWindowDimensions, View, ViewStyle } from 'react-native';

// Utility function for className (if using NativeWind, otherwise ignore or map manually)
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

// Constants (adapted for RN)
const SIDEBAR_WIDTH = 256; // 16rem in px
const SIDEBAR_WIDTH_MOBILE = 288; // 18rem in px
const SIDEBAR_WIDTH_ICON = 48; // 3rem in px

type SidebarContextProps = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }
  return context;
}

interface SidebarProviderProps {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  style?: ViewStyle;
  children: React.ReactNode;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // md breakpoint
  const [openMobile, setOpenMobile] = useState(false);

  const [_open, _setOpen] = useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      // In RN, use AsyncStorage or similar for persistence instead of cookies
    },
    [setOpenProp, open]
  );

  const toggleSidebar = useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  // Keyboard shortcut removed for RN (no global window events)

  const state = open ? 'expanded' : 'collapsed';

  const contextValue = useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <View
        style={[
          styles.wrapper,
          {
            // Custom properties not directly supported; use direct values
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </SidebarContext.Provider>
  );
}

interface SidebarProps {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  style,
  ...props
}: SidebarProps) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === 'none') {
    return (
      <View style={[styles.sidebar, { width: SIDEBAR_WIDTH }, style]} {...props}>
        {children}
      </View>
    );
  }

  if (isMobile) {
    // Use a simple modal for mobile (assuming Sheet is converted)
    return (
      <Modal visible={openMobile} onRequestClose={() => setOpenMobile(false)} animationType="slide">
        <View style={[styles.mobileSidebar, { width: SIDEBAR_WIDTH_MOBILE }]}>
          <View style={styles.mobileHeader}>
            <Text>Sidebar</Text>
          </View>
          <ScrollView>{children}</ScrollView>
        </View>
      </Modal>
    );
  }

  return (
    <View
      style={[
        styles.desktopSidebar,
        side === 'right' && styles.right,
        variant === 'floating' && styles.floating,
        variant === 'inset' && styles.inset,
        collapsible === 'icon' && state === 'collapsed' && { width: SIDEBAR_WIDTH_ICON },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

interface SidebarTriggerProps {
  className?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

function SidebarTrigger({ className, onPress, style, ...props }: SidebarTriggerProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <TouchableOpacity
      style={[styles.trigger, style]}
      onPress={() => {
        onPress?.();
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon size={16} />
      <Text style={styles.srOnly}>Toggle Sidebar</Text>
    </TouchableOpacity>
  );
}

interface SidebarInsetProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function SidebarInset({ className, children, style, ...props }: SidebarInsetProps) {
  return (
    <View style={[styles.inset, style]} {...props}>
      {children}
    </View>
  );
}

interface SidebarInputProps {
  className?: string;
  style?: TextStyle;
  // Add other TextInput props
}

function SidebarInput({ className, style, ...props }: SidebarInputProps) {
  return <TextInput style={[styles.input, style]} {...props} />;
}

interface SidebarHeaderProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function SidebarHeader({ className, children, style, ...props }: SidebarHeaderProps) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
}

interface SidebarFooterProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function SidebarFooter({ className, children, style, ...props }: SidebarFooterProps) {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
}

interface SidebarSeparatorProps {
  className?: string;
  style?: ViewStyle;
}

function SidebarSeparator({ className, style, ...props }: SidebarSeparatorProps) {
  return <View style={[styles.separator, style]} {...props} />;
}

interface SidebarContentProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function SidebarContent({ className, children, style, ...props }: SidebarContentProps) {
  return (
    <ScrollView style={[styles.content, style]} {...props}>
      {children}
    </ScrollView>
  );
}

interface SidebarGroupProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function SidebarGroup({ className, children, style, ...props }: SidebarGroupProps) {
  return (
    <View style={[styles.group, style]} {...props}>
      {children}
    </View>
  );
}

interface SidebarGroupLabelProps {
  className?: string;
  children: React.ReactNode;
  style?: TextStyle;
}

function SidebarGroupLabel({ className, children, style, ...props }: SidebarGroupLabelProps) {
  return (
    <Text style={[styles.groupLabel, style]} {...props}>
      {children}
    </Text>
  );
}

interface SidebarGroupActionProps {
  className?: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

function SidebarGroupAction({ className, children, onPress, style, ...props }: SidebarGroupActionProps) {
  return (
    <TouchableOpacity style={[styles.groupAction, style]} onPress={onPress} {...props}>
      {children}
    </TouchableOpacity>
  );
}

interface SidebarGroupContentProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function SidebarGroupContent({ className, children, style, ...props }: SidebarGroupContentProps) {
  return (
    <View style={[styles.groupContent, style]} {...props}>
      {children}
    </View>
  );
}

interface SidebarMenuProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function SidebarMenu({ className, children, style, ...props }: SidebarMenuProps) {
  return (
    <View style={[styles.menu, style]} {...props}>
      {children}
    </View>
  );
}

interface SidebarMenuItemProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function SidebarMenuItem({ className, children, style, ...props }: SidebarMenuItemProps) {
  return (
    <View style={[styles.menuItem, style]} {...props}>
      {children}
    </View>
  );
}

interface SidebarMenuButtonProps {
  className?: string;
  children: React.ReactNode;
  isActive?: boolean;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  onPress?: () => void;
  style?: ViewStyle;
}

function SidebarMenuButton({
  className,
  children,
  isActive = false,
  variant = 'default',
  size = 'default',
  onPress,
  style,
  ...props
}: SidebarMenuButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.menuButton,
        variant === 'outline' && styles.outline,
        size === 'sm' && styles.sm,
        size === 'lg' && styles.lg,
        isActive && styles.active,
        style,
      ]}
      onPress={onPress}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

interface SidebarMenuActionProps {
  className?: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

function SidebarMenuAction({ className, children, onPress, style, ...props }: SidebarMenuActionProps) {
  return (
    <TouchableOpacity style={[styles.menuAction, style]} onPress={onPress} {...props}>
      {children}
    </TouchableOpacity>
  );
}

interface SidebarMenuBadgeProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function SidebarMenuBadge({ className, children, style, ...props }: SidebarMenuBadgeProps) {
  return (
    <View style={[styles.menuBadge, style]} {...props}>
      <Text>{children}</Text>
    </View>
  );
}

interface SidebarMenuSkeletonProps {
  className?: string;
  showIcon?: boolean;
  style?: ViewStyle;
}

function SidebarMenuSkeleton({ className, showIcon = false, style, ...props }: SidebarMenuSkeletonProps) {
  const width = useMemo(() => `${Math.floor(Math.random() * 40) + 50}%` as DimensionValue, []);
  
  return (
    <View style={[styles.skeleton, style]} {...props}>
      {showIcon && <View style={styles.skeletonIcon} />}
      <View style={[styles.skeletonText, { width }]} />
    </View>
  );
}

interface SidebarMenuSubProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function SidebarMenuSub({ className, children, style, ...props }: SidebarMenuSubProps) {
  return (
    <View style={[styles.menuSub, style]} {...props}>
      {children}
    </View>
  );
}

interface SidebarMenuSubItemProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function SidebarMenuSubItem({ className, children, style, ...props }: SidebarMenuSubItemProps) {
  return (
    <View style={[styles.menuSubItem, style]} {...props}>
      {children}
    </View>
  );
}

interface SidebarMenuSubButtonProps {
  className?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  isActive?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

function SidebarMenuSubButton({
  className,
  children,
  size = 'md',
  isActive = false,
  onPress,
  style,
  ...props
}: SidebarMenuSubButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.menuSubButton,
        size === 'sm' && styles.sm,
        isActive && styles.active,
        style,
      ]}
      onPress={onPress}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

// Placeholder for SidebarRail (complex in RN, simplified)
function SidebarRail({ ...props }: any) {
  return <View {...props} />;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ffffff', // Approximate
  },
  sidebar: {
    backgroundColor: '#f8f9fa', // bg-sidebar
    flexDirection: 'column',
  },
  mobileSidebar: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mobileHeader: {
    padding: 16,
  },
  desktopSidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#f8f9fa',
    zIndex: 10,
  },
  right: {
    left: undefined,
    right: 0,
  },
  floating: {
    borderRadius: 8,
    borderWidth: 1,
    elevation: 3,
  },
  trigger: {
    width: 28, // size-7
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  inset: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  input: {
    height: 32, // h-8
    backgroundColor: '#ffffff',
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: 'column',
    gap: 8, // gap-2
    padding: 8, // p-2
  },
  footer: {
    flexDirection: 'column',
    gap: 8,
    padding: 8,
  },
  separator: {
    backgroundColor: '#e5e7eb', // bg-sidebar-border
    marginHorizontal: 8, // mx-2
    height: 1,
  },
  content: {
    flex: 1,
    gap: 8,
    padding: 8,
  },
  group: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'column',
    padding: 8,
  },
  groupLabel: {
    height: 32, // h-8
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 8, // px-2
    fontSize: 12, // text-xs
    fontWeight: '500',
  },
  groupAction: {
    position: 'absolute',
    top: 14, // top-3.5
    right: 12, // right-3
    width: 20, // w-5
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    padding: 0,
  },
  groupContent: {
    width: '100%',
    fontSize: 14, // text-sm
  },
  menu: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'column',
    gap: 4, // gap-1
  },
  menuItem: {
    position: 'relative',
  },
  menuButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2
    borderRadius: 6,
    padding: 8, // p-2
    backgroundColor: 'transparent',
  },
  outline: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  sm: {
    height: 28, // h-7
    fontSize: 12, // text-xs
  },
  lg: {
    height: 48, // h-12
    fontSize: 14,
  },
  active: {
    backgroundColor: '#e5e7eb', // bg-sidebar-accent
    fontWeight: '500',
  },
  menuAction: {
    position: 'absolute',
    top: 6, // top-1.5
    right: 4, // right-1
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    padding: 0,
  },
  menuBadge: {
    position: 'absolute',
    right: 4, // right-1
    height: 20, // h-5
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 4, // px-1
    fontSize: 12, // text-xs
    fontWeight: '500',
  },
  skeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 6,
    paddingHorizontal: 8, // px-2
    height: 32, // h-8
  },
  skeletonIcon: {
    width: 16, // size-4
    height: 16,
    borderRadius: 4,
  },
  skeletonText: {
    height: 16, // h-4
    backgroundColor: '#e5e7eb', // Approximate skeleton
    borderRadius: 4,
  },
  menuSub: {
    marginLeft: 14, // mx-3.5
    flexDirection: 'column',
    gap: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb', // border-sidebar-border
    paddingLeft: 10, // px-2.5
    paddingVertical: 2, // py-0.5
  },
  menuSubItem: {
    position: 'relative',
  },
  menuSubButton: {
    height: 28, // h-7
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 6,
    paddingHorizontal: 8, // px-2
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
  },
});

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar
};

