// components/ui/toast.tsx
import { ToastActionElement, ToastProps, useToast } from '@/hooks/use-toast';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Componente para renderizar toasts
export function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <View style={styles.viewport}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </View>
  );
}

function Toast({ id, title, description, action, open = true, onOpenChange }: ToastProps) {
  const { dismiss } = useToast();

  const handleDismiss = () => {
    onOpenChange?.(false);
    dismiss(id);
  };

  if (!open) return null;

  return (
    <View style={styles.toast}>
      <View style={styles.content}>
        {title && (
          <Text style={styles.title}>{title}</Text>
        )}
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
      {action && (
        <View style={styles.action}>
          {React.cloneElement(action, {
            onPress: () => {
              action.props.onPress?.();
              handleDismiss();
            },
          })}
        </View>
      )}
      <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

// Componente de ação para toast
export function ToastAction({ 
  altText, 
  onPress, 
  children 
}: { 
  altText: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionButton}>
      <Text style={styles.actionText}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  action: {
    marginLeft: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
});

// Re-export dos hooks e tipos
export { Toast, useToast };
export type { ToastActionElement, ToastProps };

