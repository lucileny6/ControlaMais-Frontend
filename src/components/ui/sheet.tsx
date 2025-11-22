import { XIcon } from 'lucide-react-native'; // Assuming lucide-react-native for icons
import React, { useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

// Utility function for className (if using NativeWind, otherwise ignore or map manually)
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

const { width, height } = Dimensions.get('window');

interface SheetProps {
  children: React.ReactNode;
}

function Sheet({ children, ...props }: SheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <View {...props}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { open, setOpen })
          : child
      )}
    </View>
  );
}

interface SheetTriggerProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

function SheetTrigger({ children, open, setOpen, ...props }: SheetTriggerProps) {
  return (
    <TouchableOpacity onPress={() => setOpen?.(true)} {...props}>
      {children}
    </TouchableOpacity>
  );
}

interface SheetCloseProps {
  children?: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

function SheetClose({ children, open, setOpen, ...props }: SheetCloseProps) {
  return (
    <TouchableOpacity onPress={() => setOpen?.(false)} {...props}>
      {children}
    </TouchableOpacity>
  );
}

interface SheetPortalProps {
  children: React.ReactNode;
}

function SheetPortal({ children, ...props }: SheetPortalProps) {
  // In RN, portal is simulated via Modal; pass children directly
  return <>{children}</>;
}

interface SheetOverlayProps {
  className?: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  style?: ViewStyle;
}

function SheetOverlay({ className, open, setOpen, style, ...props }: SheetOverlayProps) {
  if (!open) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={() => setOpen?.(false)}>
      <TouchableOpacity
        style={[styles.overlay, style]}
        onPress={() => setOpen?.(false)}
        activeOpacity={1}
        {...props}
      />
    </Modal>
  );
}

interface SheetContentProps {
  className?: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  open?: boolean;
  setOpen?: (open: boolean) => void;
  style?: ViewStyle;
}

function SheetContent({
  className,
  children,
  side = 'right',
  open,
  setOpen,
  style,
  ...props
}: SheetContentProps) {
  if (!open) return null;

  const contentStyle = [
    styles.content,
    side === 'right' && styles.right,
    side === 'left' && styles.left,
    side === 'top' && styles.top,
    side === 'bottom' && styles.bottom,
    style,
  ];

  return (
    <Modal transparent animationType="slide" onRequestClose={() => setOpen?.(false)}>
      <SheetOverlay open={open} setOpen={setOpen} />
      <View style={contentStyle} {...props}>
        {children}
        <SheetClose
          open={open}
          setOpen={setOpen}
        >
          <View style = {styles.closeButton}>
            <XIcon size={16} />
            <Text style={styles.srOnly}>Close</Text>
          </View>
        </SheetClose>
      </View>
    </Modal>
  );
}

interface SheetHeaderProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function SheetHeader({ className, children, style, ...props }: SheetHeaderProps) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
}

interface SheetFooterProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function SheetFooter({ className, children, style, ...props }: SheetFooterProps) {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
}

interface SheetTitleProps {
  className?: string;
  children: React.ReactNode;
  style?: TextStyle;
}

function SheetTitle({ className, children, style, ...props }: SheetTitleProps) {
  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
}

interface SheetDescriptionProps {
  className?: string;
  children: React.ReactNode;
  style?: TextStyle;
}

function SheetDescription({ className, children, style, ...props }: SheetDescriptionProps) {
  return (
    <Text style={[styles.description, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // bg-black/50
    zIndex: 50,
  },
  content: {
    position: 'absolute',
    backgroundColor: '#ffffff', // bg-background
    zIndex: 50,
    flexDirection: 'column',
    gap: 16, // gap-4
    elevation: 5,
  },
  right: {
    top: 0,
    bottom: 0,
    right: 0,
    width: width * 0.75, // w-3/4
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
    maxWidth: 384, // sm:max-w-sm
  },
  left: {
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.75,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    maxWidth: 384,
  },
  top: {
    left: 0,
    right: 0,
    top: 0,
    height: 'auto', // h-auto
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  bottom: {
    left: 0,
    right: 0,
    bottom: 0,
    height: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  closeButton: {
    position: 'absolute',
    top: 16, // top-4
    right: 16, // right-4
    borderRadius: 2, // rounded-xs
    opacity: 0.7,
    padding: 8,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'column',
    gap: 6, // gap-1.5
    padding: 16, // p-4
  },
  footer: {
    marginTop: 'auto', // mt-auto
    flexDirection: 'column',
    gap: 8, // gap-2
    padding: 16, // p-4
  },
  title: {
    color: '#000000', // text-foreground
    fontWeight: '600', // font-semibold
  },
  description: {
    color: '#6b7280', // text-muted-foreground
    fontSize: 14, // text-sm
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
  Sheet, SheetClose,
  SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger
};

