import React from 'react';
import { Text, View, ViewProps } from 'react-native';

interface BadgeProps extends ViewProps {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    children: string;
}

export function Badge({ 
    variant = 'default', 
    children, 
    style, 
    ...props 
}: BadgeProps) {

    const baseStyle = {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        alignSelf: 'flex-start' as const,
    };

    const variantStyles = {
        default: {
        backgroundColor: '#3b82f6',
        borderColor: 'transparent',
        },
        secondary: {
        backgroundColor: '#6b7280',
        borderColor: 'transparent',
        },
        destructive: {
        backgroundColor: '#ef4444',
        borderColor: 'transparent',
        },
        outline: {
        backgroundColor: 'transparent',
        borderColor: '#d1d5db',
        },
    };

    const textColors = {
        default: '#ffffff',
        secondary: '#ffffff', 
        destructive: '#ffffff',
        outline: '#374151',
    };

    return (
        <View
        style={[
            baseStyle,
            variantStyles[variant],
            style
        ]}
        {...props}
        >
        <Text style={{
            fontSize: 12,
            fontWeight: '500' as const,
            color: textColors[variant],
        }}>
            {children}
        </Text>
        </View>
    );
}