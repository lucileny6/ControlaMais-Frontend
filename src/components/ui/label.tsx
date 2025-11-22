import { cn } from '@/lib/utils';
import React from 'react';
import { Text, TextProps } from 'react-native';

interface LabelProps extends TextProps {
    className?: string;
}

function Label({ className, style, ...props }: LabelProps) {
    return (
        <Text
        style={cn(
            'text-sm font-medium text-gray-900',
            'flex items-center gap-2',
            className
        )}
        {...props}
        />
    );
}

export { Label };
