// components/ui/breadcrumb.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  type TextProps,
  type ViewProps
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

interface BreadcrumbProps extends ViewProps {
  children: React.ReactNode;
}

function Breadcrumb({ children, style, ...props }: BreadcrumbProps) {
  return (
    <View 
      style={[styles.breadcrumb, style]} 
      accessibilityRole="menu"
      accessibilityLabel="breadcrumb"
      {...props}
    >
      {children}
    </View>
  );
}

interface BreadcrumbListProps extends ViewProps {
  children: React.ReactNode;
}

function BreadcrumbList({ children, style, ...props }: BreadcrumbListProps) {
  return (
    <View 
      style={[styles.breadcrumbList, style]} 
      {...props}
    >
      {children}
    </View>
  );
}

interface BreadcrumbItemProps extends ViewProps {
  children: React.ReactNode;
}

function BreadcrumbItem({ children, style, ...props }: BreadcrumbItemProps) {
  return (
    <View 
      style={[styles.breadcrumbItem, style]} 
      {...props}
    >
      {children}
    </View>
  );
}

interface BreadcrumbLinkProps extends TouchableOpacityProps {
  children: React.ReactNode;
  asChild?: boolean;
  onPress?: () => void;
}

function BreadcrumbLink({ 
  children, 
  asChild = false, 
  onPress, 
  style, 
  ...props 
}: BreadcrumbLinkProps) {
  if (asChild) {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          onPress,
          style: [styles.breadcrumbLink, style],
          ...props
        } as any);
      }
      return child;
    })?.[0];
  }

  return (
    <TouchableOpacity
      style={[styles.breadcrumbLink, style]}
      onPress={onPress}
      {...props}
    >
      <Text style={styles.breadcrumbLinkText}>{children}</Text>
    </TouchableOpacity>
  );
}

interface BreadcrumbPageProps extends TextProps {
  children: React.ReactNode;
}

function BreadcrumbPage({ children, style, ...props }: BreadcrumbPageProps) {
  return (
    <Text
      style={[styles.breadcrumbPage, style]}
      accessibilityRole="text"
      accessibilityState={{ disabled: true }}
      {...props}
    >
      {children}
    </Text>
  );
}

interface BreadcrumbSeparatorProps {
  children?: React.ReactNode;
}

function BreadcrumbSeparator({ children }: BreadcrumbSeparatorProps) {
  return (
    <View style={styles.breadcrumbSeparator}>
      {children || <Ionicons name="chevron-forward" size={16} color="#666666" />}
    </View>
  );
}

interface BreadcrumbEllipsisProps {
  children?: React.ReactNode;
}

function BreadcrumbEllipsis({ children }: BreadcrumbEllipsisProps) {
  return (
    <View 
      style={styles.breadcrumbEllipsis}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {children || <Ionicons name="ellipsis-horizontal" size={16} color="#666666" />}
    </View>
  );
}

const styles = StyleSheet.create({
  breadcrumb: {
    // Container principal
  },
  breadcrumbList: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breadcrumbLink: {
    // Estilo do link clicável
  },
  breadcrumbLinkText: {
    fontSize: 14,
    color: '#666666', // text-muted-foreground
    fontWeight: '400',
  },
  breadcrumbPage: {
    fontSize: 14,
    color: '#000000', // text-foreground
    fontWeight: '400',
  },
  breadcrumbSeparator: {
    marginHorizontal: 2,
  },
  breadcrumbEllipsis: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export {
  Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator
};

