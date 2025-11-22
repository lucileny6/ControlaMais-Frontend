import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

interface HoverCardProps {
  children: React.ReactNode;
}

function HoverCard({ children, ...props }: HoverCardProps) {
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

interface HoverCardTriggerProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

function HoverCardTrigger({ children, open, setOpen, ...props }: HoverCardTriggerProps) {
  return (
    <TouchableOpacity onPress={() => setOpen?.(!open)} {...props}>
      {children}
    </TouchableOpacity>
  );
}

interface HoverCardContentProps {
  children: React.ReactNode;
  className?: string; // Note: className is not directly supported in RN; you can map it to styles if using a library like NativeWind
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  style?: ViewStyle;
}

function HoverCardContent({
  children,
  className,
  align = 'center',
  sideOffset = 4,
  open,
  setOpen,
  style,
  ...props
}: HoverCardContentProps) {
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
    width: 256, // w-64
    maxWidth: '80%', // Prevent overflow on small screens
  },
});

export { HoverCard, HoverCardContent, HoverCardTrigger };

