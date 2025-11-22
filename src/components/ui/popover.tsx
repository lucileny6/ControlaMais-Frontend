import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PopoverProps {
  children: React.ReactNode;
}

function Popover({ children, ...props }: PopoverProps) {
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

interface PopoverTriggerProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

function PopoverTrigger({ children, open, setOpen, ...props }: PopoverTriggerProps) {
  return (
    <TouchableOpacity onPress={() => setOpen?.(!open)} {...props}>
      {children}
    </TouchableOpacity>
  );
}

interface PopoverContentProps {
  className?: string; // Note: className is not directly supported in RN; you can map it to styles if using a library like NativeWind
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  style?: ViewStyle;
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  children,
  open,
  setOpen,
  style,
  ...props
}: PopoverContentProps) {
  if (!open) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={() => setOpen?.(false)}>
      <TouchableOpacity
        style={styles.overlay}
        onPress={() => setOpen?.(false)}
        activeOpacity={1}
      >
        <View
          style={[
            styles.content,
            {
              // Basic alignment mapping (center by default)
              alignSelf: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center',
              marginTop: sideOffset, // Approximate sideOffset as top margin
            },
            style, // Allow custom styles
          ]}
          {...props}
        >
          {children}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

interface PopoverAnchorProps {
  children: React.ReactNode;
}

function PopoverAnchor({ children, ...props }: PopoverAnchorProps) {
  // In RN, anchoring is handled via Modal positioning; this can be a wrapper if needed
  return <View {...props}>{children}</View>;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  content: {
    backgroundColor: '#ffffff', // Equivalent to bg-popover
    borderRadius: 8, // rounded-md
    padding: 16, // p-4
    elevation: 5, 
    width: 288, // w-72
    maxWidth: '80%', // Prevent overflow on small screens
  },
});

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };

