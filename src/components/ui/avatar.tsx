// components/ui/avatar.tsx
import React from 'react';
import { Image, StyleSheet, Text, View, type ImageProps, type ViewProps } from 'react-native';

interface AvatarProps extends ViewProps {
    size?: number;
    children: React.ReactNode;
}

function Avatar({ size = 32, style, children, ...props }: AvatarProps) {
    return (
        <View
        style={[
            styles.avatar,
            { 
            width: size, 
            height: size, 
            borderRadius: size / 2 
            },
            style
        ]}
        {...props}
        >
        {children}
        </View>
    );
}

interface AvatarImageProps extends ImageProps {
    size?: number;
}

function AvatarImage({ size, style, ...props }: AvatarImageProps) {
    return (
        <Image
        style={[
            styles.image,
            size ? { width: size, height: size } : undefined,
            style
        ]}
        {...props}
        />
    );
}

interface AvatarFallbackProps extends ViewProps {
    size?: number;
    children: React.ReactNode;
}

function AvatarFallback({ size, style, children, ...props }: AvatarFallbackProps) {
    return (
        <View
        style={[
            styles.fallback,
            size ? { width: size, height: size, borderRadius: size / 2 } : undefined,
            style
        ]}
        {...props}
        >
        <Text style={[
            styles.fallbackText,
            size ? { fontSize: size * 0.4 } : undefined,
        ]}>
            {children}
        </Text>
        </View>
    );
}

const styles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
    backgroundColor: '#f5f5f5', // bg-muted
  },
  image: {
    width: '100%',
    height: '100%',
    aspectRatio: 1,
  },
  fallback: {
    flex: 1,
    backgroundColor: '#e5e5e5', // bg-muted
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
  },
  fallbackText: {
    color: '#666666', // text-muted-foreground
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export { Avatar, AvatarFallback, AvatarImage };
